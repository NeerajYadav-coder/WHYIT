"use client";
/**
 * CuriosityPopup
 *
 * A first-class floating workspace for a single curiosity branch.
 * Behaves like a miniature chat interface — independent from the main conversation.
 *
 * Features:
 *   - Draggable (via header drag handle)
 *   - Resizable (CSS resize)
 *   - Remembers last position & size (sessionStorage)
 *   - Can be pinned (stays open while reading), minimised, or closed
 *   - Own streaming mock — replace with real AI call
 *   - Keyboard: Esc closes
 *   - Context injection: selectedText + surroundingContext + sectionHeading
 *
 * Principle: Curiosity is a first-class object, NOT a modal over an existing chat.
 */

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  useId,
} from "react";
import {
  XIcon,
  MinusIcon,
  PinIcon,
  PinOffIcon,
  ArrowUpIcon,
  SparklesIcon,
  ChevronRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { cn, generateId } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import type { SideConversation, SideMessage } from "@/lib/types";

async function streamCuriosity(opts: {
  selectedText: string;
  surroundingContext?: string;
  sectionHeading?: string;
  projectId?: string;
  conversationId?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  signal: AbortSignal;
  onChunk: (chunk: string) => void;
}): Promise<void> {
  const { selectedText, surroundingContext, sectionHeading, projectId, conversationId, messages, signal, onChunk } = opts;
  const res = await fetch("/api/curiosity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ selectedText, surroundingContext, sectionHeading, projectId, conversationId, messages }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      onChunk(chunk);
    }
  } finally {
    reader.releaseLock();
  }
}

// ── Position / size persistence ───────────────────────────────
const POS_KEY = "whyit_curiosity_popup_pos";
const SIZE_KEY = "whyit_curiosity_popup_size";

function loadPos(): { x: number; y: number } | null {
  try {
    const raw = sessionStorage.getItem(POS_KEY);
    return raw ? (JSON.parse(raw) as { x: number; y: number }) : null;
  } catch { return null; }
}
function savePos(pos: { x: number; y: number }) {
  try { sessionStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* noop */ }
}
function loadSize(): { w: number; h: number } | null {
  try {
    const raw = sessionStorage.getItem(SIZE_KEY);
    return raw ? (JSON.parse(raw) as { w: number; h: number }) : null;
  } catch { return null; }
}
function saveSize(size: { w: number; h: number }) {
  try { sessionStorage.setItem(SIZE_KEY, JSON.stringify(size)); } catch { /* noop */ }
}

interface CuriosityPopupProps {
  conversation: SideConversation;
  conversationId?: string;
  onClose: () => void;
  onPin: () => void;
  onMessagesUpdate: (messages: SideMessage[]) => void;
}

