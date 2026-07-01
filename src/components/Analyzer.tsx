"use client";

import { useState, useRef, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  animate,
} from "framer-motion";
import type { AnalysisResult, CategoryScore } from "@/lib/analyzer";

const EXAMPLES = ["vercel.com", "stripe.com", "a v0 demo you've seen", "your own site"];

const SCAN_PHASES = [
  "Fetching markup…",
  "Sniffing builder watermarks…",
  "Counting Tailwind utility classes…",
  "Scanning copy for LLM buzzwords…",
  "Measuring em-dash density…",
  "Compiling the verdict…",
];

/** The field already shows a "https://" prefix — strip any protocol the user
 * pastes or types so we don't end up with a duplicated "https://https://". */
function sanitizeUrlInput(v: string): string {
  return v.replace(/^\s*https?:\/\//i, "");
}

function verdictColor(score: number): string {
  if (score <= 38) return "var(--color-forest)";
  if (score <= 58) return "var(--color-olive)";
  if (score <= 78) return "var(--color-amber)";
  return "var(--color-vermillion)";
}

/* Animated counting number for the big score reveal. */
function CountUp({ value }: { value: number }) {
  const reduce = useReducedMotion();
  // With reduced motion there's nothing to animate — render the value directly
  // rather than syncing it into state via an effect.
  if (reduce) return <>{value}</>;
  return <AnimatedCountUp value={value} />;
}

function AnimatedCountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [value]);
  return <>{display}</>;
}

function CategoryBar({ cat, index }: { cat: CategoryScore; index: number }) {
  const pct = Math.round((cat.points / cat.max) * 100);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 + index * 0.07, duration: 0.4 }}
      className="border-b border-line py-4 last:border-0"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h4 className="font-body text-sm font-semibold tracking-tight">
          {cat.title}
        </h4>
        <span className="font-mono text-xs text-ink-soft tabular-nums">
          {cat.points}/{cat.max}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-paper-deep">
        <motion.div
          className="h-full rounded-full"
          style={{ background: pct > 60 ? "var(--color-vermillion)" : "var(--color-ink)" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: 0.6 + index * 0.07, duration: 0.7, ease: "easeOut" }}
        />
      </div>
      {cat.signals.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {cat.signals.map((s) => (
            <li key={s.id} className="flex gap-2 text-[13px] leading-snug text-ink-soft">
              <span className="mt-[3px] h-1 w-1 shrink-0 rounded-full bg-vermillion" />
              <span>
                {s.label}
                {s.evidence.length > 0 && (
                  <span className="ml-1 font-mono text-[11px] text-ink-soft/70">
                    [{s.evidence.slice(0, 2).join(" · ")}]
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

function Result({ data, onReset }: { data: AnalysisResult; onReset: () => void }) {
  const color = verdictColor(data.score);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="mx-auto max-w-3xl"
    >
      {/* Verdict header */}
      <div className="border border-ink bg-paper px-6 py-8 shadow-[6px_6px_0_0_var(--color-ink)] sm:px-10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-stretch sm:justify-between">
          <div className="flex flex-col justify-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
              Forensic verdict
            </p>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-1 font-display text-4xl leading-none sm:text-5xl"
              style={{ color }}
            >
              {data.verdict.label}
            </motion.h2>
            <p className="mt-3 max-w-sm text-sm text-ink-soft">{data.verdict.blurb}</p>
            <p className="mt-4 truncate font-mono text-xs text-ink-soft">
              {data.finalUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </p>
          </div>

          {/* Big score */}
          <div className="flex shrink-0 flex-col items-center justify-center">
            <div
              className="flex h-36 w-36 items-center justify-center rounded-full border-[3px]"
              style={{ borderColor: color }}
            >
              <span
                className="font-display text-7xl leading-none tabular-nums"
                style={{ color }}
              >
                <CountUp value={data.score} />
              </span>
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">
              / 100 AI-slop index
            </p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="mt-6 border border-line bg-paper/60 px-6 py-2 sm:px-8">
        <p className="border-b border-line py-4 font-mono text-[11px] uppercase tracking-[0.2em] text-ink-soft">
          Evidence log — {data.categories.reduce((n, c) => n + c.signals.length, 0)} signals
        </p>
        {data.categories.map((cat, i) => (
          <CategoryBar key={cat.category} cat={cat} index={i} />
        ))}
      </div>

      <button
        onClick={onReset}
        className="mt-6 w-full cursor-pointer border border-ink bg-ink py-3 font-mono text-xs uppercase tracking-[0.2em] text-paper transition-colors hover:bg-vermillion hover:border-vermillion"
      >
        ↺ Examine another site
      </button>
    </motion.div>
  );
}

export default function Analyzer() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduce = useReducedMotion();

  // Cycle through scan phases while loading for a sense of "work happening".
  useEffect(() => {
    if (status !== "loading") return;
    setPhase(0);
    const id = setInterval(() => setPhase((p) => Math.min(p + 1, SCAN_PHASES.length - 1)), 700);
    return () => clearInterval(id);
  }, [status]);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!url.trim() || status === "loading") return;
    setStatus("loading");
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setResult(json);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function reset() {
    setStatus("idle");
    setResult(null);
    setError(null);
    setUrl("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div id="scan" className="w-full">
      <AnimatePresence mode="wait">
        {status === "done" && result ? (
          <Result key="result" data={result} onReset={reset} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto max-w-2xl"
          >
            <form onSubmit={run} className="relative">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex h-14 flex-1 items-center border border-ink bg-paper focus-within:border-vermillion focus-within:ring-2 focus-within:ring-vermillion/30">
                  <span className="shrink-0 select-none pl-4 pr-0.5 font-mono text-sm text-ink-soft/70">
                    https://
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    aria-label="Website URL to analyze"
                    value={url}
                    onChange={(e) => setUrl(sanitizeUrlInput(e.target.value))}
                    placeholder="paste-any-website.com"
                    disabled={status === "loading"}
                    className="h-full w-full min-w-0 flex-1 bg-transparent pr-4 font-mono text-base text-ink placeholder:text-ink-soft/50 focus:outline-none disabled:opacity-60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "loading" || !url.trim()}
                  className="group flex h-14 shrink-0 cursor-pointer items-center justify-center gap-2 border border-ink bg-ink px-7 font-mono text-sm font-bold uppercase tracking-[0.15em] text-paper transition-all hover:bg-vermillion hover:border-vermillion disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "loading" ? "Scanning" : "Examine"}
                  {status !== "loading" && (
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  )}
                </button>
              </div>
            </form>

            {/* example chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-soft">
                Try:
              </span>
              {EXAMPLES.slice(0, 2).map((ex) => (
                <button
                  key={ex}
                  onClick={() => {
                    setUrl(ex);
                    requestAnimationFrame(() => inputRef.current?.focus());
                  }}
                  className="cursor-pointer border border-line px-2.5 py-1 font-mono text-[11px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  {ex}
                </button>
              ))}
            </div>

            {/* loading / error states */}
            <div className="mt-6 min-h-[2rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                {status === "loading" && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 font-mono text-sm text-ink-soft"
                  >
                    <span className="relative flex h-3 w-3">
                      {!reduce && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vermillion opacity-60" />
                      )}
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-vermillion" />
                    </span>
                    <motion.span
                      key={phase}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {SCAN_PHASES[phase]}
                    </motion.span>
                  </motion.div>
                )}
                {status === "error" && error && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-l-2 border-vermillion pl-3 font-mono text-sm text-vermillion-deep"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
