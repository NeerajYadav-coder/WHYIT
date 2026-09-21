"use client";
// Client boundary: event handlers for auto-resize and keyboard interaction.

import * as React from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const resolvedRef = (ref as React.RefObject<HTMLTextAreaElement>) ?? internalRef;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoResize && resolvedRef.current) {
        resolvedRef.current.style.height = "auto";
        resolvedRef.current.style.height = `${resolvedRef.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <textarea
        ref={resolvedRef}
        className={cn(
          "w-full resize-none bg-transparent",
          "text-[var(--color-label-primary)]",
          "placeholder:text-[var(--color-label-tertiary)]",
          "font-[var(--font-sans)]",
          "text-[var(--type-body-size)] leading-[var(--type-body-lh)]",
          "tracking-[var(--type-body-ls)]",
          "focus:outline-none",
          className
        )}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
