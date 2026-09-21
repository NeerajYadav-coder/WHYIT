import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your Whyit workspace account.",
};

/**
 * Sign Up page — placeholder UI only, no auth logic.
 * Route: /sign-up
 */
export default function SignUpPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-6 py-16">
      <div className="w-full max-w-[360px]">
        <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)] tracking-[-0.03em] mb-2">
          Create an account
        </h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-8">
          Build a workspace for what you want to learn.
        </p>

        <form aria-label="Sign up form" className="space-y-4">
          <div>
            <label
              htmlFor="signup-name"
              className="block text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              Name
            </label>
            <input
              id="signup-name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              disabled
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-primary)] text-[var(--text-sm)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50 focus:outline-none focus:border-[var(--color-border-focus)] transition-colors duration-[var(--duration-base)]"
            />
          </div>
          <div>
            <label
              htmlFor="signup-email"
              className="block text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              Email
            </label>
            <input
              id="signup-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-primary)] text-[var(--text-sm)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50 focus:outline-none focus:border-[var(--color-border-focus)] transition-colors duration-[var(--duration-base)]"
            />
          </div>
          <div>
            <label
              htmlFor="signup-password"
              className="block text-[var(--text-sm)] font-medium text-[var(--color-text-secondary)] mb-1.5"
            >
              Password
            </label>
            <input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              disabled
              className="w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-1)] text-[var(--color-text-primary)] text-[var(--text-sm)] placeholder:text-[var(--color-text-muted)] disabled:opacity-50 focus:outline-none focus:border-[var(--color-border-focus)] transition-colors duration-[var(--duration-base)]"
            />
          </div>

          <div className="pt-2">
            <Button
              id="signup-submit"
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled
            >
              Create Account
            </Button>
          </div>
        </form>

        <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-4 py-3">
          <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] leading-relaxed">
            Authentication is not yet implemented. This page is a structural placeholder.
          </p>
        </div>

        <p className="text-center text-[var(--text-sm)] text-[var(--color-text-muted)] mt-6">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[var(--color-accent)] hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
