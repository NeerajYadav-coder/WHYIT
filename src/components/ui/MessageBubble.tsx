/**
 * MessageBubble — the core visual unit of conversation.
 *
 * Principles served:
 * - Clarity: 17pt body (floor), correct line height, weight hierarchy
 * - Deference: assistant messages have no bubble background — text IS the surface
 * - Depth: Reading Mode (serif, capped column) for long AI responses (>150 words)
 * - Interactivity: Hover actions for Copy and Edit (populated back into user prompt)
 */

import { useState } from "react";
import { CopyIcon, CheckIcon, PencilIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  /** When true, shows memory attribution indicator */
  usesMemory?: boolean;
  className?: string;
  /** Callback when user clicks Edit on a user message */
  onEdit?: (text: string) => void;
}

/** Count words to determine whether to trigger Reading Mode */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

import { renderMarkdown } from "@/lib/markdown";

function MessageBubble({
  role,
  content,
  isStreaming = false,
  usesMemory = false,
  className,
  onEdit,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const wordCount = countWords(content);
  /* Reading Mode: assistant only, >150 words, not while actively streaming */
  const isReadingMode = !isUser && !isStreaming && wordCount > 150;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={cn(
        "flex w-full animate-fade-up group relative",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {/* Assistant avatar dot — deference: small, never dominates */}
      {!isUser && (
        <div
          className="mt-[6px] mr-[var(--space-3)] h-6 w-6 flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            background: "var(--color-accent-dim)",
            border: "1px solid var(--color-separator)",
          }}
          aria-hidden="true"
        >
          <div className="h-2 w-2 rounded-full bg-[var(--color-accent-primary)]" />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col",
          isReadingMode
            ? /* Reading Mode — serif, capped width, scale-settle */ [
                "animate-scale-settle",
                "reading-mode",
                "text-[var(--color-label-primary)]",
                "w-full",
              ]
            : isUser
              ? /* User bubble */ [
                  "max-w-[72%] px-[var(--space-4)] py-[var(--space-3)]",
                  "rounded-[var(--radius-md)] rounded-br-[var(--radius-sm)]",
                  "bg-[var(--color-tertiary-background)]",
                  "type-body text-[var(--color-label-primary)]",
                ]
              : /* Short assistant — no bubble, text is the surface */ [
                  "type-body text-[var(--color-label-primary)]",
                  "max-w-[var(--conversation-max-width)]",
                ]
        )}
      >
        {/* Memory attribution */}
        {usesMemory && !isUser && (
          <div
            className="mb-[var(--space-2)] px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-sm)] inline-flex items-center gap-1"
            style={{ background: "var(--color-memory-highlight)" }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-primary)]" aria-hidden="true" />
            <span className="type-caption-1 text-[var(--color-accent-primary)]">
              Using memory from this project
            </span>
          </div>
        )}

        <div
          className={cn(isStreaming && !isReadingMode && "streaming-cursor")}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />

        {/* Hover action toolbar for Copy & Edit */}
        {!isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1.5 justify-end text-[11px] text-[var(--color-label-tertiary)]">
            {isUser && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(content)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[var(--color-secondary-background)] hover:text-[var(--color-label-primary)] transition"
                title="Edit and repopulate query into chat box"
              >
                <PencilIcon className="h-3 w-3" /> Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-[var(--color-secondary-background)] hover:text-[var(--color-label-primary)] transition"
              title="Copy message to clipboard"
            >
              {copied ? (
                <>
                  <CheckIcon className="h-3 w-3 text-emerald-500" /> Copied!
                </>
              ) : (
                <>
                  <CopyIcon className="h-3 w-3" /> Copy
                </>
              )}
            </button>
          </div>
        )}

        {/* Reading Mode label */}
        {isReadingMode && (
          <p
            className="type-caption-1 text-[var(--color-label-tertiary)] mt-[var(--space-4)] border-t border-[var(--color-separator)] pt-[var(--space-2)]"
            aria-label="Reading mode active"
          >
            Reading mode
          </p>
        )}
      </div>
    </div>
  );
}

export { MessageBubble };
export type { MessageBubbleProps };
