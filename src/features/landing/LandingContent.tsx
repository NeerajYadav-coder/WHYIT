"use client";

import Link from "next/link";
import {
  BrainIcon,
  GitBranchIcon,
  LayersIcon,
  CompassIcon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  SparklesIcon,
} from "lucide-react";

function LandingContent() {
  return (
    <div className="w-full max-w-[1380px] mx-auto px-6 sm:px-10 space-y-32 py-12">

      {/* ── SECTION 1: THE BENTO GRID (Apple Modular Showcase) ── */}
      <section id="features" className="space-y-14">
        <div className="text-center max-w-[820px] mx-auto space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-accent-hover)] bg-[var(--color-accent-dim)] px-3.5 py-1.5 rounded-full border border-[var(--color-accent-primary)]/20 inline-block">
            Architectural Philosophy
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white apple-gradient-text">
            Designed around how deep thinking actually happens.
          </h2>
          <p className="text-base sm:text-lg text-white/60 leading-relaxed text-balance">
            Every layer of Whyit is engineered to eliminate the friction of generic AI chat: no forgotten context, no lost papers, and no broken trains of thought.
          </p>
        </div>

        {/* The 4-Card Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-7">

          {/* Bento Card 1 (8 cols): Persistent Studio Memory */}
          <div className="md:col-span-8 apple-bento-card p-7 sm:p-9 rounded-[28px] relative overflow-hidden flex flex-col justify-between apple-sheen-card group">
            <div className="space-y-4 max-w-[560px]">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-[var(--color-accent-hover)]">
                <BrainIcon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-white leading-snug">
                Memory that accumulates. Never resets.
              </h3>
              <p className="text-[14px] sm:text-[15px] text-white/60 leading-[1.65]">
                Standard chats decay right when discussions get deep. Whyit treats your study as a permanent project canvas. Return tomorrow or next year—your context, ingested papers, and foundational breakthroughs remain 100% active.
              </p>
            </div>

            {/* Visual Timeline Widget */}
            <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] font-mono text-[var(--color-accent-hover)] uppercase tracking-wider">Day 1</span>
                <p className="text-[13px] font-semibold text-white/95 mt-1">Goal Formulated</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-normal">Fundamentals & core axioms mapped</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-[10px] font-mono text-[var(--color-accent-hover)] uppercase tracking-wider">Day 14</span>
                <p className="text-[13px] font-semibold text-white/95 mt-1">Papers Ingested</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-normal">32 chunks referenced & cross-linked</p>
              </div>
              <div className="p-4 rounded-2xl bg-[var(--color-accent-dim)] border border-[var(--color-accent-primary)]/30">
                <span className="text-[10px] font-mono text-[var(--color-system-green)] uppercase tracking-wider">Active State</span>
                <p className="text-[13px] font-semibold text-white mt-1">Compound Synthesis</p>
                <p className="text-[11px] text-white/75 mt-0.5 leading-normal">Zero context loss across sessions</p>
              </div>
            </div>
          </div>

          {/* Bento Card 2 (4 cols): Curiosity Side-Threads */}
          <div className="md:col-span-4 apple-bento-card p-7 sm:p-9 rounded-[28px] flex flex-col justify-between apple-sheen-card group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <GitBranchIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-[22px] font-semibold tracking-tight text-white leading-snug">
                Curiosity Side-Threads
              </h3>
              <p className="text-[14px] sm:text-[15px] text-white/60 leading-[1.65]">
                Spot a concept you don&rsquo;t understand? Highlight any word to launch a floating curiosity thread. Explore the tangent deeply, take notes, and return—without breaking your main train of thought.
              </p>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs font-mono text-white/60 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Non-destructive exploration
              </span>
              <span className="text-white/30">Branch 1.2</span>
            </div>
          </div>

          {/* Bento Card 3 (4 cols): Grounded Multi-Source Truth */}
          <div className="md:col-span-4 apple-bento-card p-7 sm:p-9 rounded-[28px] flex flex-col justify-between apple-sheen-card group">
            <div className="space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <LayersIcon className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-[22px] font-semibold tracking-tight text-white leading-snug">
                Multi-Source Grounding
              </h3>
              <p className="text-[14px] sm:text-[15px] text-white/60 leading-[1.65]">
                Attach technical PDFs, lecture video transcripts, and web sources directly into your workspace. Responses cite exact mathematical paragraphs and timestamped segments.
              </p>
            </div>

            <div className="mt-8 space-y-2.5">
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-white/85 font-medium">📄 Research_Paper.pdf</span>
                <span className="text-[10px] font-mono text-[var(--color-system-green)] font-medium">Indexed</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-white/85 font-medium">🎥 Lecture_Series.youtube</span>
                <span className="text-[10px] font-mono text-[var(--color-system-green)] font-medium">Synced</span>
              </div>
            </div>
          </div>

          {/* Bento Card 4 (8 cols): First-Principles Socratic Inquiry */}
          <div className="md:col-span-8 apple-bento-card p-7 sm:p-9 rounded-[28px] flex flex-col justify-between apple-sheen-card group">
            <div className="space-y-4 max-w-[560px]">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <CompassIcon className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-white leading-snug">
                First-Principles Deconstruction
              </h3>
              <p className="text-[14px] sm:text-[15px] text-white/60 leading-[1.65]">
                Whyit does not just regurgitate summaries. It helps you break complex questions down into fundamental, physical, and mathematical axioms—ensuring you build an intuitive mental model rather than rote memorization.
              </p>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[11px] font-mono text-white/45 uppercase tracking-wider">Dialogue Engine</p>
                <p className="text-[14px] font-medium text-white/95">Socratic Inquiry & Axiomatic Proofs</p>
              </div>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-white/[0.06] text-white/70">
                Adaptive Rigor
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: THE PARADIGM SHIFT (Comparison Matrix) ── */}
      <section className="space-y-10">
        <div className="text-center max-w-[700px] mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-medium tracking-tight text-white apple-gradient-text">
            The difference between chatting and learning.
          </h2>
          <p className="text-[15px] sm:text-base text-white/60 leading-relaxed">
            General-purpose chatbots were designed to answer prompts and clear the screen. Whyit is purpose-built to hold a discipline and let your understanding grow.
          </p>
        </div>

        {/* Split Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Column A: Ephemeral Generic Chat */}
          <div className="rounded-[28px] border border-white/[0.08] bg-[#0E1015]/80 p-7 sm:p-9 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-medium">
                Conventional AI Chatbots
              </span>
              <XIcon className="w-4 h-4 text-red-400/80" />
            </div>

            <ul className="space-y-5">
              {[
                { title: "Context Amnesia", desc: "Threads start degrading after a few turns. One long session or a break, and the context you spent hours building is effectively gone." },
                { title: "Fractured Rabbit Holes", desc: "Asking an exploratory side-question disrupts the main thread and derails the entire conversation flow." },
                { title: "No Accumulated Progress", desc: "Dozens of unstructured chat logs in a sidebar with zero visual sense of what is understood vs what remains open." },
                { title: "Disconnected References", desc: "PDFs and videos live in separate apps, requiring endless copy-pasting and loss of citation grounding." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400/60 mt-2 flex-shrink-0" />
                  <div>
                    <strong className="text-[15px] font-semibold text-white/95 block leading-snug">{item.title}</strong>
                    <span className="text-[13px] text-white/50 leading-relaxed mt-1 block">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Column B: Whyit Living Studio */}
          <div className="rounded-[28px] border border-[var(--color-accent-primary)]/40 bg-[#12141F]/90 p-7 sm:p-9 space-y-6 shadow-[0_16px_48px_-12px_rgba(99,102,241,0.2)]">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-accent-hover)] font-medium flex items-center gap-2">
                <SparklesIcon className="w-3.5 h-3.5" />
                Whyit Studio Experience
              </span>
              <CheckIcon className="w-4 h-4 text-[var(--color-system-green)]" />
            </div>

            <ul className="space-y-5">
              {[
                { title: "Permanent Project Canvas", desc: "Conversations live inside dedicated knowledge projects with token-budgeted memory that never resets." },
                { title: "Curiosity Side-Threads", desc: "Explore spontaneous rabbit holes in floating non-destructive panels, with zero disruption to the primary inquiry." },
                { title: "Visible Cognitive Map", desc: "Track explored concepts, citations, and open inquiries in a structured, permanent context drawer." },
                { title: "Ingested Source Engine", desc: "Upload textbook PDFs and YouTube lectures; the AI cites exact page numbers and timestamps directly." },
              ].map((item) => (
                <li key={item.title} className="flex items-start gap-3.5 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-system-green)] mt-2 flex-shrink-0" />
                  <div>
                    <strong className="text-[15px] font-semibold text-white block leading-snug">{item.title}</strong>
                    <span className="text-[13px] text-white/70 leading-relaxed mt-1 block">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* ── SECTION 3: EXPANSIVE CALLOUT CAPSULE ── */}
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-b from-[#141622] to-[#0A0B10] p-9 sm:p-16 text-center relative overflow-hidden shadow-2xl">
        <div className="radial-ambient-hero absolute inset-0 pointer-events-none opacity-70" />
        <div className="relative z-10 max-w-[680px] mx-auto space-y-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-accent-hover)] font-medium">
            Start Your Inquiry
          </span>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white apple-gradient-text">
            Build something you will actually understand.
          </h2>
          <p className="text-[15px] sm:text-base text-white/65 leading-relaxed">
            Whether you are unpacking Machine Learning, Quantum Computing, Macroeconomics, or Philosophy—Whyit gives your curiosity a permanent home.
          </p>
          <div className="pt-2">
            <Link
              href="/goal-capture"
              className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full text-[15px] font-semibold bg-white text-black hover:bg-white/95 shadow-[0_0_40px_rgba(255,255,255,0.25)] transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Create your workspace</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export { LandingContent };
