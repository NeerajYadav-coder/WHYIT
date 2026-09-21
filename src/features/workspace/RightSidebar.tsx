"use client";
// Client boundary: collapse state.
// Principle: Depth — Memory Drawer surfaces what the AI knows (§6).
// The panel is structurally present now so adding Memory/Resources later
// requires no layout rework.
//
// Curiosities tab: subscribes to whyit:curiosities CustomEvent dispatched
// from the workspace page whenever a side conversation is created or updated.

import { useState, useEffect } from "react";
import {
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  BrainIcon,
  BookOpenIcon,
  BarChart2Icon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useParams } from "next/navigation";
import { CuriosityHistory } from "@/features/curiosity/CuriosityHistory";
import { ResourcesManager } from "@/features/knowledge/ResourcesManager";
import { ProjectMemoryPanel } from "./ProjectMemoryPanel";
import { ProjectProgressPanel } from "./ProjectProgressPanel";
import { loadCuriosities, saveCuriosities, syncCuriositiesFromServer } from "@/lib/curiosity-store";
import { cn } from "@/lib/utils";
import type { SideConversation } from "@/lib/types";

const STORAGE_KEY = "whyit_sidebar_right_collapsed";

/* Future tab IDs — wired up when features land */
type PanelTab = "memory" | "resources" | "progress" | "curiosities";

interface RightSidebarProps {
  projectId?: string;
}

