"use client";
// Client boundary: fetches project + conversation from the real API.
// Replaces sessionStorage-based project resolution.

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ChatInterface } from "@/features/workspace/ChatInterface";
import { loadCuriosities } from "@/lib/curiosity-store";
import type { SideConversation } from "@/lib/types";

// Shape returned by GET /api/projects/[id]
interface ProjectDetail {
  id: string;
  name: string;
  goal: string;
  motivation: string;
  context?: string;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  messages: {
    id: string;
    role: "USER" | "ASSISTANT";
    content: string;
    createdAt: string;
  }[];
}

interface FetchedData {
  project: ProjectDetail;
  conversation: ConversationDetail;
}

/**
 * Workspace page — /workspace/[projectId]
 *
 * Fetches project + conversation from the API on mount.
 * Passes real conversationId to ChatInterface for streaming.
 */
function WorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [data, setData] = useState<FetchedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [curiosities, setCuriosities] = useState<SideConversation[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) {
          const json = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(json.error ?? `HTTP ${res.status}`);
        }
        const json = await res.json() as FetchedData;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    }

    void load();
    setCuriosities(loadCuriosities(projectId));
    return () => { cancelled = true; };
  }, [projectId]);

  const handleCuriosityChanged = useCallback(
    (updated: SideConversation[]) => {
      setCuriosities(updated);
      window.dispatchEvent(
        new CustomEvent("whyit:curiosities", {
          detail: { projectId, conversations: updated },
        })
      );
    },
    [projectId]
  );

  // Silence unused variable — dispatched via CustomEvent to RightSidebar
  void curiosities;

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-[var(--space-4)]">
        <p className="type-callout text-[var(--color-system-red)]">
          {error}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="type-footnote text-[var(--color-accent-primary)] underline underline-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="type-callout text-[var(--color-label-tertiary)]">
          Loading workspace…
        </p>
      </div>
    );
  }

  // Convert DB messages (role: USER/ASSISTANT) → client Message type (role: user/assistant)
  const initialMessages = data.conversation.messages.map((m) => ({
    id: m.id,
    role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: m.content,
    createdAt: m.createdAt,
  }));

  return (
    <ChatInterface
      projectName={data.project.name}
      projectId={data.project.id}
      conversationId={data.conversation.id}
      initialMessages={initialMessages}
      onCuriosityChanged={handleCuriosityChanged}
    />
  );
}

export default WorkspacePage;
