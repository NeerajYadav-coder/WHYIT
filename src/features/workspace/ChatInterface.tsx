"use client";
// Client boundary: message state, real AI streaming, auto-scroll, keyboard input.
// Principles served:
//   Clarity   — 17pt body, capped reading column, nothing competes with text
//   Deference — input stays fixed at bottom, never covers content
//   Depth     — thinking state shows AI "processing", streaming shows generation live
//
// Curiosity Mode:
//   SelectionBubble: floats above text selection → "Explore" button → CuriosityPopup
//   CuriosityPopup: independent draggable floating workspace; never modifies main chat

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUpIcon, XCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { MessageBubble } from "@/components/ui/MessageBubble";
import { SelectionBubble } from "@/features/curiosity/SelectionBubble";
import { CuriosityPopup } from "@/features/curiosity/CuriosityPopup";
import { generateId } from "@/lib/utils";
import {
  createCuriosity,
  loadCuriosities,
  saveCuriosities,
} from "@/lib/curiosity-store";
import type { Message, SideConversation, SideMessage } from "@/lib/types";
import type { SelectionInfo } from "@/features/curiosity/SelectionBubble";

interface ChatInterfaceProps {
  initialMessages?: Message[];
  projectName?: string;
  projectId?: string;
  /** The real conversation ID from the DB */
  conversationId?: string;
  /** Called whenever a curiosity branch is created or updated */
  onCuriosityChanged?: (conversations: SideConversation[]) => void;
}

// ── Stream error sentinel (matches server) ───────────────────────
const STREAM_ERROR_SENTINEL = "\n\n[STREAM_ERROR]";

async function streamChatMessage(opts: {
  message: string;
  conversationId: string;
  projectId: string;
  curiosities?: SideConversation[];
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
}): Promise<{ success: boolean; fullContent: string; usesMemory?: boolean }> {
  const { message, conversationId, projectId, curiosities, signal, onChunk } = opts;

  // Format curiosities to pass only title, selectedText, and messages to backend
  const formattedCuriosities = curiosities?.map((c) => ({
    title: c.title,
    selectedText: c.selectedText,
    messages: c.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  }));

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, conversationId, projectId, curiosities: formattedCuriosities }),
    signal,
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullContent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk.includes(STREAM_ERROR_SENTINEL)) {
        throw new Error("Stream error from server");
      }
      fullContent += chunk;
      onChunk(chunk);
    }
    const usesMemory = res.headers.get("X-Whyit-Uses-Memory") === "1";
    return { success: true, fullContent, usesMemory };
  } finally {
    reader.releaseLock();
  }
}

