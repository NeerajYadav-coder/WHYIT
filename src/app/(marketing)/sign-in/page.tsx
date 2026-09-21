import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Whyit workspace.",
};

/**
 * Sign In page — placeholder UI only, no auth logic.
 * Route: /sign-in
 *
 * When auth is implemented, wire the form to your auth provider here.
 * The layout and component structure will not need to change.
 */
export default function SignInPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-6 py-16">
      <div className="w-full max-w-[360px]">
        <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)] tracking-[-0.03em] mb-2">
          Welcome back
        </h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-8">
          Sign in to continue your workspace.
        </p>

        {/* Placeholder form — no auth logic yet */}
        <form aria-label="Sign in form" className="space-y-4">
          <div>
            <label
              htmlFor="signin-email"
              className="block text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              Email
            </label>
            <input
              id="signin-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-primary)] text-[var(--text-sm)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50 focus:outline-none focus:border-[var(--color-border-focus)] transition-colors duration-[var(--duration-base)]"
            />
          </div>
          <div>
            <label
              htmlFor="signin-password"
              className="block text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              Password
            </label>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              disabled
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-primary)] text-[var(--text-sm)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50 focus:outline-none focus:border-[var(--color-border-focus)] transition-colors duration-[var(--duration-base)]"
            />
          </div>

          <div className="pt-2">
            <Button
              id="signin-submit"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled
            >
              Sign In
            </Button>
          </div>
        </form>

        {/* Auth not implemented notice */}
        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-3">
          <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] leading-relaxed">
            Authentication is not yet implemented. This page is a structural placeholder.
          </p>
        </div>

        <p className="text-center text-[var(--text-sm)] text-[var(--color-text-muted)] mt-6">
          Don&rsquo;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-[var(--color-accent)] hover:underline underline-offset-2"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
