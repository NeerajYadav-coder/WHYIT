import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Whyit workspace settings.",
};

/**
 * Settings page — structural placeholder.
 * Route: /settings
 *
 * When settings features are built, add sections here.
 * The layout is intentionally isolated so settings don't share workspace chrome.
 */
export default function SettingsPage() {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-[480px]">
        <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)] tracking-[-0.03em] mb-2">
          Settings
        </h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] mb-10">
          Workspace preferences and account settings will appear here.
        </p>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-1)] px-6 py-5 mb-6">
          <p className="text-[var(--text-xs)] text-[var(--color-text-muted)] leading-relaxed">
            Settings are not yet implemented. This page is a structural placeholder.
          </p>
        </div>

        <Link href="/">
          <Button id="settings-back-home" variant="ghost" size="md">
            ← Back to home
          </Button>
        </Link>
      </div>
    </div>
  );
}
