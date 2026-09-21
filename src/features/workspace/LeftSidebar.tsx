"use client";
// Client boundary: collapse state (localStorage), router navigation.
// Principle: Deference — sidebar recedes, never competes with conversation.
// Depth — Project context always visible; no hidden hamburger for active project.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  PlusIcon, SettingsIcon,
  PanelLeftCloseIcon, PanelLeftOpenIcon,
  MessageSquareIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Wordmark } from "@/features/landing/Wordmark";
import { cn, truncate, formatRelativeDate } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface LeftSidebarProps {
  projects: Project[];
  onNewProject: () => void;
}

const STORAGE_KEY = "whyit_sidebar_left_collapsed";

function LeftSidebar({ projects, onNewProject }: LeftSidebarProps) {
  const params = useParams<{ projectId: string }>();
  const activeId = params.projectId;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) setCollapsed(v === "true");
  }, []);

  function toggle() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  }

  return (
    <aside
      aria-label="Projects"
      className={cn(
        /* Glass surface — §4 translucent material */
        "flex flex-col h-full flex-shrink-0",
        "border-r",
        "transition-[width] ease-[var(--ease-standard)] duration-[var(--duration-medium)]",
        "overflow-hidden",
        collapsed ? "w-[58px]" : "w-[240px]"
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
          <Link href="/" aria-label="Whyit home">
            <Wordmark size="sm" />
          </Link>
        )}
        <Button
          id="sidebar-left-toggle"
          variant="ghost" size="icon-sm"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed
            ? <PanelLeftOpenIcon className="h-[18px] w-[18px]" />
            : <PanelLeftCloseIcon className="h-[18px] w-[18px]" />}
        </Button>
      </div>

      {/* Project list */}
      <nav className="flex-1 overflow-y-auto py-[var(--space-3)]" aria-label="Projects">
        {!collapsed && (
          <p
            className="px-[var(--space-4)] mb-[var(--space-2)] type-caption-1 font-medium uppercase tracking-wider"
            style={{ color: "var(--color-label-tertiary)" }}
          >
            Projects
          </p>
        )}
        <ul className="space-y-[2px] px-[var(--space-2)]">
          {projects.map((project) => {
            const isActive = project.id === activeId;
            return (
              <li key={project.id}>
                <Link
                  href={`/workspace/${project.id}`}
                  id={`sidebar-project-${project.id}`}
                  aria-current={isActive ? "page" : undefined}
                  title={collapsed ? project.name : undefined}
                  className={cn(
                    "flex items-center gap-[var(--space-3)] rounded-[var(--radius-sm)]",
                    "px-[var(--space-3)] min-h-[44px]",
                    "type-subheadline",
                    "transition-colors duration-[var(--duration-micro)] ease-[var(--ease-standard)]",
                    collapsed && "justify-center",
                    isActive
                      ? "text-[var(--color-accent-primary)]"
                      : "text-[var(--color-label-secondary)] hover:text-[var(--color-label-primary)]"
                  )}
                  style={{
                    background: isActive ? "var(--color-accent-dim)" : undefined,
                  }}
                >
                  <MessageSquareIcon
                    className="h-[16px] w-[16px] flex-shrink-0"
                    style={{ color: isActive ? "var(--color-accent-primary)" : "var(--color-label-tertiary)" }}
                  />
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium leading-tight">
                        {truncate(project.name, 26)}
                      </p>
                      <p className="type-caption-1" style={{ color: "var(--color-label-tertiary)" }}>
                        {formatRelativeDate(project.createdAt)}
                      </p>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer actions */}
      <div
        className="border-t py-[var(--space-3)] px-[var(--space-2)] space-y-[2px] flex-shrink-0"
        style={{ borderColor: "var(--color-separator)" }}
      >
        <Button
          id="sidebar-new-project"
          variant="ghost" size={collapsed ? "icon" : "md"}
          onClick={onNewProject}
          aria-label="New Project"
          title={collapsed ? "New Project" : undefined}
          className={cn("w-full", collapsed ? "justify-center" : "justify-start gap-[var(--space-3)] px-[var(--space-3)]")}
        >
          <PlusIcon className="h-[16px] w-[16px] flex-shrink-0" />
          {!collapsed && <span className="type-subheadline">New project</span>}
        </Button>

        <Link href="/settings" id="sidebar-settings" className="block">
          <Button
            variant="ghost" size={collapsed ? "icon" : "md"}
            aria-label="Settings"
            title={collapsed ? "Settings" : undefined}
            className={cn("w-full pointer-events-none", collapsed ? "justify-center" : "justify-start gap-[var(--space-3)] px-[var(--space-3)]")}
          >
            <SettingsIcon className="h-[16px] w-[16px] flex-shrink-0" />
            {!collapsed && <span className="type-subheadline">Settings</span>}
          </Button>
        </Link>
      </div>
    </aside>
  );
}

export { LeftSidebar };
