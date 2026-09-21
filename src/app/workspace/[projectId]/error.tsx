"use client";
// Client component required for error boundaries in Next.js App Router.

import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface WorkspaceErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Workspace-level error boundary — shown when the workspace route throws.
 */
export default function WorkspaceError({ error: _error, reset }: WorkspaceErrorProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
      <div
        className="h-10 w-10 mx-auto mb-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="h-2 w-2 rounded-full bg-[var(--color-error)]" />
      </div>
      <h2 className="text-[var(--text-lg)] font-semibold text-[var(--color-text-primary)] mb-3 tracking-[-0.02em]">
        Couldn&rsquo;t load this workspace
      </h2>
      <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-8 leading-relaxed max-w-[320px]">
        There was a problem loading this conversation. Your other workspaces are unaffected.
      </p>
      <div className="flex items-center gap-3">
        <Button id="workspace-error-reset" variant="primary" size="md" onClick={reset}>
          Try again
        </Button>
        <Link href="/">
          <Button id="workspace-error-home" variant="ghost" size="md">
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
