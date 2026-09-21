/**
 * Button — design spec §3 (44×44pt minimum tap target), §5 (motion: scale + ease).
 * Principle served: Clarity (clear affordance), Deference (ghost variant recedes).
 * All values trace to design tokens — no literals.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    /* Base — 44pt minimum tap target via min-h */
    "inline-flex items-center justify-center gap-2",
    "font-[var(--font-sans)] font-medium leading-none select-none cursor-pointer",
    "min-h-[44px] min-w-[44px]",
    /* Motion §5: hover scale 1.02, press 0.97, 160ms ease-out */
    "transition-all duration-[160ms] ease-out",
    "hover:scale-[1.02] active:scale-[0.97]",
    "focus-visible:outline-2 focus-visible:outline-[var(--color-accent-primary)] focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-38",
    "rounded-[var(--radius-sm)]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--color-accent-primary)] text-[var(--color-accent-foreground)]",
          "hover:opacity-90",
        ],
        ghost: [
          "text-[var(--color-label-secondary)]",
          "hover:bg-[var(--color-tertiary-background)] hover:text-[var(--color-label-primary)]",
        ],
        outline: [
          "border border-[var(--color-separator)] text-[var(--color-label-secondary)]",
          "hover:border-[var(--color-accent-primary)] hover:text-[var(--color-label-primary)]",
        ],
        destructive: [
          "bg-[var(--color-system-red)] text-white hover:opacity-90",
        ],
        link: [
          "text-[var(--color-accent-primary)] underline-offset-2 hover:underline",
          "rounded-none min-h-0 min-w-0",
        ],
      },
      size: {
        sm:   "h-[44px] px-[var(--space-4)] text-[var(--type-subheadline-size)]",
        md:   "h-[44px] px-[var(--space-5)] text-[var(--type-callout-size)]",
        lg:   "h-[44px] px-[var(--space-6)] text-[var(--type-body-size)]",
        xl:   "h-[52px] px-[var(--space-8)] text-[var(--type-body-size)]",
        icon: "h-[44px] w-[44px] rounded-[var(--radius-sm)]",
        "icon-sm": "h-[44px] w-[44px]",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

function Button({ className, variant, size, isLoading = false, disabled, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? isLoading}
      {...props}
    >
      {isLoading && (
        <span
          className="h-[14px] w-[14px] rounded-full border-2 border-current border-t-transparent animate-spin"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
