"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
  RefreshCwIcon,
  LinkIcon,
  VideoIcon,
  BookOpenIcon,
  FileCodeIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  UploadIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface KnowledgeSourceUI {
  id: string;
  projectId: string;
  title: string;
  type: string;
  status: "QUEUED" | "EXTRACTING" | "NORMALIZING" | "CHUNKING" | "COMPLETED" | "FAILED";
  sourceUrl?: string | null;
  wordCount: number;
  tokenEstimate: number;
  createdAt: string;
  _count?: {
    chunks: number;
  };
}

interface ResourcesManagerProps {
  projectId: string;
}

export function ResourcesManager({ projectId }: ResourcesManagerProps) {
  const [resources, setResources] = useState<KnowledgeSourceUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Upload Form State
  const [resourceType, setResourceType] = useState<"FILE" | "URL" | "YOUTUBE" | "BOOK">("FILE");
  const [titleInput, setTitleInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [contentText, setContentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/resources?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to load resources");
      const data = await res.json();
      setResources(data.resources || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching resources");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleInput.trim()) return;

    setIsSubmitting(true);
    try {
      if (resourceType === "FILE" && selectedFile) {
        const formData = new FormData();
        formData.append("projectId", projectId);
        formData.append("title", titleInput.trim());

        let mappedType = "TEXT";
        if (selectedFile.name.endsWith(".pdf")) mappedType = "PDF";
        if (selectedFile.name.endsWith(".md")) mappedType = "MARKDOWN";

        formData.append("type", mappedType);
        formData.append("file", selectedFile);

        const res = await fetch("/api/resources", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Upload failed");
        }
      } else {
        let finalType = "URL";
        if (resourceType === "YOUTUBE") finalType = "YOUTUBE";
        if (resourceType === "BOOK") finalType = "BOOK";
        if (resourceType === "FILE" && !selectedFile) finalType = "TEXT";

        const payload = {
          projectId,
          title: titleInput.trim(),
          type: finalType,
          sourceUrl: urlInput.trim() || undefined,
          content: contentText.trim() || undefined,
        };

        const res = await fetch("/api/resources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || "Resource ingestion failed");
        }
      }

      // Reset form & reload
      setTitleInput("");
      setUrlInput("");
      setContentText("");
      setSelectedFile(null);
      setIsModalOpen(false);
      await fetchResources();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this knowledge resource?")) return;
    try {
      setResources((prev) => prev.filter((r) => r.id !== id));
      const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
      fetchResources();
    }
  };

  const handleReprocess = async (id: string) => {
    try {
      setReprocessingId(id);
      const res = await fetch(`/api/resources/${id}/reprocess`, { method: "POST" });
      if (!res.ok) throw new Error("Reprocess failed");
      await fetchResources();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reprocess failed");
    } finally {
      setReprocessingId(null);
    }
  };

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case "PDF":
        return <FileTextIcon className="h-3.5 w-3.5 text-red-500" />;
      case "MARKDOWN":
        return <FileCodeIcon className="h-3.5 w-3.5 text-blue-500" />;
      case "URL":
      case "DOCUMENTATION_SITE":
        return <LinkIcon className="h-3.5 w-3.5 text-emerald-500" />;
      case "YOUTUBE":
        return <VideoIcon className="h-3.5 w-3.5 text-rose-600" />;
      case "BOOK":
        return <BookOpenIcon className="h-3.5 w-3.5 text-amber-500" />;
      default:
        return <FileTextIcon className="h-3.5 w-3.5 text-slate-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
            <CheckCircle2Icon className="h-3 w-3" /> Ready
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
            <AlertCircleIcon className="h-3 w-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/50">
            <Loader2Icon className="h-3 w-3 animate-spin" /> Processing
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full px-[var(--space-4)] py-[var(--space-4)]">
      {/* Header with Add Resource button */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="type-subheadline font-semibold text-[var(--color-label-primary)]">
            Knowledge Sources
          </h3>
          <p className="type-footnote text-[var(--color-label-tertiary)]">
            {resources.length} {resources.length === 1 ? "source" : "sources"} ingested
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1 rounded-full text-[12px] h-8 px-3"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add Source
        </Button>
      </div>

      {/* Resource List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--color-label-tertiary)]">
          <Loader2Icon className="h-6 w-6 animate-spin mb-2" />
          <p className="type-caption-1">Loading Knowledge Engine…</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-600 text-xs">
          {error}
        </div>
      ) : resources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed rounded-xl border-[var(--color-separator)] p-6">
          <div className="h-10 w-10 rounded-full bg-[var(--color-secondary-background)] flex items-center justify-center mb-3">
            <BookOpenIcon className="h-5 w-5 text-[var(--color-label-tertiary)]" />
          </div>
          <p className="type-subheadline font-medium text-[var(--color-label-primary)] mb-1">
            No Knowledge Sources Yet
          </p>
          <p className="type-footnote text-[var(--color-label-tertiary)] mb-4 max-w-xs">
            Transform PDFs, Web Articles, YouTube videos, and notes into structured knowledge sources.
          </p>
          <Button size="sm" variant="primary" onClick={() => setIsModalOpen(true)}>
            Add First Resource
          </Button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {resources.map((res) => (
            <div
              key={res.id}
              className="p-3.5 rounded-xl border border-[var(--color-separator)] bg-[var(--color-secondary-background)] hover:border-[var(--color-accent-primary)]/40 transition-all group relative"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {getBadgeIcon(res.type)}
                  <h4 className="type-footnote font-semibold text-[var(--color-label-primary)] truncate">
                    {res.title}
                  </h4>
                </div>
                {getStatusBadge(res.status)}
              </div>

              {/* Metadata details */}
              <div className="flex items-center justify-between text-[11px] text-[var(--color-label-tertiary)] mt-2 pt-2 border-t border-[var(--color-separator)]/60">
                <div className="flex items-center gap-3">
                  <span>{res.wordCount} words</span>
                  <span>•</span>
                  <span>{res._count?.chunks ?? 0} chunks</span>
                </div>
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {res.status === "FAILED" && (
                    <button
                      onClick={() => handleReprocess(res.id)}
                      disabled={reprocessingId === res.id}
                      className="p-1 hover:text-amber-500 rounded transition"
                      title="Reprocess Resource"
                    >
                      <RefreshCwIcon className={`h-3.5 w-3.5 ${reprocessingId === res.id ? "animate-spin" : ""}`} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(res.id)}
                    className="p-1 hover:text-rose-500 rounded transition"
                    title="Delete Resource"
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-[var(--color-primary-background)] border border-[var(--color-separator)] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--color-separator)] pb-3">
              <h3 className="type-title-3 font-semibold text-[var(--color-label-primary)]">
                Add Knowledge Source
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[var(--color-label-tertiary)] hover:text-[var(--color-label-primary)]"
              >
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Type selector tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 bg-[var(--color-secondary-background)] rounded-lg text-[12px] font-medium">
              <button
                type="button"
                onClick={() => setResourceType("FILE")}
                className={`py-1.5 rounded-md transition ${resourceType === "FILE" ? "bg-[var(--color-primary-background)] text-[var(--color-label-primary)] shadow-sm" : "text-[var(--color-label-tertiary)]"}`}
              >
                Document
              </button>
              <button
                type="button"
                onClick={() => setResourceType("URL")}
                className={`py-1.5 rounded-md transition ${resourceType === "URL" ? "bg-[var(--color-primary-background)] text-[var(--color-label-primary)] shadow-sm" : "text-[var(--color-label-tertiary)]"}`}
              >
                Web URL
              </button>
              <button
                type="button"
                onClick={() => setResourceType("YOUTUBE")}
                className={`py-1.5 rounded-md transition ${resourceType === "YOUTUBE" ? "bg-[var(--color-primary-background)] text-[var(--color-label-primary)] shadow-sm" : "text-[var(--color-label-tertiary)]"}`}
              >
                YouTube
              </button>
              <button
                type="button"
                onClick={() => setResourceType("BOOK")}
                className={`py-1.5 rounded-md transition ${resourceType === "BOOK" ? "bg-[var(--color-primary-background)] text-[var(--color-label-primary)] shadow-sm" : "text-[var(--color-label-tertiary)]"}`}
              >
                Book
              </button>
            </div>

            <form onSubmit={handleCreateResource} className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--color-label-secondary)] mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deep Learning Chapter 1"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-separator)] bg-[var(--color-secondary-background)] text-[var(--color-label-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                />
              </div>

              {resourceType === "FILE" && (
                <div>
                  <label className="block text-[12px] font-medium text-[var(--color-label-secondary)] mb-1">
                    Upload File (PDF, MD, TXT)
                  </label>
                  <div className="border-2 border-dashed border-[var(--color-separator)] rounded-xl p-4 text-center hover:border-[var(--color-accent-primary)] transition relative cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.md,.txt"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                          if (!titleInput) setTitleInput(e.target.files[0].name.replace(/\.[^/.]+$/, ""));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadIcon className="h-6 w-6 text-[var(--color-label-tertiary)] mx-auto mb-1" />
                    <p className="text-xs font-medium text-[var(--color-label-primary)]">
                      {selectedFile ? selectedFile.name : "Click or drag PDF, MD, or TXT file"}
                    </p>
                    <p className="text-[10px] text-[var(--color-label-tertiary)] mt-0.5">
                      Max 25MB • Extracted into knowledge chunks
                    </p>
                  </div>
                </div>
              )}

              {(resourceType === "URL" || resourceType === "YOUTUBE") && (
                <div>
                  <label className="block text-[12px] font-medium text-[var(--color-label-secondary)] mb-1">
                    {resourceType === "YOUTUBE" ? "YouTube Video URL" : "Web Article / Page URL"}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={resourceType === "YOUTUBE" ? "https://www.youtube.com/watch?v=..." : "https://example.com/article"}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-separator)] bg-[var(--color-secondary-background)] text-[var(--color-label-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  />
                </div>
              )}

              {(resourceType === "BOOK" || (resourceType === "FILE" && !selectedFile)) && (
                <div>
                  <label className="block text-[12px] font-medium text-[var(--color-label-secondary)] mb-1">
                    Notes / Raw Text Content
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter book summary or text notes to ingest…"
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-[var(--color-separator)] bg-[var(--color-secondary-background)] text-[var(--color-label-primary)] focus:outline-none focus:border-[var(--color-accent-primary)]"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2Icon className="h-3.5 w-3.5 animate-spin" /> Ingesting…
                    </span>
                  ) : (
                    "Ingest Resource"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
