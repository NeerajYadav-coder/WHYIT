"use client";

import { useState } from "react";
import {
  FileTextIcon,
  VideoIcon,
  SparklesIcon,
  BookmarkCheckIcon,
  SearchIcon,
  CheckIcon,
} from "lucide-react";

export function InteractiveDemo() {
  const [activeConcept, setActiveConcept] = useState<"chainRule" | "jacobian" | "dynamicProg">("chainRule");
  const [popupOpen, setPopupOpen] = useState(true);
  const [savedNote, setSavedNote] = useState(false);

  const conceptData = {
    chainRule: {
      title: "Chain Rule in Computational Graphs",
      grounding: "Deep Learning, Ch. 6.5 (Goodfellow et al.)",
      preview: "In deep neural networks, computing the gradient of the scalar loss with respect to intermediate weights requires repeated application of the chain rule. Rather than expanding symbolic expressions naively—which scales exponentially with depth—we cache intermediate tensors in topological order during the forward pass.",
      quote: "Reverse-mode automatic differentiation is dynamic programming on directed acyclic graphs.",
      curiosityPrompt: "Why does reverse-mode AD beat forward-mode AD for deep neural networks?",
      curiosityAnswer: "In deep learning, the cost function has scalar output (R^1) but millions of parameters (R^D). Reverse-mode computes all gradients in a single backward sweep O(1), whereas forward-mode would require D separate passes O(D).",
    },
    jacobian: {
      title: "Vector-Jacobian Products (VJPs)",
      grounding: "Karpathy: Micrograd & Autograd Architecture",
      preview: "Modern frameworks never explicitly instantiate the massive full Jacobian matrix J of size (M x N). Instead, backpropagation directly evaluates the Vector-Jacobian Product (v^T * J), transforming memory requirements from quadratic O(MN) down to linear O(M + N).",
      quote: "Explicit Jacobians for modern LLMs would require terabytes of VRAM per single layer.",
      curiosityPrompt: "How does PyTorch represent backward hooks without computing J?",
      curiosityAnswer: "PyTorch represents operations as Node objects in a computational graph. Each Node has an associated backward() method that computes the vector-Jacobian product directly using the incoming upstream gradient.",
    },
    dynamicProg: {
      title: "Memoization & Memory Footprint",
      grounding: "Bishop: Pattern Recognition & Machine Learning",
      preview: "By storing intermediate activations during the forward pass, backpropagation trades memory for speed. When memory is constrained on GPUs, activation checkpointing selectively recomputes subsets of intermediate nodes on the fly.",
      quote: "Activation checkpointing reduces memory from O(L) to O(sqrt(L)) with just 30% compute overhead.",
      curiosityPrompt: "What is the memory vs recompute trade-off in multi-billion parameter models?",
      curiosityAnswer: "Activation checkpointing discards non-critical activations and re-executes the forward pass for specific layers during backpropagation, cutting peak memory by up to 80% with only ~30% additional compute time.",
    },
  };

  const current = conceptData[activeConcept];

  return (
    <section id="interactive-demo" className="w-full max-w-[1380px] mx-auto px-6 sm:px-10 py-16 scroll-mt-24">
      {/* Section Eyebrow & Title */}
      <div className="text-center max-w-[860px] mx-auto mb-12 space-y-3">
        <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[11px] font-mono tracking-widest text-[var(--color-accent-hover)] uppercase">
          <SparklesIcon className="w-3.5 h-3.5" />
          Interactive Studio Canvas
        </span>
        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white apple-gradient-text">
          Study with persistent context. Explore without limits.
        </h2>
        <p className="text-base sm:text-lg text-white/60 leading-relaxed text-balance">
          Experience how Whyit weaves research papers, video transcripts, and spontaneous side-threads into a single cognitive studio.
        </p>
      </div>

      {/* Main Studio Showcase Window */}
      <div className="rounded-[28px] border border-white/10 bg-[#0C0E14] overflow-hidden shadow-[0_24px_80px_-16px_rgba(0,0,0,0.85)] relative transition-all duration-300">
        {/* macOS Style Window Titlebar */}
        <div className="h-13 border-b border-white/[0.08] px-5 sm:px-6 flex items-center justify-between bg-[#10121A]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block opacity-80" />
              <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block opacity-80" />
              <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block opacity-80" />
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2 text-xs font-mono text-white/50">
              <span className="text-white/30">studio /</span>
              <span className="text-white/90 font-medium font-sans text-sm">
                Deep Learning & Neural Foundations
              </span>
            </div>
          </div>

          {/* Active Knowledge Grounding Status */}
          <div className="hidden sm:flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[var(--color-system-green)]/10 text-[var(--color-system-green)] border border-[var(--color-system-green)]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-system-green)] animate-pulse" />
              Grounded Model · 2 Active Sources
            </span>
          </div>
        </div>

        {/* Studio Window Body Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
          {/* Left Panel: Active Knowledge & Curiosity Ledger (4 cols) */}
          <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0E1017] p-5 sm:p-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Grounded Knowledge Sources */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-white/40 font-medium">
                    Ingested Knowledge Base (2)
                  </p>
                  <span className="text-[10px] text-[var(--color-accent-hover)] font-mono">100% Vectorized</span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3 group cursor-default">
                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 mt-0.5 flex-shrink-0">
                      <FileTextIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white/90 truncate group-hover:text-white">
                        Deep_Learning_Goodfellow.pdf
                      </p>
                      <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-0.5">
                        <span>42 Semantic Chunks</span>
                        <span>·</span>
                        <span className="text-[var(--color-system-green)]">Indexed</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/15 transition-all flex items-start gap-3 group cursor-default">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 mt-0.5 flex-shrink-0">
                      <VideoIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white/90 truncate group-hover:text-white">
                        Karpathy: Micrograd Neural Networks
                      </p>
                      <p className="text-[11px] text-white/40 flex items-center gap-1.5 mt-0.5">
                        <span>2h 14m Full Transcript</span>
                        <span>·</span>
                        <span className="text-[var(--color-system-green)]">Timestamped</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Concept Selector Pills */}
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-white/40 mb-3 font-medium">
                  Core Inquiries in Canvas
                </p>
                <div className="space-y-2">
                  {[
                    { id: "chainRule", label: "1. Chain Rule & Computational Graphs", tag: "First Principles" },
                    { id: "jacobian", label: "2. Vector-Jacobian Products", tag: "Optimization" },
                    { id: "dynamicProg", label: "3. Memoization & Memory Bounds", tag: "Architecture" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveConcept(item.id as any);
                        setPopupOpen(true);
                        setSavedNote(false);
                      }}
                      className={`w-full text-left p-3 rounded-xl text-xs sm:text-[13px] transition-all flex items-center justify-between ${
                        activeConcept === item.id
                          ? "bg-[var(--color-accent-primary)]/15 border border-[var(--color-accent-primary)]/40 text-white font-medium shadow-sm"
                          : "text-white/60 hover:text-white hover:bg-white/[0.03] border border-transparent"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/40 ml-2 flex-shrink-0">
                        {item.tag}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Persistent Memory Metric */}
            <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs text-white/40 font-mono">
              <span className="flex items-center gap-2">
                <BookmarkCheckIcon className="w-3.5 h-3.5 text-[var(--color-system-green)]" />
                Persistent Canvas
              </span>
              <span className="text-white/70">Synced</span>
            </div>
          </div>

          {/* Center Main Canvas Area (8 cols) */}
          <div className="lg:col-span-8 p-6 sm:p-10 flex flex-col justify-between relative bg-[#090A0E]">
            <div className="max-w-[740px] mx-auto w-full space-y-7">
              {/* Concept Topic Breadcrumb */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center gap-2 text-xs font-mono text-white/50">
                  <span>Topic:</span>
                  <span className="text-white font-sans font-medium text-[13px]">{current.title}</span>
                </div>
                <span className="text-[11px] font-mono text-[var(--color-accent-hover)] bg-[var(--color-accent-dim)] px-2.5 py-1 rounded-full">
                  {current.grounding}
                </span>
              </div>

              {/* Reading Passage */}
              <div className="space-y-4 font-serif text-[16px] sm:text-[17px] leading-[1.8] text-white/85">
                <p>{current.preview}</p>

                {/* Highlighted Interactive Phrase */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] my-4 font-sans text-sm">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-white/60 text-xs">Click concept spark to branch:</span>
                    <button
                      type="button"
                      onClick={() => setPopupOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-[var(--color-accent-primary)]/20 text-[var(--color-accent-hover)] border border-[var(--color-accent-primary)]/40 hover:bg-[var(--color-accent-primary)]/30 transition-all cursor-pointer shadow-sm group"
                    >
                      <SparklesIcon className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                      <span>{current.curiosityPrompt.slice(0, 48)}…</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--color-accent-primary)] text-white font-semibold">
                        Explore Thread
                      </span>
                    </button>
                  </div>
                </div>

                <blockquote className="border-l-2 border-[var(--color-accent-primary)] pl-4 text-white/70 italic text-[14px] sm:text-[15px] font-sans">
                  &ldquo;{current.quote}&rdquo;
                </blockquote>
              </div>

              {/* Floating Live Curiosity Thread Inspector */}
              {popupOpen && (
                <div className="mt-6 rounded-2xl border border-white/15 bg-[#141722]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.9)] animate-fade-up relative space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--color-accent-hover)] animate-ping" />
                      <span className="text-xs font-semibold text-white tracking-tight">
                        Curiosity Thread · Non-destructive Side Exploration
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPopupOpen(false)}
                      className="text-white/40 hover:text-white text-xs px-2.5 py-1 rounded hover:bg-white/10 transition-all"
                    >
                      Close ✕
                    </button>
                  </div>

                  <div className="text-[11px] font-mono text-[var(--color-accent-hover)] flex items-center gap-2">
                    <span>Grounded in:</span>
                    <span className="underline decoration-white/20">{current.grounding}</span>
                  </div>

                  <div className="space-y-2 text-sm text-white/80 font-sans leading-relaxed">
                    <p className="font-semibold text-white text-[14px]">{current.curiosityPrompt}</p>
                    <p className="text-xs sm:text-[13px] text-white/70 bg-white/[0.03] p-4 rounded-xl border border-white/[0.06] leading-relaxed">
                      {current.curiosityAnswer}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSavedNote(true)}
                      className={`text-xs font-semibold px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                        savedNote
                          ? "bg-[var(--color-system-green)] text-black shadow-md"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                      }`}
                    >
                      {savedNote ? (
                        <>
                          <CheckIcon className="w-3.5 h-3.5" />
                          Saved to Project Canvas
                        </>
                      ) : (
                        "+ Save Note into Studio Memory"
                      )}
                    </button>
                    <span className="text-[11px] text-white/40 font-mono">
                      Main conversation preserved
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Apple Floating Input Dock Simulation */}
            <div className="mt-8 pt-4 border-t border-white/[0.06]">
              <div className="apple-spotlight-dock rounded-2xl p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-2xl">
                <div className="flex items-center gap-2.5 pl-3 flex-1 min-w-0">
                  <SearchIcon className="w-4 h-4 text-white/40 flex-shrink-0" />
                  <input
                    type="text"
                    readOnly
                    value="Ask an intuitive question or explore deeper mathematical foundations…"
                    className="bg-transparent text-xs sm:text-[13px] text-white/50 w-full outline-none truncate font-sans"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPopupOpen(true)}
                  className="px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all flex-shrink-0 active:scale-95"
                >
                  Send Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
