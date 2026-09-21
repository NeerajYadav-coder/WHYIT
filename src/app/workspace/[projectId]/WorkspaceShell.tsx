"use client";
// Client boundary: fetches projects from the API and wires up navigation.

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { LeftSidebar } from "@/features/workspace/LeftSidebar";
import { RightSidebar } from "@/features/workspace/RightSidebar";
import type { Project } from "@/lib/types";

/**
 * WorkspaceShell — three-panel layout: LeftSidebar | main | RightSidebar.
 *
 * Projects are fetched from GET /api/projects (database-backed).
 * Pass active projectId to RightSidebar so it reactively updates on navigation.
 */
function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const params = useParams<{ projectId?: string }>();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((json: { projects?: Project[] }) => {
        if (json.projects) setProjects(json.projects);
      })
      .catch(console.error);
  }, []);

  function handleNewProject() {
    router.push("/goal-capture");
  }

  return (
    <div className="flex h-full overflow-hidden bg-[var(--color-surface-0)]">
      {/* Left sidebar */}
      <LeftSidebar projects={projects} onNewProject={handleNewProject} />

      {/* Main area */}
      <main
        id="workspace-main"
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        aria-label="Workspace conversation"
      >
        {children}
      </main>

      {/* Right sidebar — hidden on mobile, visible from md breakpoint */}
      <div className="hidden md:flex">
        <RightSidebar projectId={params?.projectId} />
      </div>
    </div>
  );
}

export default WorkspaceShell;
