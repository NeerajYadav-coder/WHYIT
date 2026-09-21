"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SparklesIcon,
  ArrowRightIcon,
  CompassIcon,
  BrainIcon,
} from "lucide-react";

const SUGGESTED_SPARKS = [
  {
    topic: "Neural Backpropagation from Scratch",
    category: "Machine Learning",
    motivation: "I want to implement reverse-mode autodiff from first principles without relying on PyTorch abstractions.",
  },
  {
    topic: "Quantum Computing from Linear Algebra",
    category: "Quantum Physics",
    motivation: "I want an intuitive mathematical understanding of qubits, superposition, and quantum teleportation.",
  },
  {
    topic: "Distributed Systems: Raft Consensus",
    category: "Systems Engineering",
    motivation: "I need to master leader election, log replication, and Byzantine fault tolerance for infrastructure design.",
  },
  {
    topic: "Macroeconomics: Inflation & Central Banking",
    category: "Economics",
    motivation: "I want to understand how money supply, interest rate dynamics, and bond yields propagate through modern markets.",
  },
  {
    topic: "Epistemology: Foundational Axioms of Truth",
    category: "Philosophy",
    motivation: "Exploring how knowledge is verified, Cartesian doubt, and Bayesian updating from foundational principles.",
  },
  {
    topic: "Transformer Attention & KV-Caching",
    category: "AI Architecture",
    motivation: "Studying the memory bandwidth constraints and self-attention mechanics of large language models.",
  },
];

