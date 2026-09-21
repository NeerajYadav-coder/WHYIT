"use client";
// Client boundary: IntersectionObserver for scroll-triggered reveals.
// Principle: Deference — motion serves content entrance, never decorative.
// §5: enter curve cubic-bezier(0.32, 0.72, 0, 1), 250–350ms.

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Stagger delay in ms for sequential card reveals */
  delay?: number;
  /** Animation variant */
  variant?: "fade-up" | "fade-in" | "scale-settle";
}

/**
 * Wraps any content in a scroll-triggered reveal animation.
 * Uses IntersectionObserver — no layout shift, fires once.
 * Respects prefers-reduced-motion via CSS.
 */
function AnimatedSection({
  children,
  className,
  style,
  delay = 0,
  variant = "fade-up",
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const base = "transition-none";
  const hidden: Record<typeof variant, string> = {
    "fade-up":     "opacity-0 translate-y-[20px]",
    "fade-in":     "opacity-0",
    "scale-settle": "opacity-0 scale-[0.97]",
  };
  const shown: Record<typeof variant, string> = {
    "fade-up":     "opacity-100 translate-y-0",
    "fade-in":     "opacity-100",
    "scale-settle": "opacity-100 scale-100",
  };

  return (
    <div
      ref={ref}
      className={cn(base, visible ? shown[variant] : hidden[variant], className)}
      style={{
        transition: visible
          ? `opacity 350ms cubic-bezier(0.32,0.72,0,1) ${delay}ms,
             transform 350ms cubic-bezier(0.32,0.72,0,1) ${delay}ms`
          : "none",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export { AnimatedSection };
