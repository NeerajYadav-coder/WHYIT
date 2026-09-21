import type { Metadata } from "next";
import { GoalCaptureFlow } from "@/features/goal-capture/GoalCaptureFlow";
import { Wordmark } from "@/features/landing/Wordmark";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Start Your Workspace",
  description: "Tell Whyit what you want to learn and why it matters to you.",
};

/**
 * Goal Capture page — route: /goal-capture
 *
 * This page is a server component; GoalCaptureFlow is the single client boundary.
 * Layout is intentionally minimal — this is a focused, conversation-like experience.
 */
export default function GoalCapturePage() {
  return (
    <div className="min-h-full flex flex-col relative overflow-x-hidden selection:bg-[var(--color-accent-dim)] selection:text-white" style={{ background: "var(--color-system-background)" }}>
      {/* Ambient Radial Spotlight */}
      <div className="radial-ambient-hero absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1500px] h-[600px] pointer-events-none -z-10" />

      {/* Frosted Header */}
      <header className="flex-shrink-0 border-b border-white/[0.08] bg-[#0A0B0E]/80 backdrop-blur-xl">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-10 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Back to Whyit homepage" className="hover:opacity-90 transition-opacity">
            <Wordmark size="sm" />
          </Link>
          <span className="text-xs font-mono text-white/40 uppercase tracking-wider">
            Workspace Initialization
          </span>
        </div>
      </header>

      {/* Main Studio Area */}
      <main
        id="main-content"
        className="flex-1 flex flex-col justify-start px-4 sm:px-6 py-10 sm:py-14"
        aria-label="Goal capture studio"
      >
        <GoalCaptureFlow />
      </main>
    </div>
  );
}
