/**
 * curiosity-store.ts
 *
 * Lightweight persistence for SideConversation (curiosity branch) objects.
 * Storage: localStorage, scoped per project.
 *
 * When real persistence is added:
 *  1. Replace loadCuriosities / saveCuriosities with async fetch/post calls
 *  2. No component code needs to change — only this file
 */

import type { SideConversation, SideMessage } from "@/lib/types";
import { generateId } from "@/lib/utils";

const KEY_PREFIX = "whyit_curiosities_";

function storageKey(projectId: string): string {
  return `${KEY_PREFIX}${projectId}`;
}

export function loadCuriosities(projectId: string): SideConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(projectId));
    return raw ? (JSON.parse(raw) as SideConversation[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves curiosities locally and asynchronously syncs to PostgreSQL
 */
export function saveCuriosities(
  projectId: string,
  conversations: SideConversation[]
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey(projectId), JSON.stringify(conversations));
  } catch {
    /* Silently fail — storage quota exceeded */
  }

  // Background async sync to PostgreSQL
  if (projectId && projectId !== "default") {
    for (const conv of conversations) {
      fetch("/api/curiosities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: conv.id,
          projectId,
          title: conv.title,
          selectedText: conv.selectedText,
          surroundingContext: conv.surroundingContext,
          sectionHeading: conv.sectionHeading,
          projectName: conv.projectName,
          pinned: conv.pinned,
          archived: conv.archived,
          parentMessageId: conv.parentMessageId,
          messages: conv.messages,
        }),
      }).catch((err) => {
        console.warn("[curiosity-store] Background sync failed:", err);
      });
    }
  }
}

/**
 * Fetch persistent curiosities from database and reconcile with local cache
 */
export async function syncCuriositiesFromServer(
  projectId: string
): Promise<SideConversation[]> {
  if (typeof window === "undefined" || !projectId || projectId === "default") {
    return loadCuriosities(projectId);
  }

  try {
    const res = await fetch(`/api/curiosities?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) return loadCuriosities(projectId);

    const data = await res.json();
    if (data.curiosities && Array.isArray(data.curiosities)) {
      const serverList: SideConversation[] = data.curiosities;
      const localList = loadCuriosities(projectId);

      // Merge maps by ID (preferring most recently updated)
      const mergedMap = new Map<string, SideConversation>();
      for (const item of localList) {
        mergedMap.set(item.id, item);
      }
      for (const serverItem of serverList) {
        const existing = mergedMap.get(serverItem.id);
        if (!existing || new Date(serverItem.updatedAt) >= new Date(existing.updatedAt)) {
          mergedMap.set(serverItem.id, serverItem);
        }
      }

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      localStorage.setItem(storageKey(projectId), JSON.stringify(mergedList));
      return mergedList;
    }
  } catch (err) {
    console.warn("[curiosity-store] Server sync error:", err);
  }

  return loadCuriosities(projectId);
}

export function createCuriosity(opts: {
  projectId: string;
  projectName?: string;
  selectedText: string;
  surroundingContext?: string;
  sectionHeading?: string;
  parentMessageId?: string;
}): SideConversation {
  const now = new Date().toISOString();
  const title =
    opts.selectedText.length > 60
      ? opts.selectedText.slice(0, 57) + "…"
      : opts.selectedText;

  return {
    id: generateId(),
    parentChatId: opts.projectId,
    parentMessageId: opts.parentMessageId,
    selectedText: opts.selectedText,
    surroundingContext: opts.surroundingContext,
    sectionHeading: opts.sectionHeading,
    projectName: opts.projectName,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
    pinned: false,
    archived: false,
  };
}

export function appendMessage(
  conv: SideConversation,
  msg: Omit<SideMessage, "id" | "createdAt">
): SideConversation {
  const message: SideMessage = {
    ...msg,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  return {
    ...conv,
    updatedAt: new Date().toISOString(),
    messages: [...conv.messages, message],
  };
}

export function updateMessage(
  conv: SideConversation,
  msgId: string,
  patch: Partial<SideMessage>
): SideConversation {
  return {
    ...conv,
    updatedAt: new Date().toISOString(),
    messages: conv.messages.map((m) =>
      m.id === msgId ? { ...m, ...patch } : m
    ),
  };
}
