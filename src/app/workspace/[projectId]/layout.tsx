import type { Metadata } from "next";
import WorkspaceShell from "./WorkspaceShell";

export const metadata: Metadata = {
  title: "Workspace",
};

/**
 * Workspace layout — route group: /workspace/[projectId]
 *
 * This layout wraps all workspace routes in the three-panel shell.
 * WorkspaceShell is a client component (needs sessionStorage + router);
 * this layout itself is a server component.
 */
export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceShell>{children}</WorkspaceShell>;
}
