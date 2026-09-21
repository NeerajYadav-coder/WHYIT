import Link from "next/link";
import { Button } from "@/components/ui/Button";

/**
 * Global 404 page — shown for unmatched routes.
 */
export default function NotFound() {
  return (
    <div className="min-h-full flex items-center justify-center px-6 py-16">
      <div className="text-center max-w-[400px]">
        <p className="text-[var(--text-xs)] font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-6">
          404
        </p>
        <h1 className="text-[var(--text-2xl)] font-semibold text-[var(--color-text-primary)] tracking-[-0.03em] mb-3">
          Page not found
        </h1>
        <p className="text-[var(--text-sm)] text-[var(--color-text-secondary)] leading-relaxed mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button id="not-found-home" variant="primary" size="md">
            Go home
          </Button>
        </Link>
      </div>
    </div>
  );
}
