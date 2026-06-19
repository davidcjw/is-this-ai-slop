"use client";

import { motion } from "framer-motion";
import Analyzer from "@/components/Analyzer";

const TELLS = [
  "the purple gradient",
  "default sans-serif",
  "buzzword verbs",
  "stock UI buttons",
  "everything over-rounded",
  "the default icon set",
  "boilerplate CTAs",
  "punctuation tics",
  "the three-card grid",
  "frosted-glass panels",
  "growth-hack headlines",
  "leftover builder badges",
  "gradient headline text",
  "the X-not-Y line",
  "filler placeholder copy",
  "the default deploy host",
];

const METHOD = [
  {
    n: "01",
    title: "Builder watermarks",
    body: "Site builders and no-code tools all leave fingerprints: meta tags, telltale asset paths, the badge nobody bothered to remove. The loudest signal there is.",
  },
  {
    n: "02",
    title: "Default stack",
    body: "One framework, one CSS kit, one component library, one icon set, one font. The reflex an agent reaches for. Use it untouched and you wear the uniform.",
  },
  {
    n: "03",
    title: "The model's voice",
    body: "A handful of verbs every model loves, the compulsive punctuation habit, and that one rhetorical move where nothing is ever just itself. Machines have a tell.",
  },
  {
    n: "04",
    title: "Structural clichés",
    body: "Big hero, a row of three cards, a wall of glowing quotes, a plan table, one final call to action. The same skeleton, generated a million times over.",
  },
  {
    n: "05",
    title: "Visual defaults",
    body: "The obligatory cool-toned gradient, the glass card, the heavy rounded corners. Comfortable, safe, and instantly recognisable.",
  },
  {
    n: "06",
    title: "Placeholder residue",
    body: "Filler text nobody replaced, a sample email, a made-up name, a stock photo, the starter title still sitting in the tab. Nobody finished the job.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function Home() {
  return (
    <main className="relative overflow-x-hidden">
      {/* Top bar */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink">
            <span className="h-2 w-2 rounded-full bg-vermillion" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em]">
            Slop Lab
          </span>
        </div>
        <nav className="flex items-center gap-5">
          <a
            href="#method"
            className="font-mono text-xs uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
          >
            The method ↓
          </a>
          <a
            href="https://github.com/davidcjw/is-this-ai-slop"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.15em] text-ink-soft transition-colors hover:text-ink"
          >
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="h-3.5 w-3.5 fill-current transition-colors group-hover:fill-vermillion"
            >
              <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38v-1.33c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.67.07-.52.28-.87.5-1.07-1.77-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
            </svg>
            Star
          </a>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-5 pb-10 pt-10 sm:pt-16">
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mb-6 inline-flex items-center gap-2 border border-line px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-vermillion" />
          Forensic website authenticity report
        </motion.p>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="max-w-4xl font-display text-[3.4rem] leading-[0.92] tracking-tight sm:text-[6rem]"
        >
          Is this website{" "}
          <span className="relative inline-block italic text-vermillion">
            AI-generated
            <motion.span
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
              className="absolute -bottom-1 left-0 h-[3px] w-full origin-left bg-vermillion"
            />
          </span>
          , or did a human actually make it?
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft"
        >
          Paste a link. We fingerprint the default agent house style: the
          watermarks, the stock copy, the obligatory gradient. Then we hand you
          a brutally honest <span className="font-semibold text-ink">0–100 slop score</span>.
        </motion.p>

        {/* The hook: input lives right here, above the fold */}
        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-10"
        >
          <Analyzer />
        </motion.div>
      </section>

      {/* MARQUEE of tells */}
      <section className="mt-8 border-y border-ink bg-ink py-3 text-paper">
        <div className="flex w-max animate-marquee whitespace-nowrap">
          {[...TELLS, ...TELLS].map((t, i) => (
            <span
              key={i}
              className="mx-5 inline-flex items-center gap-3 font-mono text-sm text-paper/80"
            >
              <span className="text-vermillion">✕</span>
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* METHOD */}
      <section id="method" className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-vermillion">
            What we look for
          </p>
          <h2 className="mt-3 font-display text-4xl leading-tight sm:text-5xl">
            Six dimensions of telltale sameness.
          </h2>
          <p className="mt-4 text-ink-soft">
            None of these are crimes on their own. Pile enough of them up with
            zero customisation, though, and the site starts to look like every
            other thing an agent shipped that week.
          </p>
        </div>

        <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {METHOD.map((m, i) => (
            <motion.article
              key={m.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: (i % 3) * 0.06, duration: 0.5 }}
              className="group bg-paper p-7 transition-colors hover:bg-paper-deep"
            >
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-sm text-vermillion">{m.n}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-soft opacity-0 transition-opacity group-hover:opacity-100">
                  signal
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl leading-tight">{m.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{m.body}</p>
            </motion.article>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border border-ink bg-paper p-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-md font-display text-2xl leading-tight">
            Enough theory. Go put a site under the microscope.
          </p>
          <a
            href="#scan"
            className="shrink-0 cursor-pointer border border-ink bg-ink px-7 py-3 font-mono text-sm font-bold uppercase tracking-[0.15em] text-paper transition-colors hover:bg-vermillion hover:border-vermillion"
          >
            ↑ Scan a URL
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 px-5 py-8 font-mono text-xs text-ink-soft sm:flex-row sm:items-center">
          <p>
            Slop Lab: a heuristic toy, not a tribunal. The score reflects{" "}
            <span className="text-ink">visual and structural sameness</span>, not quality.
          </p>
          <p className="text-ink-soft/70">Built, ironically, by an AI.</p>
        </div>
      </footer>
    </main>
  );
}
