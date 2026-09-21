"use client";

import { useState, useEffect } from "react";
import { BarChart2Icon, BookOpenIcon, SparklesIcon, CheckCircleIcon, LayersIcon } from "lucide-react";
import type { SideConversation } from "@/lib/types";

interface ProjectProgressPanelProps {
  projectId: string;
}

interface ResourceItem {
  id: string;
  title: string;
  type: string;
  wordCount: number;
  tokenEstimate: number;
  metadata?: {
    headings?: string[];
  };
  _count?: {
    chunks: number;
  };
}

export function ProjectProgressPanel({ projectId }: ProjectProgressPanelProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [curiosities, setCuriosities] = useState<SideConversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId || projectId === "default") {
      setLoading(false);
      return;
    }

    let active = true;
    async function loadData() {
      try {
        const [resResp, curResp] = await Promise.all([
          fetch(`/api/resources?projectId=${encodeURIComponent(projectId)}`),
          fetch(`/api/curiosities?projectId=${encodeURIComponent(projectId)}`),
        ]);

        if (resResp.ok) {
          const resData = await resResp.json();
          if (active && resData.resources) {
            setResources(resData.resources);
          }
        }

        if (curResp.ok) {
          const curData = await curResp.json();
          if (active && curData.curiosities) {
            setCuriosities(curData.curiosities);
          }
        }
      } catch (err) {
        console.error("[ProjectProgressPanel] Error fetching progress:", err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => { active = false; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="p-5 flex flex-col gap-3 animate-pulse">
        <div className="h-4 bg-[var(--color-surface-4)] rounded w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-16 bg-[var(--color-secondary-background)] rounded-xl" />
          <div className="h-16 bg-[var(--color-secondary-background)] rounded-xl" />
        </div>
        <div className="h-32 bg-[var(--color-secondary-background)] rounded-xl" />
      </div>
    );
  }

  const totalChunks = resources.reduce((acc, r) => acc + (r._count?.chunks || 0), 0);
  const totalWords = resources.reduce((acc, r) => acc + (r.wordCount || 0), 0);

  // Extract all headings across resources
  const allHeadings = resources.flatMap((r) => r.metadata?.headings || []);

  return (
    <div className="p-4 sm:p-5 flex flex-col gap-5 text-left">
      {/* Header */}
      <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-accent-primary)]">
        <BarChart2Icon className="h-3.5 w-3.5" />
        <span>Exploration & Concept Mastery</span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] p-3.5 flex flex-col gap-1 shadow-sm">
          <span className="type-caption-2 text-[var(--color-label-tertiary)] flex items-center gap-1">
            <LayersIcon className="h-3 w-3 text-indigo-400" /> Semantic Chunks
          </span>
          <span className="text-xl font-bold text-[var(--color-label-primary)] font-mono">
            {totalChunks}
          </span>
          <span className="type-caption-2 text-[var(--color-label-tertiary)]">
            {totalWords.toLocaleString()} words ({resources.length} {resources.length === 1 ? "source" : "sources"})
          </span>
        </div>

        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] p-3.5 flex flex-col gap-1 shadow-sm">
          <span className="type-caption-2 text-[var(--color-label-tertiary)] flex items-center gap-1">
            <SparklesIcon className="h-3 w-3 text-amber-400" /> Side Inquiries
          </span>
          <span className="text-xl font-bold text-[var(--color-label-primary)] font-mono">
            {curiosities.length}
          </span>
          <span className="type-caption-2 text-[var(--color-label-tertiary)]">
            curiosity branches
          </span>
        </div>
      </div>

      {/* Concept Coverage Map */}
      <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="type-caption-1 font-semibold uppercase tracking-wider text-[var(--color-label-secondary)] flex items-center gap-1.5">
            <BookOpenIcon className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" />
            Concept Map & Headings
          </span>
          <span className="type-caption-2 text-[var(--color-label-tertiary)] font-mono">
            {allHeadings.length} topics
          </span>
        </div>

        {allHeadings.length === 0 ? (
          <p className="type-caption-1 text-[var(--color-label-tertiary)] italic py-2">
            Upload notes, research papers, or transcripts in the Resources tab to map concepts automatically.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
            {allHeadings.map((heading, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 rounded-lg bg-[var(--color-primary-background)] border border-[var(--color-separator)] text-xs text-[var(--color-label-primary)]"
              >
                <CheckCircleIcon className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="truncate">{heading}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Explored Curiosities List */}
      {curiosities.length > 0 && (
        <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-tertiary-background)] p-4 flex flex-col gap-2.5">
          <span className="type-caption-1 font-semibold uppercase tracking-wider text-[var(--color-label-secondary)]">
            Investigated Sub-Questions
          </span>
          <div className="flex flex-col gap-2">
            {curiosities.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="p-2.5 rounded-lg bg-[var(--color-secondary-background)] border border-[var(--color-separator)] flex flex-col gap-1"
              >
                <span className="type-subheadline text-xs font-medium text-[var(--color-label-primary)] line-clamp-1">
                  {c.title}
                </span>
                <div className="flex items-center justify-between text-[10px] text-[var(--color-label-tertiary)]">
                  <span>{c.messages.length} exchanges</span>
                  {c.sectionHeading && (
                    <span className="truncate max-w-[140px] text-[var(--color-accent-primary)]">
                      {c.sectionHeading}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
