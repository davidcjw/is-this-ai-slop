import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { lookup } from "dns/promises";
import { type LookupAddress } from "dns";
import net from "net";
import { analyze, type AnalysisResult } from "@/lib/analyzer";

export const runtime = "nodejs";
export const maxDuration = 20;

// Cache a successful analysis for an hour, then serve stale for a day while
// revalidating. Same URL within the window is returned from cache instead of
// re-fetched — this is what makes the public API cheap to hit at scale.
const CACHE_SECONDS = 3600;
const SWR_SECONDS = 86400;
const CACHE_HEADER = `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${SWR_SECONDS}`;

/** Error carrying the HTTP status we want to surface to the client. */
class AnalyzeError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const MAX_REDIRECT_HOPS = 5;

/** True if a dotted-quad IPv4 string falls in a private / loopback / link-local
 * / reserved range that must never be reachable via SSRF. Malformed input is
 * treated as blocked (fail closed). */
function ipv4Blocked(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  return (
    a === 0 || // 0.0.0.0/8 "this network"
    a === 127 || // loopback
    a === 10 || // private
    (a === 100 && b >= 64 && b <= 127) || // CGNAT 100.64/10
    (a === 169 && b === 254) || // link-local
    (a === 172 && b >= 16 && b <= 31) || // private
    (a === 192 && b === 168) || // private
    a >= 224 // multicast / reserved
  );
}

/** True if an IPv6 address is loopback (::1), unspecified (::), unique-local
 * (fc00::/7), link-local (fe80::/10), or an IPv4-mapped address in a blocked
 * range. Fails closed on unexpected input. */
function ipv6Blocked(ip: string): boolean {
  const s = ip.toLowerCase().split("%")[0]; // drop any zone id
  if (s === "::1" || s === "::") return true;
  if (/^f[cd]/.test(s)) return true; // unique-local fc00::/7
  if (/^fe[89ab]/.test(s)) return true; // link-local fe80::/10
  const mapped = s.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) return ipv4Blocked(mapped[1]);
  return false;
}

/** Classify any literal IP (v4 or v6) as blocked; non-IPs fail closed. */
function ipBlocked(ip: string): boolean {
  const v = net.isIP(ip);
  if (v === 4) return ipv4Blocked(ip);
  if (v === 6) return ipv6Blocked(ip);
  return true;
}

/** Normalize decimal / octal / hex and shorthand IPv4 encodings (e.g.
 * "2130706433", "0x7f000001", "0177.1") to canonical dotted-quad, so encoded
 * loopback/private targets can be range-checked. Returns null when the host is
 * not a numeric IPv4 encoding. */
function toDottedIPv4(host: string): string | null {
  const parts = host.split(".");
  if (parts.length < 1 || parts.length > 4) return null;
  const nums: number[] = [];
  for (const p of parts) {
    let n: number;
    if (/^0x[0-9a-f]+$/i.test(p)) n = parseInt(p, 16);
    else if (/^0[0-7]+$/.test(p)) n = parseInt(p, 8);
    else if (/^\d+$/.test(p)) n = parseInt(p, 10);
    else return null;
    if (!Number.isFinite(n) || n < 0) return null;
    nums.push(n);
  }
  const leading = nums.slice(0, -1);
  const last = nums[nums.length - 1];
  if (leading.some((o) => o > 255)) return null;
  if (last > Math.pow(256, 4 - leading.length) - 1) return null;
  let value = last;
  for (let i = 0; i < leading.length; i++) value += leading[i] * Math.pow(256, 3 - i);
  if (value < 0 || value > 4294967295) return null;
  return [
    (value >>> 24) & 255,
    (value >>> 16) & 255,
    (value >>> 8) & 255,
    value & 255,
  ].join(".");
}

function normalizeUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol)) return null;
    // Block obvious SSRF targets by string form (localhost / private ranges /
    // metadata). This is a fast pre-filter; DNS-resolved IPs are re-checked in
    // assertHostAllowed before every fetch/redirect hop.
    const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "::" ||
      host.endsWith(".local") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }
    // Literal IPv6 (incl. IPv4-mapped / loopback) and numeric-encoded IPv4.
    if (net.isIP(host) === 6 && ipv6Blocked(host)) return null;
    const dotted = toDottedIPv4(host);
    if (dotted && ipv4Blocked(dotted)) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Resolve a hostname and reject if it (or any literal IP it already is)
 * points at a private / loopback / link-local / reserved address. This closes
 * the DNS-rebinding and encoded-IP gaps the string checks can miss. Called
 * before the initial fetch AND before following every redirect hop. */
async function assertHostAllowed(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (ipBlocked(host)) {
      throw new AnalyzeError(400, "That URL points to a private address.");
    }
    return;
  }
  let results: LookupAddress[];
  try {
    results = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new AnalyzeError(502, "Couldn't resolve that site's address.");
  }
  if (!results.length) {
    throw new AnalyzeError(502, "Couldn't resolve that site's address.");
  }
  for (const r of results) {
    if (ipBlocked(r.address)) {
      throw new AnalyzeError(400, "That URL resolves to a private address.");
    }
  }
}

/** Fetch + analyze a normalized URL. Throws AnalyzeError on failure so that
 * failures are NOT written to the cache (only resolved values are cached). */
async function fetchAndAnalyze(url: string): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    let currentUrl = url;
    let res: Response;
    // Follow redirects manually so every hop's host is re-validated (DNS +
    // range check) before we fetch it — `redirect: "follow"` would only vet
    // the initial URL and blindly chase Location into private space.
    for (let hop = 0; ; hop++) {
      await assertHostAllowed(new URL(currentUrl).hostname);
      res = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: "manual",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      const location = res.headers.get("location");
      if (res.status >= 300 && res.status < 400 && location) {
        if (hop >= MAX_REDIRECT_HOPS) {
          throw new AnalyzeError(502, "That site redirected too many times.");
        }
        const next = normalizeUrl(new URL(location, currentUrl).toString());
        if (!next) {
          throw new AnalyzeError(400, "That site redirected to a blocked address.");
        }
        currentUrl = next;
        continue;
      }
      break;
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("xml") && contentType !== "") {
      throw new AnalyzeError(422, "That URL didn't return a web page (no HTML content).");
    }

    const html = (await res.text()).slice(0, 1_500_000);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    return analyze(html, headers, url, currentUrl);
  } catch (err) {
    if (err instanceof AnalyzeError) throw err;
    const aborted = err instanceof Error && err.name === "AbortError";
    throw new AnalyzeError(
      aborted ? 504 : 502,
      aborted
        ? "The site took too long to respond. Try another URL."
        : "Couldn't reach that site. Check the URL and try again."
    );
  } finally {
    clearTimeout(timeout);
  }
}

/** Data-cache wrapper: memoizes the result per normalized URL across requests
 * (Vercel Data Cache), keyed so each URL gets its own entry. */
function analyzeCached(url: string): Promise<AnalysisResult> {
  return unstable_cache(() => fetchAndAnalyze(url), ["analyze-url", url], {
    revalidate: CACHE_SECONDS,
    tags: ["analyze", `analyze:${url}`],
  })();
}

/** Shared handler for both POST (app) and GET (public, CDN-cacheable) paths. */
async function handle(rawUrl: string): Promise<NextResponse> {
  const url = normalizeUrl(rawUrl);
  if (!url) {
    return NextResponse.json(
      { error: "Please enter a valid public website URL." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  try {
    const result = await analyzeCached(url);
    return NextResponse.json(result, { headers: { "Cache-Control": CACHE_HEADER } });
  } catch (err) {
    const status = err instanceof AnalyzeError ? err.status : 502;
    const message =
      err instanceof AnalyzeError ? err.message : "Couldn't reach that site.";
    return NextResponse.json(
      { error: message },
      { status, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  return handle(body.url || "");
}

// Public, shareable, edge-cacheable: GET /api/analyze?url=example.com
export async function GET(req: NextRequest) {
  return handle(req.nextUrl.searchParams.get("url") || "");
}
