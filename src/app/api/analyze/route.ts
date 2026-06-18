import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
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

function normalizeUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol)) return null;
    // Block obvious SSRF targets (localhost / private ranges / metadata).
    const host = u.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    ) {
      return null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** Fetch + analyze a normalized URL. Throws AnalyzeError on failure so that
 * failures are NOT written to the cache (only resolved values are cached). */
async function fetchAndAnalyze(url: string): Promise<AnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("html") && !contentType.includes("xml") && contentType !== "") {
      throw new AnalyzeError(422, "That URL didn't return a web page (no HTML content).");
    }

    const html = (await res.text()).slice(0, 1_500_000);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => (headers[k.toLowerCase()] = v));

    return analyze(html, headers, url, res.url || url);
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
