"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart2Icon,
  BookOpenIcon,
  SparklesIcon,
  CheckCircle2Icon,
  LayersIcon,
  BrainIcon,
} from "lucide-react";
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

interface AxiomItem {
  id: string;
  statement: string;
  category: string;
  status: "DISCOVERED" | "IN_PROGRESS" | "MASTERED";
}

export function ProjectProgressPanel({ projectId }: ProjectProgressPanelProps) {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [curiosities, setCuriosities] = useState<SideConversation[]>([]);
  const [axioms, setAxioms] = useState<AxiomItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!projectId || projectId === "default") {
      setLoading(false);
      return;
    }

    try {
      const [resResp, curResp, axResp] = await Promise.all([
        fetch(`/api/resources?projectId=${encodeURIComponent(projectId)}`),
        fetch(`/api/curiosities?projectId=${encodeURIComponent(projectId)}`),
        fetch(`/api/axioms?projectId=${encodeURIComponent(projectId)}`),
      ]);

      if (resResp.ok) {
        const resData = await resResp.json();
        if (resData.resources) setResources(resData.resources);
      }

      if (curResp.ok) {
        const curData = await curResp.json();
        if (curData.curiosities) setCuriosities(curData.curiosities);
      }

      if (axResp.ok) {
        const axData = await axResp.json();
        if (axData.axioms) setAxioms(axData.axioms);
      }
    } catch (err) {
      console.error("[ProjectProgressPanel] Error fetching progress:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();

    const handleAxiomsUpdated = () => {
      loadData();
    };
    window.addEventListener("whyit:axioms_updated", handleAxiomsUpdated);

    return () => {
      window.removeEventListener("whyit:axioms_updated", handleAxiomsUpdated);
    };
  }, [loadData]);

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

  // Axiom mastery counts
  const masteredCount = axioms.filter((a) => a.status === "MASTERED").length;
  const inProgressCount = axioms.filter((a) => a.status === "IN_PROGRESS").length;
  const discoveredCount = axioms.filter((a) => a.status === "DISCOVERED").length;
  const totalAxioms = axioms.length;

  const masteredPct = totalAxioms > 0 ? Math.round((masteredCount / totalAxioms) * 100) : 0;
  const inProgressPct = totalAxioms > 0 ? Math.round((inProgressCount / totalAxioms) * 100) : 0;
  const discoveredPct = totalAxioms > 0 ? 100 - masteredPct - inProgressPct : 0;

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

      {/* Mastery Progress Bar */}
      <div className="rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] p-4 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="type-caption-1 font-semibold uppercase tracking-wider text-[var(--color-label-secondary)] flex items-center gap-1.5">
            <BrainIcon className="h-3.5 w-3.5 text-emerald-400" />
            Concept Mastery
          </span>
          <span className="type-caption-2 text-emerald-400 font-mono font-medium">
            {masteredPct}% Mastered
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-2 w-full rounded-full bg-[var(--color-primary-background)] overflow-hidden flex">
          {masteredPct > 0 && (
            <div
              style={{ width: `${masteredPct}%` }}
              className="h-full bg-emerald-500 transition-all duration-500"
              title={`Mastered: ${masteredCount}`}
            />
          )}
          {inProgressPct > 0 && (
            <div
              style={{ width: `${inProgressPct}%` }}
              className="h-full bg-amber-500 transition-all duration-500"
              title={`In Progress: ${inProgressCount}`}
            />
          )}
          {discoveredPct > 0 && (
            <div
              style={{ width: `${discoveredPct}%` }}
              className="h-full bg-indigo-500 transition-all duration-500"
              title={`Discovered: ${discoveredCount}`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--color-label-tertiary)] pt-1">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {masteredCount} Mastered
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            {inProgressCount} Investigating
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            {discoveredCount} Discovered
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
                <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
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
