"use client";

import { useState, useEffect } from "react";
import { BrainIcon, CompassIcon, SparklesIcon, BookOpenIcon, CheckCircle2Icon } from "lucide-react";
import type { Project } from "@prisma/client";

interface ProjectMemoryPanelProps {
  projectId: string;
}

export function ProjectMemoryPanel({ projectId }: ProjectMemoryPanelProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || projectId === "default") {
      setLoading(false);
      return;
    }

    let active = true;
    async function load() {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data.project) {
            setProject(data.project);
          }
        }
      } catch (err) {
        console.error("[ProjectMemoryPanel] Failed to fetch project:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-5 flex flex-col gap-3 animate-pulse">
        <div className="h-4 bg-[var(--color-surface-4)] rounded w-2/3" />
        <div className="h-20 bg-[var(--color-secondary-background)] rounded-xl border border-[var(--color-separator)]" />
        <div className="h-24 bg-[var(--color-secondary-background)] rounded-xl border border-[var(--color-separator)]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-5 text-left">
      {/* Header Badge */}
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-accent-primary)]">
        <BrainIcon className="h-3.5 w-3.5" />
        <span>Active Cognitive Memory</span>
      </div>

      {/* Goal Memory Card */}
      <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] p-4 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-label-secondary)]">
          <CompassIcon className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" />
          <span>Core Learning Objective</span>
        </div>
        <p className="type-subheadline font-semibold text-[var(--color-label-primary)] leading-snug">
          {project?.goal || "Explore and master fundamentals from first principles."}
        </p>
      </div>

      {/* Motivation Anchor Card */}
      <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] p-4 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-label-secondary)]">
          <SparklesIcon className="h-3.5 w-3.5 text-amber-400" />
          <span>Underlying Motivation</span>
        </div>
        <p className="type-body text-xs sm:text-sm text-[var(--color-label-secondary)] leading-relaxed">
          {project?.motivation || "Deep conceptual understanding without surface memorization."}
        </p>
      </div>

      {/* Learner Cognitive Profile */}
      <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-label-secondary)]">
          <BookOpenIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>Learner Context & Background</span>
        </div>
        <p className="type-body text-xs text-[var(--color-label-secondary)] leading-relaxed">
          {project?.context || "First-principles learner. Prefers mathematical rigor, mechanistic intuition, and concrete examples."}
        </p>
      </div>

      {/* Grounding Axioms */}
      <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-tertiary-background)] p-4 flex flex-col gap-2.5">
        <p className="type-caption-1 font-semibold uppercase tracking-wider text-[var(--color-label-tertiary)]">
          Grounding Axioms
        </p>
        <div className="flex items-start gap-2 text-xs text-[var(--color-label-secondary)]">
          <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <span>Direct retrieval from uploaded papers and notes</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-[var(--color-label-secondary)]">
          <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <span>Full LaTeX mathematical notation rendering</span>
        </div>
        <div className="flex items-start gap-2 text-xs text-[var(--color-label-secondary)]">
          <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
          <span>Persistent cross-session curiosity side-threads</span>
        </div>
      </div>
    </div>
  );
}
