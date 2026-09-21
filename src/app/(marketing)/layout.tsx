/**
 * Marketing layout — (marketing) route group.
 * Principle: Deference — nav is translucent glass, never covers or competes.
 * §4: backdrop-filter blur(20px), §5: smooth scroll.
 */

import Link from "next/link";
import { Wordmark } from "@/features/landing/Wordmark";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex flex-col selection:bg-[var(--color-accent-dim)] selection:text-white relative overflow-x-hidden" style={{ background: "var(--color-system-background)" }}>
      {/* Ambient Top Glow */}
      <div className="radial-ambient-hero absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1600px] h-[700px] pointer-events-none -z-10" />

      {/* Floating Frosted Pill Header */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 pb-2 pointer-events-none">
        <header
          className="pointer-events-auto w-full max-w-[1380px] h-[62px] rounded-full border border-white/10 px-6 sm:px-8 flex items-center justify-between transition-all duration-300 shadow-[0_12px_36px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] bg-[#10121A]/85 backdrop-blur-2xl"
        >
          <Link href="/" aria-label="Whyit — home" className="hover:opacity-90 transition-opacity flex items-center gap-2">
            <Wordmark size="sm" />
          </Link>

          <nav aria-label="Site navigation" className="hidden md:flex items-center gap-8 text-[13px] font-medium text-white/60">
            <a href="#interactive-demo" className="hover:text-white transition-colors duration-150">
              Studio Demo
            </a>
            <a href="#features" className="hover:text-white transition-colors duration-150">
              Architecture
            </a>
            <Link href="/sign-in" className="hover:text-white transition-colors duration-150">
              Sign in
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/goal-capture"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-[13px] font-semibold tracking-tight bg-white text-black hover:bg-white/95 transition-all duration-150 shadow-md active:scale-95"
            >
              Start workspace
            </Link>
          </div>
        </header>
      </div>

      <main id="main-content" className="flex-1 pt-24">
        {children}
      </main>

      <footer
        className="flex-shrink-0 border-t mt-auto py-14 border-white/[0.08] bg-[#0A0B0E]"
      >
        <div
          className="mx-auto flex flex-col md:flex-row items-center justify-between gap-6 px-6 sm:px-10 max-w-[1380px]"
        >
          <div className="flex items-center gap-4">
            <Wordmark size="sm" />
            <span className="text-white/20">|</span>
            <p className="text-xs font-mono text-white/40">
              The First-Principles Learning Workspace
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/40 font-mono">
            <span>Non-destructive side-threads</span>
            <span className="text-white/15">·</span>
            <span>Grounded multi-source truth</span>
            <span className="text-white/15">·</span>
            <span>&copy; {new Date().getFullYear()} Whyit</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
