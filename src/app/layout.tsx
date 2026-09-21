import type { Metadata } from "next";
import "@/app/globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: { default: "Whyit — An AI Workspace for Learning", template: "%s | Whyit" },
  description:
    "An AI workspace built around how people actually learn. Start with a question, build a dedicated space, and grow through sustained conversation.",
};

/**
 * Root layout — system font stack (SF Pro on Apple, Segoe UI / Roboto elsewhere).
 * No external font import: the system stack resolves correctly per §1 of the design spec.
 * Dark mode is the default via CSS tokens; prefers-color-scheme switches to light automatically.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
