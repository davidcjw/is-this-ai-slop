# Is This AI Generated? — Slop Lab

Paste any website URL and get a brutally honest **0–100 forensic score** of how
cookie-cutter and AI-generated it looks. We fingerprint the *default agent house
style* — the builder watermarks, the stock copy, the obligatory purple gradient —
and hand you an explainable verdict with the receipts.

> A heuristic toy, not a tribunal. The score reflects **visual & structural
> sameness**, not quality. Plenty of great sites are AI-built; plenty of slop is
> handmade.

## How the scoring works

The engine fetches a page server-side (no JS rendering) and runs ~20 detectors
across six weighted categories. Each category is capped so no single dimension
runs away with the score.

| Category | Max | What it sniffs |
|---|--:|---|
| 🏷️ Builder watermarks | 35 | v0, Lovable, Bolt, Framer, Webflow, Wix fingerprints; `meta generator`; leftover "Made with…" badges; Next.js **only when shipped with stock defaults** |
| 🧱 Default stack | 22 | shadcn/ui used verbatim, Lucide icons, Geist/Inter fonts; Tailwind **only when run with the stock theme** |
| ✍️ AI copywriting tells | 24 | LLM buzzwords ("seamlessly", "supercharge", "elevate"…), "it's not just X, it's Y", em-dash density, boilerplate CTAs, tricolon taglines |
| 📐 Structural clichés | 16 | The hero→features→testimonials→pricing→CTA skeleton, emoji headings, repeated rounded/shadow card grids |
| 🎨 Visual defaults | 16 | The purple/indigo→blue gradient, gradient clip-text headlines, glassmorphism + heavy rounding |
| 🚧 Placeholder residue | 12 | Lorem ipsum, `example.com`, John Doe, Unsplash stock heroes, untouched "Create Next App" titles |

**A note on stack choice.** Using Next.js, Tailwind or Vercel is *not* a tell —
they run countless hand-crafted sites, so penalising them just punishes
popularity. The tell is using them with the **defaults left untouched**. So the
framework signals only score when the site *also* ships stock markers (the
shadcn theme, Geist/Inter, the default gradient); a modern stack paired with
real design effort scores nothing. Hosting platform is ignored entirely.

Verdict bands: **Suspiciously Human** (0–18) · **Mostly Handcrafted** (19–38) ·
**AI-Assisted** (39–58) · **Heavily AI-Generated** (59–78) · **Textbook AI Slop** (79–100).

Detector logic lives in [`src/lib/analyzer.ts`](src/lib/analyzer.ts) — pure,
side-effect-free, and easy to extend. Add a new `Detector` to the relevant
registry and it's automatically included.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind v4** with a custom editorial/forensic theme (warm bone paper, ink, a
  single vermillion accent — deliberately built to score *low* on its own detector)
- **Framer Motion** for the hero reveal, score count-up, and staggered evidence log
- Fonts: **Instrument Serif** (display), **Hanken Grotesk** (body), **Space Mono** (data)
- Zero external APIs — the analyzer runs in a Node API route, so it's free to host

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build    # production build
npm run lint     # eslint
```

## API

`POST /api/analyze` with `{ "url": "example.com" }` returns the full
`AnalysisResult` (score, verdict, per-category breakdown, top signals). Private/
localhost ranges are blocked to prevent SSRF.

## Deploy

Optimised for [Vercel](https://vercel.com). Push to GitHub and import the repo —
every push to `main` auto-deploys.

---

Built, ironically, by an AI.
