import { describe, it, expect } from "vitest";
import {
  analyze,
  type AnalysisResult,
  type CategoryScore,
  type Signal,
  type SignalCategory,
} from "../analyzer";

/* ------------------------------------------------------------------ *
 * Test helpers
 * ------------------------------------------------------------------ */

/** Run the detector over a hand-crafted HTML fixture. */
function run(html: string, headers: Record<string, string> = {}): AnalysisResult {
  const url = "https://example.test/";
  return analyze(html, headers, url, url);
}

function cat(result: AnalysisResult, category: SignalCategory): CategoryScore {
  const found = result.categories.find((c) => c.category === category);
  if (!found) throw new Error(`category ${category} missing from result`);
  return found;
}

/** Raw (pre-cap) sum of every signal's points inside a category. */
function rawPoints(c: CategoryScore): number {
  return c.signals.reduce((sum, s) => sum + s.points, 0);
}

function hasSignal(c: CategoryScore, id: string): boolean {
  return c.signals.some((s) => s.id === id);
}

function signal(c: CategoryScore, id: string): Signal {
  const s = c.signals.find((x) => x.id === id);
  if (!s) throw new Error(`signal ${id} not present in ${c.category}`);
  return s;
}

/* ------------------------------------------------------------------ *
 * 1. Builder watermarks score high
 * ------------------------------------------------------------------ */

describe("builder watermarks", () => {
  // v0 + Framer generator + a leftover "Made with v0" badge.
  const html = `<!doctype html><html><head>
    <meta name="generator" content="Framer">
    <script src="https://v0.dev/chat/b/abc123"></script>
    <title>My Startup</title>
  </head><body>
    <main><h1>Welcome</h1></main>
    <footer>Made with v0</footer>
  </body></html>`;

  const result = run(html);
  const watermark = cat(result, "watermark");

  it("flags the AI builder itself (v0), taking the strongest single builder", () => {
    expect(hasSignal(watermark, "ai-builder")).toBe(true);
    // ai-builder reports the single strongest builder (v0 = 22), it does not stack.
    expect(signal(watermark, "ai-builder").points).toBe(22);
  });

  it("flags the leftover 'Made with …' badge", () => {
    expect(hasSignal(watermark, "made-with-badge")).toBe(true);
  });

  it("scores high in the watermark category", () => {
    // watermark should dominate — well above half its 35-point ceiling.
    expect(watermark.points).toBeGreaterThanOrEqual(30);
  });
});

/* ------------------------------------------------------------------ *
 * 2. Modern stack WITHOUT stock defaults scores ~0 on stack
 *    (verifies the stated nuance: framework presence alone is not a tell)
 * ------------------------------------------------------------------ */