function CuriosityPopup({
  conversation,
  conversationId,
  onClose,
  onPin,
  onMessagesUpdate,
}: CuriosityPopupProps) {
  const titleId = useId();
  const popupRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const dragState = useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const [messages, setMessages] = useState<SideMessage[]>(conversation.messages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Position & size
  const defaultPos = {
    x: Math.max(0, window.innerWidth - 460 - 40),
    y: 80,
  };
  const saved = loadPos();
  const [pos, setPos] = useState(saved ?? defaultPos);
  const savedSize = loadSize();
  const [size] = useState(savedSize ?? { w: 440, h: 560 });

  // Auto-inject initial context message from AI if no messages yet
  useEffect(() => {
    if (messages.length === 0) {
      const contextMsg: SideMessage = {
        id: generateId(),
        role: "assistant",
        content: `I can see you're curious about **"${conversation.selectedText}"**${conversation.sectionHeading ? ` from the section on *${conversation.sectionHeading}*` : ""}.\n\nWhat would you like to explore?`,
        createdAt: new Date().toISOString(),
      };
      const updated = [contextMsg];
      setMessages(updated);
      onMessagesUpdate(updated);
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync messages to parent on change
  useEffect(() => {
    onMessagesUpdate(messages);
  }, [messages, onMessagesUpdate]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Esc to close
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Drag logic ────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragState.current.dragging) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      const newPos = {
        x: Math.max(0, Math.min(window.innerWidth - size.w, dragState.current.origX + dx)),
        y: Math.max(0, Math.min(window.innerHeight - 100, dragState.current.origY + dy)),
      };
      setPos(newPos);
    }
    function onMouseUp() {
      if (dragState.current.dragging) {
        dragState.current.dragging = false;
        setPos((p) => { savePos(p); return p; });
      }
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [size.w]);

  // Track resize via ResizeObserver
  useEffect(() => {
    if (!popupRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        saveSize({ w: Math.round(width), h: Math.round(height) });
      }
    });
    ro.observe(popupRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Send message ──────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || isThinking) return;
    setInput("");

    const userMsg: SideMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    
    // We need to capture the updated message list for the API payload
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);

    setIsThinking(true);
    await new Promise<void>((res) => setTimeout(res, 200));
    setIsThinking(false);

    const assistantId = generateId();
    const placeholder: SideMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, placeholder]);
    setIsStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Convert messages to shape expected by the API
    // Skip the first assistant-side welcome/context message to keep payload cleaner, or include it
    const apiMessages = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      await streamCuriosity({
        selectedText: conversation.selectedText,
        surroundingContext: conversation.surroundingContext || undefined,
        sectionHeading: conversation.sectionHeading || undefined,
        projectId: conversation.parentChatId,
        conversationId,
        messages: apiMessages,
        signal: controller.signal,
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m
            )
          );
        },
      });
    } catch (err) {
      if (!controller.signal.aborted) {
        console.error("Curiosity stream failed:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + "\n\n*Error: Failed to stream response.*" }
              : m
          )
        );
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, isStreaming: false } : m
        )
      );
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, isThinking, messages, conversation]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  if (minimized) {
    return (
      <div
        className="curiosity-popup-minimized"
        style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 2000 }}
        onClick={() => setMinimized(false)}
        role="button"
        tabIndex={0}
        aria-label={`Reopen curiosity: ${conversation.title}`}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setMinimized(false); }}
      >
        <SparklesIcon className="h-4 w-4" />
        <span className="type-caption-1 font-medium truncate max-w-[160px]">
          {conversation.title}
        </span>
      </div>
    );
  }

  return (
    <div
      ref={popupRef}
      id="curiosity-popup"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      className="curiosity-popup"
      style={{
        position: "fixed",
        top: `${pos.y}px`,
        left: `${pos.x}px`,
        width: `${size.w}px`,
        height: `${size.h}px`,
        zIndex: 2000,
        resize: "both",
        overflow: "hidden",
        minWidth: "320px",
        minHeight: "400px",
        maxWidth: "700px",
        maxHeight: "90vh",
      }}
    >
      {/* ── Header (drag handle) ──────────────────────────────── */}
      <div
        className="curiosity-popup-header"
        onMouseDown={onDragStart}
        style={{ cursor: "grab" }}
      >
        <div className="flex items-center gap-[var(--space-2)] min-w-0">
          <div className="curiosity-icon-dot" aria-hidden="true" />
          <div className="min-w-0">
            <p id={titleId} className="type-caption-1 font-semibold truncate" style={{ color: "var(--color-label-primary)" }}>
              Curiosity
            </p>
            {conversation.projectName && (
              <p className="type-caption-2 truncate" style={{ color: "var(--color-label-tertiary)" }}>
                {conversation.projectName}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-[var(--space-1)]" style={{ cursor: "default" }}>
          <Button
            id="curiosity-pin"
            variant="ghost"
            size="icon-sm"
            onClick={onPin}
            aria-label={conversation.pinned ? "Unpin curiosity" : "Pin curiosity"}
            title={conversation.pinned ? "Unpin" : "Pin open"}
            className="!min-h-0 !min-w-0 h-7 w-7"
          >
            {conversation.pinned
              ? <PinIcon className="h-3.5 w-3.5" />
              : <PinOffIcon className="h-3.5 w-3.5" />}
          </Button>
          <Button
            id="curiosity-minimize"
            variant="ghost"
            size="icon-sm"
            onClick={() => setMinimized(true)}
            aria-label="Minimize curiosity"
            title="Minimize"
            className="!min-h-0 !min-w-0 h-7 w-7"
          >
            <MinusIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            id="curiosity-close"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close curiosity"
            title="Close (Esc)"
            className="!min-h-0 !min-w-0 h-7 w-7 hover:text-[var(--color-system-red)]"
          >
            <XIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Context pill — provenance ─────────────────────────── */}
      <div className="curiosity-context-pill">
        <ChevronRightIcon className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
        <span className="truncate">
          {conversation.sectionHeading
            ? `${conversation.sectionHeading}`
            : conversation.projectName ?? "Main conversation"}
        </span>
        <span style={{ color: "var(--color-separator)", margin: "0 4px" }}>·</span>
        <span
          className="font-medium"
          style={{ color: "var(--color-label-primary)" }}
        >
          &ldquo;{conversation.title}&rdquo;
        </span>
      </div>

      {/* ── Message list ─────────────────────────────────────── */}
      <div className="curiosity-messages">
        {messages.map((msg) => (
          <CuriosityMessageBubble key={msg.id} message={msg} />
        ))}

        {isThinking && (
          <div className="flex items-start gap-[var(--space-2)] animate-fade-up">
            <div className="curiosity-icon-dot mt-1" aria-hidden="true" />
            <div role="status" aria-live="polite">
              <span className="sr-only">Thinking…</span>
              <div className="h-[5px] w-[5px] rounded-full bg-[var(--color-accent-primary)] animate-thinking" aria-hidden="true" />
            </div>
          </div>
        )}
        <div ref={bottomRef} aria-hidden="true" />
      </div>

      {/* ── Input ─────────────────────────────────────────────── */}
      <div className="curiosity-input-area">
        <div
          className="flex items-end gap-[var(--space-2)] rounded-[var(--radius-md)] border px-[var(--space-3)] py-[var(--space-2)]"
          style={{
            background: "var(--color-secondary-background)",
            borderColor: "var(--color-separator)",
            transition: `border-color var(--duration-short) var(--ease-standard)`,
          }}
          onFocus={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-accent-primary)"; }}
          onBlur={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--color-separator)"; }}
        >
          <Textarea
            id="curiosity-input"
            autoResize
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this…"
            rows={1}
            className="flex-1 max-h-[100px] overflow-y-auto type-footnote"
            aria-label="Curiosity question"
            disabled={isStreaming || isThinking}
            style={{ fontSize: "var(--type-footnote-size)" }}
          />
          <Button
            id="curiosity-send"
            variant="primary"
            size="icon"
            onClick={() => void handleSend()}
            disabled={!input.trim() || isStreaming || isThinking}
            aria-label="Send"
            className="flex-shrink-0 !h-[36px] !w-[36px] !min-h-0 !min-w-0 rounded-[var(--radius-sm)]"
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-center type-caption-2 mt-[var(--space-1)]" style={{ color: "var(--color-label-tertiary)" }}>
          Esc to close · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ── Tiny message renderer for the popup ──────────────────────
function CuriosityMessageBubble({ message }: { message: SideMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex w-full animate-fade-up",
        isUser ? "justify-end" : "justify-start",
        "gap-[var(--space-2)]"
      )}
    >
      {!isUser && (
        <div className="curiosity-icon-dot mt-[3px] flex-shrink-0" aria-hidden="true" />
      )}
      <div
        className={cn(
          isUser
            ? [
                "max-w-[80%] px-[var(--space-3)] py-[var(--space-2)]",
                "rounded-[var(--radius-md)] rounded-br-[var(--radius-sm)]",
                "bg-[var(--color-tertiary-background)]",
              ]
            : ["max-w-[90%]"],
          "type-footnote"
        )}
        style={{ color: "var(--color-label-primary)" }}
      >
        <div
          className={cn(message.isStreaming && "streaming-cursor")}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
        />
      </div>
    </div>
  );
}

export { CuriosityPopup };
export type { CuriosityPopupProps };
