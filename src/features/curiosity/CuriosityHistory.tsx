"use client";
/**
 * CuriosityHistory
 *
 * Panel rendered inside the right sidebar (Context → Curiosities tab).
 * Shows all curiosity branches for the current project, grouped by day.
 *
 * Each entry shows:
 *   - Selected text snippet (the curiosity title)
 *   - Section heading provenance
 *   - Timestamp
 *   - Message count
 *   - Pin state
 *   - Reopen button
 *
 * Principles served:
 *   Clarity — text-first, no gamification
 *   Depth   — provenance chain visible at a glance
 */

import { SparklesIcon, PinIcon, MessageSquareIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { SideConversation } from "@/lib/types";

interface CuriosityHistoryProps {
  conversations: SideConversation[];
  activeCuriosityId?: string;
  onOpen: (conv: SideConversation) => void;
  onPin: (conv: SideConversation) => void;
}

/** Group conversations by calendar day (today, yesterday, older) */
function groupByDay(
  conversations: SideConversation[]
): { label: string; items: SideConversation[] }[] {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86_400_000).toDateString();

  const groups: Record<string, SideConversation[]> = {
    Today: [],
    Yesterday: [],
    Older: [],
  };

  for (const conv of conversations) {
    const d = new Date(conv.createdAt).toDateString();
    if (d === today) groups.Today.push(conv);
    else if (d === yesterday) groups.Yesterday.push(conv);
    else groups.Older.push(conv);
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

function CuriosityHistory({
  conversations,
  activeCuriosityId,
  onOpen,
  onPin,
}: CuriosityHistoryProps) {
  const visible = conversations
    .filter((c) => !c.archived)
    .sort((a, b) => {
      // Pinned float to top, then by recency
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-[var(--space-6)] text-center py-[var(--space-8)]">
        <div
          className="h-10 w-10 rounded-[var(--radius-md)] flex items-center justify-center mb-[var(--space-4)]"
          style={{ background: "var(--color-accent-dim)", border: "1px solid var(--color-separator)" }}
          aria-hidden="true"
        >
          <SparklesIcon className="h-5 w-5" style={{ color: "var(--color-accent-primary)" }} />
        </div>
        <p className="type-subheadline font-medium mb-[var(--space-2)]" style={{ color: "var(--color-label-primary)" }}>
          No curiosities yet
        </p>
        <p className="type-footnote leading-relaxed" style={{ color: "var(--color-label-tertiary)" }}>
          Highlight any text while reading and click <strong>Explore</strong> to branch a side conversation. It won&apos;t interrupt your lesson.
        </p>
        <p className="type-caption-2 mt-[var(--space-4)] px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-sm)]"
          style={{ background: "var(--color-tertiary-background)", color: "var(--color-label-secondary)" }}>
          Tip: Ctrl + Shift + E
        </p>
      </div>
    );
  }

  const groups = groupByDay(visible);

  return (
    <div className="flex flex-col overflow-y-auto" style={{ maxHeight: "100%" }}>
      {groups.map(({ label, items }) => (
        <div key={label}>
          {/* Day label */}
          <p
            className="px-[var(--space-4)] py-[var(--space-2)] type-caption-1 font-medium uppercase tracking-wider sticky top-0"
            style={{
              color: "var(--color-label-tertiary)",
              background: "var(--color-secondary-background)",
              zIndex: 1,
            }}
          >
            {label}
          </p>

          {/* Curiosity items */}
          <ul className="space-y-[2px] px-[var(--space-2)] pb-[var(--space-2)]">
            {items.map((conv) => {
              const isActive = conv.id === activeCuriosityId;
              return (
                <li key={conv.id}>
                  <button
                    onClick={() => onOpen(conv)}
                    className={cn(
                      "w-full text-left rounded-[var(--radius-sm)] px-[var(--space-3)] py-[var(--space-2)]",
                      "transition-colors duration-[var(--duration-micro)]",
                      "group flex items-start gap-[var(--space-2)]",
                      isActive
                        ? "bg-[var(--color-accent-dim)]"
                        : "hover:bg-[var(--color-tertiary-background)]"
                    )}
                    aria-label={`Reopen curiosity: ${conv.title}`}
                    aria-current={isActive ? "true" : undefined}
                  >
                    {/* Sparkle icon */}
                    <SparklesIcon
                      className="h-[13px] w-[13px] flex-shrink-0 mt-[3px]"
                      style={{
                        color: isActive
                          ? "var(--color-accent-primary)"
                          : "var(--color-label-tertiary)",
                      }}
                      aria-hidden="true"
                    />

                    <div className="flex-1 min-w-0">
                      {/* Title (selected text snippet) */}
                      <p
                        className={cn(
                          "type-footnote font-medium truncate leading-snug",
                          isActive
                            ? "text-[var(--color-accent-primary)]"
                            : "text-[var(--color-label-primary)]"
                        )}
                      >
                        {conv.title}
                      </p>

                      {/* Provenance */}
                      {conv.sectionHeading && (
                        <p
                          className="type-caption-2 truncate mt-[2px]"
                          style={{ color: "var(--color-label-tertiary)" }}
                        >
                          {conv.sectionHeading}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-1)]">
                        {conv.messages.length > 0 && (
                          <span
                            className="flex items-center gap-[2px] type-caption-2"
                            style={{ color: "var(--color-label-tertiary)" }}
                          >
                            <MessageSquareIcon className="h-[10px] w-[10px]" aria-hidden="true" />
                            {conv.messages.length}
                          </span>
                        )}
                        <span className="type-caption-2" style={{ color: "var(--color-label-tertiary)" }}>
                          {formatRelativeDate(conv.updatedAt)}
                        </span>
                        {conv.pinned && (
                          <PinIcon
                            className="h-[10px] w-[10px]"
                            style={{ color: "var(--color-accent-primary)" }}
                            aria-label="Pinned"
                          />
                        )}
                      </div>
                    </div>

                    {/* Pin button (visible on hover) */}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => { e.stopPropagation(); onPin(conv); }}
                      aria-label={conv.pinned ? "Unpin" : "Pin this curiosity"}
                      title={conv.pinned ? "Unpin" : "Pin"}
                      className={cn(
                        "!min-h-0 !min-w-0 h-6 w-6 flex-shrink-0 mt-[1px]",
                        "opacity-0 group-hover:opacity-100 transition-opacity",
                        conv.pinned && "opacity-100"
                      )}
                    >
                      <PinIcon className="h-3 w-3" />
                    </Button>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export { CuriosityHistory };
export type { CuriosityHistoryProps };
