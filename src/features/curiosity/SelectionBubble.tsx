"use client";
/**
 * SelectionBubble
 *
 * Watches for text selections anywhere inside its parent container.
 * When a selection is detected, it renders a small floating action button
 * anchored to the selection bounding box.
 *
 * Keyboard shortcut: Ctrl+Shift+E triggers "Explore" for the current selection.
 *
 * Principle served:
 *   Deference — the bubble is minimal, appears only when needed, dissolves on dismiss.
 *   Clarity   — single action label, no ambiguity.
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { SparklesIcon } from "lucide-react";

interface SelectionInfo {
  text: string;
  top: number;
  left: number;
  width: number;
  /** The surrounding paragraph text for AI context */
  surroundingContext: string;
  /** Nearest heading text for provenance */
  sectionHeading: string;
}

interface SelectionBubbleProps {
  /** Called when the learner clicks Explore or presses Ctrl+Shift+E */
  onExplore: (selection: SelectionInfo) => void;
  /** The scrollable container ref — used to offset the bubble correctly */
  containerRef: React.RefObject<HTMLElement | null>;
}

/** Walk up the DOM to find the nearest heading (h1–h6) */
function findNearestHeading(node: Node | null): string {
  let el = node instanceof Element ? node : node?.parentElement;
  while (el) {
    // Look for a preceding heading sibling or parent heading
    if (/^H[1-6]$/.test(el.tagName)) return el.textContent ?? "";
    let prev = el.previousElementSibling;
    while (prev) {
      if (/^H[1-6]$/.test(prev.tagName)) return prev.textContent ?? "";
      prev = prev.previousElementSibling;
    }
    el = el.parentElement;
  }
  return "";
}

/** Collect ≤5 sibling paragraphs around a node for AI context */
function collectSurroundingContext(anchorNode: Node | null): string {
  if (!anchorNode) return "";
  const el =
    anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
  if (!el) return "";

  const paragraphEl = el.closest("p, li, div, section") ?? el;
  const parent = paragraphEl.parentElement;
  if (!parent) return paragraphEl.textContent ?? "";

  const siblings = Array.from(parent.children);
  const idx = siblings.indexOf(paragraphEl as Element);
  const window2 = siblings.slice(Math.max(0, idx - 2), idx + 3);
  return window2.map((s) => s.textContent ?? "").join("\n\n");
}

function SelectionBubble({ onExplore, containerRef }: SelectionBubbleProps) {
  const [info, setInfo] = useState<SelectionInfo | null>(null);
  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHide = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
  }, []);

  const scheduleHide = useCallback(() => {
    clearHide();
    hideTimeout.current = setTimeout(() => setInfo(null), 250);
  }, [clearHide]);

  const readSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
      scheduleHide();
      return;
    }
    const text = sel.toString().trim();
    if (text.length < 3) {
      scheduleHide();
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      scheduleHide();
      return;
    }

    // Convert from viewport to container-relative coords
    const container = containerRef.current;
    const offset = container
      ? container.getBoundingClientRect()
      : { top: 0, left: 0 };

    const surrounding = collectSurroundingContext(range.commonAncestorContainer);
    const heading = findNearestHeading(range.commonAncestorContainer);

    clearHide();
    setInfo({
      text,
      top: rect.top - offset.top + container!.scrollTop - 52, // above selection
      left: rect.left - offset.left + rect.width / 2,
      width: rect.width,
      surroundingContext: surrounding,
      sectionHeading: heading,
    });
  }, [containerRef, clearHide, scheduleHide]);

  // ── Listen for selection changes ──────────────────────────────
  useEffect(() => {
    const handleMouseUp = () => setTimeout(readSelection, 10);
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.shiftKey) readSelection();
    };
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [readSelection]);

  // ── Keyboard shortcut: Ctrl+Shift+E ──────────────────────────
  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "E") {
        e.preventDefault();
        const sel = window.getSelection();
        if (sel && !sel.isCollapsed && sel.toString().trim().length >= 3) {
          const text = sel.toString().trim();
          const range = sel.getRangeAt(0);
          const surrounding = collectSurroundingContext(range.commonAncestorContainer);
          const heading = findNearestHeading(range.commonAncestorContainer);
          onExplore({
            text,
            top: 0,
            left: 0,
            width: 0,
            surroundingContext: surrounding,
            sectionHeading: heading,
          });
          setInfo(null);
          sel.removeAllRanges();
        }
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [onExplore]);

  // ── Dismiss on outside click ──────────────────────────────────
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const bubble = document.getElementById("curiosity-bubble");
      if (bubble && !bubble.contains(e.target as Node)) {
        scheduleHide();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [scheduleHide]);

  if (!info) return null;

  function handleExplore() {
    if (!info) return;
    onExplore(info);
    setInfo(null);
    window.getSelection()?.removeAllRanges();
  }

  return (
    <div
      id="curiosity-bubble"
      role="tooltip"
      aria-label="Explore this text in a side conversation"
      style={{
        position: "absolute",
        top: `${info.top}px`,
        left: `${info.left}px`,
        transform: "translateX(-50%)",
        zIndex: 1000,
        pointerEvents: "auto",
      }}
      className="curiosity-bubble-enter"
      onMouseEnter={clearHide}
      onMouseLeave={scheduleHide}
    >
      <button
        onClick={handleExplore}
        className="curiosity-explore-btn"
        aria-label="Explore selected text"
      >
        <SparklesIcon
          style={{
            width: "13px",
            height: "13px",
            color: "var(--color-accent-foreground)",
          }}
          aria-hidden="true"
        />
        <span>Explore</span>
      </button>

      {/* Little arrow pointing down to the selection */}
      <div className="curiosity-bubble-arrow" aria-hidden="true" />
    </div>
  );
}

export { SelectionBubble };
export type { SelectionInfo };