export function GoalCaptureFlow() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [motivation, setMotivation] = useState("");
  const [context, setContext] = useState("");
  const [showRefinement, setShowRefinement] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goalInputRef = useRef<HTMLInputElement>(null);
  const motivationInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    goalInputRef.current?.focus();
  }, []);

  const handleSelectSpark = (spark: typeof SUGGESTED_SPARKS[0]) => {
    setGoal(spark.topic);
    setMotivation(spark.motivation);
    setShowRefinement(true);
    setTimeout(() => {
      motivationInputRef.current?.focus();
    }, 150);
  };

  const handleGoalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!goal.trim()) return;

    if (!showRefinement) {
      setShowRefinement(true);
      setTimeout(() => motivationInputRef.current?.focus(), 150);
      return;
    }

    void handleComplete();
  };

  const handleComplete = async () => {
    if (!goal.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const effectiveMotivation = motivation.trim() || "To understand this topic thoroughly from foundational first principles.";
    const name = goal.length > 64 ? `${goal.slice(0, 61)}…` : goal;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          goal: goal.trim(),
          motivation: effectiveMotivation,
          context: context.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(json.error ?? `HTTP ${res.status}`);
      }

      const json = await res.json() as { project: { id: string } };
      router.push(`/workspace/${json.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize workspace");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-12 pb-20 sm:pb-28">
      <div className="space-y-10 sm:space-y-12 animate-fade-up">

        {/* Studio Orientation Heading */}
        <div className="text-center space-y-4 max-w-[820px] mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-mono text-[var(--color-accent-hover)] uppercase tracking-widest backdrop-blur-xl">
            <CompassIcon className="w-3.5 h-3.5" />
            Spotlight Creative Command
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-[-0.03em] leading-tight text-white apple-gradient-text text-balance">
            What do you want to master?
          </h1>
          <p className="text-base sm:text-lg text-white/60 leading-relaxed text-balance">
            Name a discipline, an unsolved question, or an exploratory curiosity. Whyit molds a permanent first-principles study canvas around it.
          </p>
        </div>

        {/* Floating Spotlight Command Bar */}
        <div className="w-full max-w-[880px] mx-auto">
          <div className="apple-spotlight-dock rounded-full p-2 sm:p-2.5 border border-white/15 transition-all duration-300 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)] focus-within:border-[var(--color-accent-primary)] focus-within:shadow-[0_0_40px_rgba(99,102,241,0.3)]">
            <form onSubmit={handleGoalSubmit} className="flex items-center gap-3 w-full">
              <div className="pl-4 sm:pl-5 text-[var(--color-accent-hover)] flex-shrink-0">
                <SparklesIcon className="w-5 h-5 animate-pulse" />
              </div>

              <input
                ref={goalInputRef}
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What would you like to explore from first principles?"
                className="flex-1 bg-transparent text-[16px] sm:text-[18px] text-white placeholder:text-white/35 outline-none border-none ring-0 focus:ring-0 focus:outline-none font-sans font-normal tracking-tight px-2 py-2 sm:py-3 min-w-0"
              />

              <button
                type="submit"
                disabled={!goal.trim() || isSubmitting}
                className="inline-flex items-center gap-2.5 px-6 sm:px-8 h-11 sm:h-12 rounded-full bg-white text-black text-[14px] sm:text-[15px] font-semibold hover:bg-white/95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 flex-shrink-0 mr-1"
              >
                <span>{showRefinement ? "Launch" : "Continue"}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Quick Keyboard Cue & Assurance */}
          <div className="flex items-center justify-between px-5 pt-3.5 text-xs font-mono text-white/40">
            <span className="flex items-center gap-2">
              <kbd className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-white/80 text-[11px] font-mono">↵ Enter</kbd>
              <span>to confirm inquiry</span>
            </span>
            <span className="hidden sm:inline">Zero context loss permanent workspace</span>
          </div>
        </div>

        {/* Refinement Drawer (Progressive Disclosure) */}
        {showRefinement && (
          <div className="w-full max-w-[960px] mx-auto apple-glass-card rounded-[28px] p-7 sm:p-10 space-y-7 animate-scale-settle border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5 text-base font-medium text-white">
                <BrainIcon className="w-5 h-5 text-[var(--color-accent-hover)]" />
                <span>Studio Intent & Motivation</span>
              </div>
              <span className="text-xs font-mono text-white/40">Step 2 of 2</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Motivation Input */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  Why is this important to you?
                </label>
                <textarea
                  ref={motivationInputRef}
                  rows={4}
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="e.g. I am transitioning to an ML role and want to understand the foundational math rather than just using APIs…"
                  className="w-full rounded-2xl p-4 bg-white/[0.025] border border-white/10 text-white placeholder-white/30 text-[14px] focus:border-[var(--color-accent-primary)] focus:bg-white/[0.04] focus:outline-none transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Context Input */}
              <div className="space-y-2.5">
                <label className="text-xs font-mono uppercase tracking-wider text-white/70 block">
                  Existing Background (Optional)
                </label>
                <textarea
                  rows={4}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="e.g. Comfortable with Python and linear algebra, but new to automatic differentiation and computational graphs…"
                  className="w-full rounded-2xl p-4 bg-white/[0.025] border border-white/10 text-white placeholder-white/30 text-[14px] focus:border-[var(--color-accent-primary)] focus:bg-white/[0.04] focus:outline-none transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 p-3.5 rounded-xl border border-red-500/20">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={() => setShowRefinement(false)}
                className="text-xs font-mono text-white/45 hover:text-white transition-colors"
              >
                ← Back to inquiry
              </button>

              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black text-[14px] sm:text-[15px] font-semibold hover:bg-white/95 transition-all shadow-[0_0_28px_rgba(255,255,255,0.25)] disabled:opacity-50 active:scale-95"
              >
                {isSubmitting ? (
                  <span>Initializing Studio…</span>
                ) : (
                  <>
                    <span>Initialize Learning Studio</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Curated Intellectual Spark Cards Grid */}
        {!showRefinement && (
          <div className="space-y-6 pt-6 sm:pt-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-4 px-1">
              <div className="flex items-center gap-2.5">
                <SparklesIcon className="w-4 h-4 text-[var(--color-accent-hover)]" />
                <h2 className="text-sm sm:text-base font-medium text-white/90">
                  Curated Foundational Inquiries
                </h2>
              </div>
              <span className="text-xs font-mono text-white/40">
                1-tap instant setup · First-principles inquiry canvas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
              {SUGGESTED_SPARKS.map((spark) => (
                <button
                  key={spark.topic}
                  type="button"
                  onClick={() => handleSelectSpark(spark)}
                  className="p-6 sm:p-7 rounded-[24px] border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.05] hover:border-white/20 text-left transition-all duration-300 apple-sheen-card apple-press-spring group flex flex-col justify-between min-h-[210px] shadow-lg hover:shadow-2xl"
                >
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--color-accent-hover)] font-medium px-3 py-1 rounded-full bg-[var(--color-accent-dim)] border border-[var(--color-accent-primary)]/20 inline-block">
                      {spark.category}
                    </span>
                    <h3 className="text-[16px] sm:text-[17px] font-semibold text-white/95 group-hover:text-white mt-3.5 leading-snug">
                      {spark.topic}
                    </h3>
                    <p className="text-[13px] sm:text-[14px] text-white/50 group-hover:text-white/70 leading-relaxed mt-2 line-clamp-3">
                      {spark.motivation}
                    </p>
                  </div>
                  <div className="pt-4 mt-5 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-white/40 group-hover:text-[var(--color-accent-hover)] transition-colors">
                    <span>Explore topic from first principles</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