function ChatInterface({
  initialMessages = [],
  projectName,
  projectId,
  conversationId,
  onCuriosityChanged,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Active curiosity popup
  const [activeCuriosity, setActiveCuriosity] =
    useState<SideConversation | null>(null);

  // Sync initial messages when they change (after DB load)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // ── Curiosity helpers ─────────────────────────────────────────
  const resolvedProjectId = projectId ?? "default";

  const handleExplore = useCallback(
    (sel: SelectionInfo) => {
      const conversations = loadCuriosities(resolvedProjectId);
      const conv = createCuriosity({
        projectId: resolvedProjectId,
        projectName,
        selectedText: sel.text,
        surroundingContext: sel.surroundingContext,
        sectionHeading: sel.sectionHeading,
      });
      const updated = [conv, ...conversations];
      saveCuriosities(resolvedProjectId, updated);
      setActiveCuriosity(conv);
      onCuriosityChanged?.(updated);
    },
    [resolvedProjectId, projectName, onCuriosityChanged]
  );

  // Curiosity messages are updated directly on the conversation object.
  // We do NOT call onCuriosityChanged here to avoid the render loop —
  // the popup owns its own message state and writes to localStorage.
  const handleCuriosityMessagesUpdate = useCallback(
    (msgs: SideMessage[]) => {
      const all = loadCuriosities(resolvedProjectId);
      const updated = all.map((c) =>
        c.id === activeCuriosity?.id
          ? { ...c, messages: msgs, updatedAt: new Date().toISOString() }
          : c
      );
      saveCuriosities(resolvedProjectId, updated);
      // Only update the active conversation's messages ref — no state trigger
      setActiveCuriosity((prev) =>
        prev ? { ...prev, messages: msgs } : null
      );
    },
    // Deliberately exclude activeCuriosity from deps to break the render loop.
    // activeCuriosity.id is captured at creation time and stable within a popup lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resolvedProjectId]
  );

  const handleCuriosityClose = useCallback(() => {
    // Flush final state to sidebar before closing
    const all = loadCuriosities(resolvedProjectId);
    onCuriosityChanged?.(all);
    setActiveCuriosity(null);
  }, [resolvedProjectId, onCuriosityChanged]);

  const handleCuriosityPin = useCallback(() => {
    if (!activeCuriosity) return;
    const all = loadCuriosities(resolvedProjectId);
    const updated = all.map((c) =>
      c.id === activeCuriosity.id ? { ...c, pinned: !c.pinned } : c
    );
    saveCuriosities(resolvedProjectId, updated);
    setActiveCuriosity((prev) =>
      prev ? { ...prev, pinned: !prev.pinned } : null
    );
    onCuriosityChanged?.(updated);
  }, [activeCuriosity, resolvedProjectId, onCuriosityChanged]);

  // ── Abort current stream ─────────────────────────────────────
  const handleAbort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ── Main chat send ─────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || isThinking) return;
    if (!conversationId || !projectId) return; // not yet loaded

    setInput("");
    setStreamError(null);

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    // Thinking state — calm pulse
    setIsThinking(true);
    const controller = new AbortController();
    abortRef.current = controller;

    const assistantId = generateId();

    try {
      // Small delay so thinking state is visible before first token
      await new Promise<void>((res) => setTimeout(res, 200));
      setIsThinking(false);

      const placeholder: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, placeholder]);
      setIsStreaming(true);

      const localCuriosities = loadCuriosities(projectId);

      const streamResult = await streamChatMessage({
        message: trimmed,
        conversationId,
        projectId,
        curiosities: localCuriosities,
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + chunk }
                : m
            )
          );
        },
      });

      if (streamResult?.usesMemory) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, usesMemory: true } : m
          )
        );
      }
    } catch (err) {
      const isAbort =
        err instanceof Error &&
        (err.name === "AbortError" || controller.signal.aborted);

      if (!isAbort) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        setStreamError(message);
        // Remove the empty/partial assistant placeholder on error
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } else {
        // Aborted — remove empty placeholder, keep any partial content
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m
          )
        );
      }
    } finally {
      setIsThinking(false);
      setIsStreaming(false);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
      abortRef.current = null;
    }
  }, [input, isStreaming, isThinking, conversationId, projectId]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  const isEmpty = messages.length === 0 && !isThinking;
  const isReady = !!conversationId && !!projectId;

  const handleEditMessage = useCallback((text: string) => {
    setInput(text);
    const textarea = document.getElementById("chat-input") as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(text.length, text.length);
    }
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ position: "relative" }}>
      {/* ── Message list — scrollable, capped width per §3 ────── */}
      <div
        ref={scrollAreaRef}
        className="flex-1 overflow-y-auto"
        style={{ position: "relative" }}
      >
        {/* SelectionBubble watches inside this container */}
        <SelectionBubble
          onExplore={handleExplore}
          containerRef={scrollAreaRef}
        />

        <div
          className="mx-auto px-[var(--space-6)] py-[var(--space-8)]"
          style={{ maxWidth: "var(--conversation-max-width)" }}
        >
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-[620px] mx-auto space-y-6 animate-fade-up">
              <div
                className="h-12 w-12 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg"
                style={{ background: "var(--color-accent-dim)" }}
                aria-hidden="true"
              >
                <div className="h-3.5 w-3.5 rounded-full bg-[var(--color-accent-primary)] animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--color-accent-hover)]">
                  Learning Studio Ready
                </span>
                {projectName && (
                  <h2 className="text-2xl sm:text-4xl font-medium tracking-tight text-white apple-gradient-text">
                    {projectName}
                  </h2>
                )}
                <p className="text-sm text-white/50 leading-relaxed max-w-[440px] mx-auto">
                  Begin your inquiry from first principles. Select any word during dialogue to launch non-destructive curiosity side-threads.
                </p>
              </div>

              {/* Starter Sparks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4 text-left">
                {[
                  "Deconstruct the foundational axioms of this topic",
                  "What are the most counter-intuitive truths here?",
                  "Walk me through an intuitive first-principles example",
                  "Map the knowledge dependencies I need to understand",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => {
                      setInput(promptText);
                    }}
                    className="p-3.5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20 transition-all text-[13px] text-white/75 hover:text-white apple-sheen-card apple-press-spring"
                  >
                    <span>{promptText} →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-[var(--space-6)]">
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.isStreaming}
                  onEdit={handleEditMessage}
                />
              ))}

              {/* Thinking indicator */}
              {isThinking && (
                <div className="flex items-start gap-[var(--space-3)] animate-fade-up">
                  <div
                    className="mt-[6px] h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center border border-white/10"
                    style={{ background: "var(--color-accent-dim)" }}
                    aria-hidden="true"
                  >
                    <div className="h-2 w-2 rounded-full bg-[var(--color-accent-primary)] animate-thinking" />
                  </div>
                  <div className="type-body text-[var(--color-label-tertiary)] pt-[2px]" role="status" aria-live="polite">
                    <span className="sr-only">Whyit is thinking</span>
                    <div className="h-[5px] w-[5px] rounded-full bg-[var(--color-label-tertiary)] animate-thinking" aria-hidden="true" />
                  </div>
                </div>
              )}

              {/* Stream error */}
              {streamError && (
                <div
                  className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)] animate-fade-up"
                  style={{ background: "rgba(255,69,58,0.08)", border: "1px solid rgba(255,69,58,0.2)" }}
                  role="alert"
                >
                  <XCircleIcon className="h-4 w-4 flex-shrink-0" style={{ color: "var(--color-system-red)" }} />
                  <div className="min-w-0">
                    <p className="type-footnote font-medium" style={{ color: "var(--color-system-red)" }}>
                      Response failed
                    </p>
                    <p className="type-caption-1" style={{ color: "var(--color-label-tertiary)" }}>
                      {streamError}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => { setStreamError(null); void handleSend(); }}
                    aria-label="Retry"
                    className="!min-h-0 !min-w-0 h-8 w-8 ml-auto flex-shrink-0"
                    title="Retry"
                  >
                    ↺
                  </Button>
                </div>
              )}

              <div ref={bottomRef} aria-hidden="true" />
            </div>
          )}
        </div>
      </div>

      {/* ── Apple Floating Studio Dock ─────────────────────────── */}
      <div
        className="flex-shrink-0 px-4 sm:px-6 pb-6 pt-2 bg-gradient-to-t from-[var(--color-system-background)] via-[var(--color-system-background)]/80 to-transparent"
      >
        <div
          className="mx-auto w-full"
          style={{ maxWidth: "var(--conversation-max-width)" }}
        >
          <div
            className="apple-spotlight-dock rounded-2xl sm:rounded-3xl p-2.5 sm:p-3.5 border border-white/15 transition-all shadow-[0_20px_50px_-10px_rgba(0,0,0,0.75)]"
          >
            <div className="flex items-end gap-3">
              <Textarea
                id="chat-input"
                autoResize
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isReady
                    ? "Inquire deeply, ask why, or challenge an axiom…"
                    : "Loading workspace…"
                }
                rows={1}
                className="flex-1 max-h-[180px] overflow-y-auto bg-transparent border-0 text-white placeholder:text-white/35 text-[14px] sm:text-[15px] leading-relaxed outline-none resize-none px-2 py-1 font-sans"
                aria-label="Chat message"
                disabled={isStreaming || isThinking || !isReady}
              />

              {isStreaming ? (
                <button
                  type="button"
                  id="chat-abort"
                  onClick={handleAbort}
                  aria-label="Stop generating"
                  className="h-10 w-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
                  title="Stop generating"
                >
                  <span className="h-3.5 w-3.5 rounded-sm bg-white" />
                </button>
              ) : (
                <button
                  type="button"
                  id="chat-send"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || isThinking || !isReady}
                  aria-label="Send message"
                  className="h-10 w-10 rounded-xl sm:rounded-2xl bg-white text-black hover:bg-white/90 disabled:opacity-25 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0 transition-all shadow-md active:scale-95"
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/[0.08] text-[11px] font-mono text-white/40 px-1">
              <span>
                {isStreaming
                  ? "Generating response…"
                  : "↵ Enter to send · Shift+Enter for newline"}
              </span>
              <span className="hidden sm:inline">
                Highlight text for Curiosity Mode
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Curiosity Popup ─────────────────────────────────────── */}
      {activeCuriosity && (
        <CuriosityPopup
          conversation={activeCuriosity}
          conversationId={conversationId}
          onClose={handleCuriosityClose}
          onPin={handleCuriosityPin}
          onMessagesUpdate={handleCuriosityMessagesUpdate}
        />
      )}
    </div>
  );
}

export { ChatInterface };
export type { ChatInterfaceProps };
