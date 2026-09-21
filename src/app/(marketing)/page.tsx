import type { Metadata } from "next";
import { LandingHero } from "@/features/landing/LandingHero";
import { InteractiveDemo } from "@/features/landing/InteractiveDemo";
import { LandingContent } from "@/features/landing/LandingContent";

export const metadata: Metadata = {
  title: "Whyit — An AI Workspace for Learning",
  description:
    "An AI workspace built around how people actually learn. Start with a question, build a dedicated space, and grow through sustained conversation.",
};

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center px-6 sm:px-10 pt-12 pb-10 sm:pt-20 sm:pb-14">
        <LandingHero />
      </div>

      {/* Interactive Learning Canvas Simulation Preview */}
      <div className="px-6 sm:px-10 pb-20 sm:pb-28">
        <InteractiveDemo />
      </div>

      {/* Optical Divider */}
      <div className="w-full max-w-[1380px] mx-auto h-px bg-white/[0.08]" />

      {/* Editorial Content */}
      <div className="px-6 sm:px-10 py-16 sm:py-24">
        <LandingContent />
      </div>
    </div>
  );
}
