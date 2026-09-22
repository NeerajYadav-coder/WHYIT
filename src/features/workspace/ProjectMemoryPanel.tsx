"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BrainIcon,
  CompassIcon,
  SparklesIcon,
  BookOpenIcon,
  PlusIcon,
  PinIcon,
  Trash2Icon,
  CheckCircle2Icon,
  ClockIcon,
  TagIcon,
} from "lucide-react";
import { renderMarkdown } from "@/lib/markdown";
import type { Project } from "@prisma/client";

interface ProjectMemoryPanelProps {
  projectId: string;
}

interface AxiomItem {
  id: string;
  projectId: string;
  statement: string;
  formula?: string | null;
  category: string;
  status: "DISCOVERED" | "IN_PROGRESS" | "MASTERED";
  evidence?: string | null;
  pinned: boolean;
  createdAt: string;
}

export function ProjectMemoryPanel({ projectId }: ProjectMemoryPanelProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [axioms, setAxioms] = useState<AxiomItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Axiom Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStatement, setNewStatement] = useState("");
  const [newFormula, setNewFormula] = useState("");
  const [newCategory, setNewCategory] = useState("Core Principle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAxioms = useCallback(async () => {
    if (!projectId || projectId === "default") return;
    try {
      const res = await fetch(`/api/axioms?projectId=${encodeURIComponent(projectId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.axioms) setAxioms(data.axioms);
      }
    } catch (err) {
      console.error("[ProjectMemoryPanel] Error fetching axioms:", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || projectId === "default") {
      setLoading(false);
      return;
    }

    let active = true;
    async function load() {
      try {
        const [projRes, axRes] = await Promise.all([
          fetch(`/api/projects/${encodeURIComponent(projectId)}`),
          fetch(`/api/axioms?projectId=${encodeURIComponent(projectId)}`),
        ]);

        if (projRes.ok) {
          const data = await projRes.json();
          if (active && data.project) setProject(data.project);
        }

        if (axRes.ok) {
          const data = await axRes.json();
          if (active && data.axioms) setAxioms(data.axioms);
        }
      } catch (err) {
        console.error("[ProjectMemoryPanel] Failed to fetch project/axioms:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    const handleUpdate = () => {
      fetchAxioms();
    };
    window.addEventListener("whyit:axioms_updated", handleUpdate);

    return () => {
      active = false;
      window.removeEventListener("whyit:axioms_updated", handleUpdate);
    };
  }, [projectId, fetchAxioms]);

  const handleTogglePin = async (axiom: AxiomItem) => {
    try {
      const updatedPinned = !axiom.pinned;
      setAxioms((prev) =>
        prev.map((a) => (a.id === axiom.id ? { ...a, pinned: updatedPinned } : a))
      );

      await fetch("/api/axioms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: axiom.id,
          projectId,
          statement: axiom.statement,
          formula: axiom.formula,
          category: axiom.category,
          status: axiom.status,
          pinned: updatedPinned,
        }),
      });
    } catch (err) {
      console.error("[ProjectMemoryPanel] Failed to toggle pin:", err);
    }
  };

  const handleCycleStatus = async (axiom: AxiomItem) => {
    const nextStatus: Record<AxiomItem["status"], AxiomItem["status"]> = {
      DISCOVERED: "IN_PROGRESS",
      IN_PROGRESS: "MASTERED",
      MASTERED: "DISCOVERED",
    };
    const updatedStatus = nextStatus[axiom.status];

    setAxioms((prev) =>
      prev.map((a) => (a.id === axiom.id ? { ...a, status: updatedStatus } : a))
    );

    try {
      await fetch("/api/axioms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: axiom.id,
          projectId,
          statement: axiom.statement,
          formula: axiom.formula,
          category: axiom.category,
          status: updatedStatus,
          pinned: axiom.pinned,
        }),
      });
      window.dispatchEvent(new CustomEvent("whyit:axioms_updated"));
    } catch (err) {
      console.error("[ProjectMemoryPanel] Failed to update status:", err);
    }
  };

  const handleDelete = async (id: string) => {
    setAxioms((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/axioms?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      window.dispatchEvent(new CustomEvent("whyit:axioms_updated"));
    } catch (err) {
      console.error("[ProjectMemoryPanel] Failed to delete axiom:", err);
    }
  };

  const handleAddAxiom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatement.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/axioms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          statement: newStatement.trim(),
          formula: newFormula.trim() || undefined,
          category: newCategory,
          status: "DISCOVERED",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.axiom) {
          setAxioms((prev) => [data.axiom, ...prev]);
        }
        setNewStatement("");
        setNewFormula("");
        setShowAddForm(false);
        window.dispatchEvent(new CustomEvent("whyit:axioms_updated"));
      }
    } catch (err) {
      console.error("[ProjectMemoryPanel] Failed to add axiom:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-accent-primary)]">
          <BrainIcon className="h-3.5 w-3.5" />
          <span>Active Cognitive Memory</span>
        </div>
        <span className="type-caption-2 font-mono text-[var(--color-label-tertiary)]">
          {axioms.length} {axioms.length === 1 ? "axiom" : "axioms"}
        </span>
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

      {/* Established Axioms Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="type-caption-1 font-semibold uppercase tracking-wider text-[var(--color-label-secondary)] flex items-center gap-1.5">
            <BookOpenIcon className="h-3.5 w-3.5 text-[var(--color-accent-primary)]" />
            Established Axioms & Truths
          </span>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--color-accent-primary)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            <PlusIcon className="h-3 w-3" />
            {showAddForm ? "Cancel" : "Add Axiom"}
          </button>
        </div>

        {/* Add Axiom Form */}
        {showAddForm && (
          <form
            onSubmit={handleAddAxiom}
            className="p-3.5 rounded-xl border border-[var(--color-accent-primary)] bg-[var(--color-secondary-background)] flex flex-col gap-2.5 animate-scale-settle shadow-sm"
          >
            <div className="flex flex-col gap-1">
              <label className="type-caption-2 text-[var(--color-label-tertiary)]">
                Statement / Principle
              </label>
              <textarea
                value={newStatement}
                onChange={(e) => setNewStatement(e.target.value)}
                placeholder="e.g. Reverse-mode autodiff calculates output-to-input gradients via the DAG chain rule."
                className="w-full p-2 rounded-lg bg-[var(--color-primary-background)] border border-[var(--color-separator)] text-xs text-[var(--color-label-primary)] focus:outline-none focus:border-[var(--color-accent-primary)] resize-none h-16"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="type-caption-2 text-[var(--color-label-tertiary)]">
                Formula in LaTeX (optional)
              </label>
              <input
                type="text"
                value={newFormula}
                onChange={(e) => setNewFormula(e.target.value)}
                placeholder="e.g. \nabla_W L = \delta^l (a^{l-1})^T"
                className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--color-primary-background)] border border-[var(--color-separator)] text-xs font-mono text-[var(--color-label-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="px-2 py-1 rounded bg-[var(--color-primary-background)] border border-[var(--color-separator)] text-[11px] text-[var(--color-label-secondary)] focus:outline-none"
              >
                <option value="Core Principle">Core Principle</option>
                <option value="Mathematical Theorem">Mathematical Theorem</option>
                <option value="Mechanistic Definition">Mechanistic Definition</option>
                <option value="Empirical Rule">Empirical Rule</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting || !newStatement.trim()}
                className="px-3 py-1 rounded-lg bg-[var(--color-accent-primary)] text-white text-xs font-medium hover:bg-[var(--color-accent-hover)] transition disabled:opacity-50"
              >
                {isSubmitting ? "Saving…" : "Save Axiom"}
              </button>
            </div>
          </form>
        )}

        {/* Axioms List */}
        {axioms.length === 0 ? (
          <div className="p-4 rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] text-center text-xs text-[var(--color-label-tertiary)] italic">
            No axioms cataloged yet. As you discuss with Whyit, key proofs and principles will appear here.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {axioms.map((axiom) => (
              <div
                key={axiom.id}
                className="p-3.5 rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] flex flex-col gap-2 shadow-sm group relative transition hover:border-[var(--color-separator)]/80"
              >
                {/* Top Row: Category & Status */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wide text-[var(--color-label-tertiary)]">
                    <TagIcon className="h-2.5 w-2.5 text-[var(--color-accent-primary)]" />
                    {axiom.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Status Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleCycleStatus(axiom)}
                      title="Click to advance mastery status"
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider transition cursor-pointer ${
                        axiom.status === "MASTERED"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : axiom.status === "IN_PROGRESS"
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                            : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                      }`}
                    >
                      {axiom.status === "MASTERED" ? (
                        <CheckCircle2Icon className="h-2.5 w-2.5" />
                      ) : (
                        <ClockIcon className="h-2.5 w-2.5" />
                      )}
                      <span>{axiom.status.replace("_", " ")}</span>
                    </button>

                    {/* Pin button */}
                    <button
                      type="button"
                      onClick={() => handleTogglePin(axiom)}
                      className={`p-1 rounded hover:bg-[var(--color-primary-background)] transition ${
                        axiom.pinned
                          ? "text-amber-400"
                          : "text-[var(--color-label-tertiary)] opacity-0 group-hover:opacity-100"
                      }`}
                      title={axiom.pinned ? "Unpin axiom" : "Pin axiom to top"}
                    >
                      <PinIcon className="h-3 w-3" />
                    </button>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleDelete(axiom.id)}
                      className="p-1 rounded text-[var(--color-label-tertiary)] hover:text-rose-400 hover:bg-[var(--color-primary-background)] transition opacity-0 group-hover:opacity-100"
                      title="Delete axiom"
                    >
                      <Trash2Icon className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Statement */}
                <p className="type-body text-xs text-[var(--color-label-primary)] leading-relaxed">
                  {axiom.statement}
                </p>

                {/* Render Formula via KaTeX if present */}
                {axiom.formula && (
                  <div
                    className="overflow-x-auto select-all"
                    dangerouslySetInnerHTML={{
                      __html: renderMarkdown(`$$${axiom.formula}$$`),
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
