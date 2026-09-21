import Link from "next/link";
import { Wordmark } from "./Wordmark";
import { ArrowRightIcon, ChevronDownIcon } from "lucide-react";

function LandingHero() {
  return (
    <section
      id="hero"
      className="flex flex-col items-center justify-center text-center animate-fade-up max-w-[1360px] mx-auto pt-10 pb-16 px-6 sm:px-10 relative"
      aria-labelledby="hero-heading"
    >
      {/* Eyebrow Pill */}
      <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-xl mb-8 shadow-sm transition-all hover:border-white/20">
        <Wordmark size="sm" />
        <span className="text-white/20">|</span>
        <span className="text-[12px] font-mono tracking-wider uppercase text-white/70">
          The First-Principles Studio
        </span>
      </div>

      {/* Cinematic Display Title */}
      <h1
        id="hero-heading"
        className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-medium tracking-[-0.035em] leading-[1.05] apple-gradient-text text-balance max-w-[1120px] mx-auto mb-7"
      >
        Knowledge that stays. Thinking that compounds.
      </h1>

      {/* Subtitle with generous breathing room */}
      <p className="text-lg sm:text-xl md:text-2xl text-white/60 font-normal leading-relaxed text-balance max-w-[880px] mx-auto mb-10">
        A grounded AI workspace designed for sustained mastery. Bring papers, lecture videos, and deep inquiries into one persistent living canvas—and branch into side-threads without losing your train of thought.
      </p>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 w-full sm:w-auto">
        <Link
          href="/goal-capture"
          id="cta-start-workspace"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full text-[15px] font-semibold bg-white text-black hover:bg-white/95 shadow-[0_0_36px_rgba(255,255,255,0.22)] transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Open learning workspace</span>
          <ArrowRightIcon className="w-4 h-4" />
        </Link>

        <a
          href="#interactive-demo"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-[15px] font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/20 bg-white/[0.03] backdrop-blur-lg transition-all active:scale-[0.98]"
        >
          <span>Live canvas preview</span>
          <ChevronDownIcon className="w-4 h-4 text-white/50" />
        </a>
      </div>

      {/* Quiet Metric Pills */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-white/40 font-mono tracking-tight">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-system-green)]" />
          Zero context loss
        </span>
        <span className="text-white/20">·</span>
        <span>Multi-source grounded (PDF & Video)</span>
        <span className="text-white/20">·</span>
        <span>Curiosity side-threads</span>
        <span className="text-white/20">·</span>
        <span>Persistent workspace memory</span>
      </div>
    </section>
  );
}

export { LandingHero };