function RightSidebar({ projectId }: RightSidebarProps = {}) {
  const routeParams = useParams<{ projectId?: string }>();
  const activeProjectId = projectId || routeParams?.projectId || "default";

  const [collapsed, setCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState<PanelTab>("curiosities");
  const [curiosities, setCuriosities] = useState<SideConversation[]>([]);
  const [activeCuriosityId, setActiveCuriosityId] = useState<string | undefined>();
  const [currentProjectId, setCurrentProjectId] = useState<string>(activeProjectId);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) setCollapsed(v === "true");
  }, []);

  // ── Reactive project change sync ─────────────────────────────
  useEffect(() => {
    if (activeProjectId) {
      setCurrentProjectId(activeProjectId);
      setCuriosities(loadCuriosities(activeProjectId));
      syncCuriositiesFromServer(activeProjectId).then((synced) => {
        if (synced && synced.length > 0) {
          setCuriosities(synced);
        }
      });
    }
  }, [activeProjectId]);

  // ── Subscribe to curiosity updates from WorkspacePage ─────────
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{
        projectId: string;
        conversations: SideConversation[];
      }>).detail;
      if (detail.projectId === activeProjectId) {
        setCurrentProjectId(detail.projectId);
        setCuriosities(detail.conversations);
        setActiveTab("curiosities");
      }
    }
    window.addEventListener("whyit:curiosities", handler);
    return () => window.removeEventListener("whyit:curiosities", handler);
  }, [activeProjectId]);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  // ── Curiosity actions ─────────────────────────────────────────
  function handleOpenCuriosity(conv: SideConversation) {
    setActiveCuriosityId(conv.id);
    // Re-dispatch to workspace to open the popup
    window.dispatchEvent(
      new CustomEvent("whyit:open-curiosity", { detail: conv })
    );
  }

  function handlePinCuriosity(conv: SideConversation) {
    const all = loadCuriosities(currentProjectId);
    const updated = all.map((c) =>
      c.id === conv.id ? { ...c, pinned: !c.pinned } : c
    );
    saveCuriosities(currentProjectId, updated);
    setCuriosities(updated);
  }

  const tabs: {
    id: PanelTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: "curiosities",
      label: "Curiosities",
      icon: <SparklesIcon className="h-[16px] w-[16px]" />,
      badge: curiosities.filter((c) => !c.archived).length || undefined,
    },
    {
      id: "memory",
      label: "Memory",
      icon: <BrainIcon className="h-[16px] w-[16px]" />,
    },
    {
      id: "resources",
      label: "Resources",
      icon: <BookOpenIcon className="h-[16px] w-[16px]" />,
    },
    {
      id: "progress",
      label: "Progress",
      icon: <BarChart2Icon className="h-[16px] w-[16px]" />,
    },
  ];

  return (
    <aside
      aria-label="Context panel"
      className={cn(
        "flex flex-col h-full flex-shrink-0 border-l",
        "transition-[width] ease-[var(--ease-standard)] duration-[var(--duration-medium)]",
        "overflow-hidden",
        collapsed ? "w-[58px]" : "w-[280px]"
      )}
      style={{
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderColor: "var(--color-separator)",
      }}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-[56px] flex-shrink-0 border-b",
          collapsed ? "justify-center" : "justify-between px-[var(--space-4)]"
        )}
        style={{ borderColor: "var(--color-separator)" }}
      >
        {!collapsed && (
          <p className="type-subheadline font-medium" style={{ color: "var(--color-label-secondary)" }}>
            Context
          </p>
        )}
        <Button
          id="sidebar-right-toggle"
          variant="ghost" size="icon-sm"
          onClick={toggle}
          aria-label={collapsed ? "Open context panel" : "Close context panel"}
        >
          {collapsed
            ? <PanelRightOpenIcon className="h-[18px] w-[18px]" />
            : <PanelRightCloseIcon className="h-[18px] w-[18px]" />}
        </Button>
      </div>

      {!collapsed && (
        <>
          {/* Tab strip */}
          <div
            role="tablist"
            className="flex border-b overflow-x-auto"
            style={{ borderColor: "var(--color-separator)" }}
          >
            {tabs.map(({ id, label, icon, badge }) => (
              <button
                key={id}
                role="tab"
                onClick={() => setActiveTab(id)}
                aria-selected={activeTab === id}
                aria-label={label}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-[var(--space-1)] py-[var(--space-2)]",
                  "type-caption-2 font-medium relative",
                  "min-h-[44px] min-w-[56px]",
                  "transition-colors duration-[var(--duration-micro)]",
                  "border-b-2",
                  activeTab === id
                    ? "border-[var(--color-accent-primary)] text-[var(--color-accent-primary)]"
                    : "border-transparent text-[var(--color-label-tertiary)] hover:text-[var(--color-label-secondary)]"
                )}
              >
                <span style={{ position: "relative" }}>
                  {icon}
                  {badge != null && badge > 0 && (
                    <span
                      className="curiosity-badge"
                      aria-label={`${badge} curiosities`}
                    >
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="truncate max-w-[52px]">{label}</span>
              </button>
            ))}
          </div>

          {/* Panel body */}
          <div className="flex-1 overflow-y-auto">

            {/* ── Curiosities ─────────────────────────────────── */}
            {activeTab === "curiosities" && (
              <CuriosityHistory
                conversations={curiosities}
                activeCuriosityId={activeCuriosityId}
                onOpen={handleOpenCuriosity}
                onPin={handlePinCuriosity}
              />
            )}

            {/* ── Memory ──────────────────────────────────────── */}
            {activeTab === "memory" && (
              <ProjectMemoryPanel projectId={currentProjectId} />
            )}

            {/* ── Resources ───────────────────────────────────── */}
            {activeTab === "resources" && (
              <ResourcesManager projectId={currentProjectId} />
            )}

            {/* ── Progress ────────────────────────────────────── */}
            {activeTab === "progress" && (
              <ProjectProgressPanel projectId={currentProjectId} />
            )}
          </div>
        </>
      )}

      {/* Collapsed icon hints */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center py-[var(--space-4)] gap-[var(--space-2)]">
          {tabs.map(({ id, label, icon, badge }) => (
            <Button
              key={id}
              variant="ghost" size="icon-sm"
              aria-label={id === "curiosities" ? `Curiosities${badge ? ` (${badge})` : ""}` : `${label} — coming soon`}
              title={label}
              onClick={toggle}
              style={{ position: "relative" }}
            >
              <span style={{ color: "var(--color-label-tertiary)", position: "relative" }}>
                {icon}
                {badge != null && badge > 0 && (
                  <span className="curiosity-badge" aria-hidden="true">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </span>
            </Button>
          ))}
        </div>
      )}
    </aside>
  );
}

export { RightSidebar };