describe("stack nuance: modern framework, custom design", () => {
  // Next.js + heavy Tailwind utility usage, but a bespoke font and none of the
  // stock shadcn/Geist/Lucide/purple-gradient markers.
  const customHtml = `<!doctype html><html><head>
    <style>:root{font-family:"Söhne",sans-serif}</style>
    <title>Bespoke Studio</title>
  </head><body>
    <header class="flex items-center justify-between px-6 py-4">
      <h1 class="text-4xl font-bold tracking-tight">Bespoke Studio</h1>
    </header>
    <section class="grid gap-4 px-6 py-4 mx-auto">
      <article class="rounded-lg px-6 py-4 text-xl font-semibold">One</article>
      <article class="rounded-lg px-6 py-4 text-lg font-medium">Two</article>
      <article class="flex items-center gap-4 px-6 py-4">Three</article>
      <article class="grid gap-4 px-6 py-4 justify-between">Four</article>
    </section>
    <script src="/_next/static/chunks/main-abc.js"></script>
  </body></html>`;

  const customResult = run(customHtml, { "x-powered-by": "Next.js" });

  it("scores ~0 on stack when the framework runs a genuine custom design", () => {
    expect(cat(customResult, "stack").points).toBe(0);
  });

  it("does not raise a Next.js watermark for a clearly-customised site", () => {
    // The nextjs detector only fires alongside untouched stock markers.
    expect(hasSignal(cat(customResult, "watermark"), "nextjs")).toBe(false);
  });

  // Same page, but now with the stock shadcn + Geist markers left untouched.
  const stockHtml = `<!doctype html><html><head>
    <style>:root{--font-geist-sans:Geist}</style>
    <title>Stock Studio</title>
  </head><body>
    <header class="flex items-center justify-between px-6 py-4" data-slot="header">
      <h1 class="text-4xl font-bold tracking-tight">Stock Studio</h1>
    </header>
    <section class="grid gap-4 px-6 py-4 mx-auto">
      <button data-slot="button" class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary text-primary-foreground focus-visible:ring-2">Get started</button>
      <article class="rounded-lg px-6 py-4 text-xl font-semibold bg-muted text-muted-foreground">One</article>
      <article class="rounded-lg px-6 py-4 text-lg font-medium">Two</article>
      <article class="flex items-center gap-4 px-6 py-4">Three</article>
    </section>
    <script src="/_next/static/chunks/main-abc.js"></script>
  </body></html>`;

  const stockResult = run(stockHtml, { "x-powered-by": "Next.js" });

  it("DOES score on stack once the stock theme is left untouched", () => {
    expect(cat(stockResult, "stack").points).toBeGreaterThan(0);
  });

  it("stock defaults score strictly higher on stack than the custom design", () => {
    expect(cat(stockResult, "stack").points).toBeGreaterThan(
      cat(customResult, "stack").points
    );
  });
});

/* ------------------------------------------------------------------ *
 * 3. Placeholder residue
 * ------------------------------------------------------------------ */

describe("placeholder residue", () => {
  const html = `<!doctype html><html><head><title>Coming soon</title></head><body>
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
    <a href="mailto:hello@example.com">hello@example.com</a>
    <p>Reach John Doe at name@example.com — Acme Inc.</p>
  </body></html>`;

  const placeholder = cat(run(html), "placeholder");

  it("detects leftover lorem ipsum copy", () => {
    expect(hasSignal(placeholder, "lorem")).toBe(true);
  });

  it("detects placeholder contact data (example.com / John Doe)", () => {
    expect(hasSignal(placeholder, "placeholder-data")).toBe(true);
  });

  it("accumulates real points in the placeholder category", () => {
    expect(placeholder.points).toBeGreaterThanOrEqual(6);
  });
});

/* ------------------------------------------------------------------ *
 * 4. Category caps are respected
 * ------------------------------------------------------------------ */

describe("category caps", () => {
  // Pile on every watermark signal so the raw sum blows past the 35 ceiling.
  const html = `<!doctype html><html><head>
    <meta name="generator" content="Next.js">
    <script src="https://v0.dev/chat/x"></script>
    <script src="https://lovable.dev/app"></script>
    <style>:root{--font-geist-sans:Geist}</style>
    <title>Kitchen Sink</title>
  </head><body>
    <div data-slot="root" class="bg-primary text-primary-foreground backdrop-blur">
      <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border-input focus-visible:ring-2">Get started</button>
    </div>
    <footer>Built with Lovable — Made with v0</footer>
    <script src="/_next/static/chunks/main-abc.js" id="__NEXT_DATA__"></script>
  </body></html>`;

  const result = run(html, { "x-powered-by": "Next.js" });
  const watermark = cat(result, "watermark");

  it("caps the watermark category at its 35-point max", () => {
    expect(watermark.points).toBe(35);
  });

  it("only caps because the uncapped raw total actually exceeds the max", () => {
    // Guard: a meaningless cap test would pass even if raw <= max.
    expect(rawPoints(watermark)).toBeGreaterThan(watermark.max);
  });

  it("every reported category stays within [0, its max]", () => {
    for (const c of result.categories) {
      expect(c.points).toBeGreaterThanOrEqual(0);
      expect(c.points).toBeLessThanOrEqual(c.max);
    }
  });

  it("keeps the overall score within 0–100", () => {
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
