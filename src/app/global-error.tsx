"use client";
// Must be a client component — error boundaries require client-side React lifecycle.

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error boundary — catches unhandled errors in the route tree.
 * Shows a calm, minimal error state without exposing internals.
 */
export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log to your error tracking service here when ready (e.g. Sentry)
    // Do not use console.error in production code
    void error;
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full flex items-center justify-center bg-[var(--color-surface-0)]">
        <div className="text-center px-6 py-16 max-w-[400px]">
          <div
            className="h-10 w-10 mx-auto mb-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="h-2 w-2 rounded-full bg-[var(--color-error)]" />
          </div>
          <h1 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)] mb-3 tracking-[-0.02em]">
            Something went wrong
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            An unexpected error occurred. Your work is safe — this affects only the current view.
          </p>
          <Button id="error-reset" variant="primary" size="md" onClick={reset}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
