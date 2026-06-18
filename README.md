# Is This AI Generated? — Slop Lab

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
[![Live](https://img.shields.io/badge/live-is--this--ai--slop.davidcjw.com-e8431c)](https://is-this-ai-slop.davidcjw.com)

> **[Try it live → is-this-ai-slop.davidcjw.com](https://is-this-ai-slop.davidcjw.com)**

<p align="center">
  <img src="docs/demo.png" alt="Is This AI Generated? — paste a URL and get a 0–100 slop score" width="720">
</p>

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

## Roadmap

- [ ] Shareable result cards (OG image per scanned URL)
- [ ] "Why this score?" deep-link to each triggered detector
- [ ] Optional JS-rendered fetch for SPA-heavy sites
- [ ] Public API rate limiting + caching

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'feat: describe change'`)
4. Push and open a pull request

New detectors are easy: add a `Detector` to the relevant registry in
[`src/lib/analyzer.ts`](src/lib/analyzer.ts) and it's picked up automatically.
Please make sure `npm run build` and `npm run lint` pass before submitting a PR.

## Code of Conduct

This project follows the [Contributor Covenant v2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
By participating you agree to uphold a welcoming, harassment-free environment.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for details.

---

Built, ironically, by an AI.
