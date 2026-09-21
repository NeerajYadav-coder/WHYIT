/**
 * Wordmark — original Whyit logotype.
 * Server component. Updated to use Apple semantic tokens.
 */

import { cn } from "@/lib/utils";

interface WordmarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { text: "var(--type-callout-size)", svgSize: 24, strokeW: 1.5 },
  md: { text: "var(--type-title-2-size)", svgSize: 28, strokeW: 1.5 },
  lg: { text: "var(--type-title-1-size)", svgSize: 36, strokeW: 1.5 },
};

function Wordmark({ size = "md", className }: WordmarkProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <svg
        width={s.svgSize}
        height={s.svgSize}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          <linearGradient id="whyit-emblem-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-accent-hover)" />
            <stop offset="100%" stopColor="var(--color-accent-primary)" />
          </linearGradient>
          <filter id="whyit-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Ring */}
        <circle
          cx="16"
          cy="16"
          r="13.5"
          stroke="var(--color-accent-primary)"
          strokeWidth="1.25"
          strokeOpacity="0.4"
          strokeDasharray="1.5 2.5"
        />

        {/* Outer Precision Ring */}
        <circle
          cx="16"
          cy="16"
          r="15"
          stroke="var(--color-separator)"
          strokeWidth="0.75"
        />

        {/* The Intellectual 'W' & Compass Spark */}
        <path
          d="M9 11.5 L12.5 22 L16 15.5 L19.5 22 L23 11.5"
          stroke="url(#whyit-emblem-grad)"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Zenith Spark (First-Principles Illumination) */}
        <circle
          cx="16"
          cy="9"
          r="1.5"
          fill="var(--color-accent-hover)"
          filter="url(#whyit-glow)"
        />
      </svg>
      <span
        style={{
          fontSize: s.text,
          fontFamily: "var(--font-sans)",
          fontWeight: 650,
          letterSpacing: "-0.035em",
          color: "var(--color-label-primary)",
        }}
      >
        Whyit
      </span>
    </div>
  );
}

export { Wordmark };
