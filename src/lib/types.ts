/**
 * Core domain types for Whyit.
 *
 * These types define the shape of all data flowing through the application.
 * When real persistence is added, these interfaces map directly to API response shapes.
 */

/** A single message in a conversation */
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** ISO 8601 timestamp */
  createdAt: string;
  /** True while an assistant message is being streamed */
  isStreaming?: boolean;
}

/** A workspace project */
export interface Project {
  id: string;
  name: string;
  workspaceId: string;
  /** User's primary goal for this project */
  goal: string;
  /** Why this goal matters to the user */
  motivation: string;
  /** Any additional context the user shared */
  context?: string | null;
  /** ISO 8601 timestamp */
  createdAt: string;
  updatedAt: string;
}

/** A single message inside a side (curiosity) conversation */
export interface SideMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

/**
 * A side conversation (curiosity branch).
 * Think of this as a Git branch — it knows its parent,
 * never modifies it, and can be closed / reopened independently.
 */
export interface SideConversation {
  id: string;
  /** The main project this branched from */
  parentChatId: string;
  /** The specific message in the main chat that was highlighted */
  parentMessageId?: string;
  /** The exact text the learner highlighted */
  selectedText: string;
  /** 2–5 paragraphs of surrounding content for AI context injection */
  surroundingContext?: string;
  /** Auto-derived title from the selected text */
  title: string;
  /** Lesson / section heading for provenance display */
  sectionHeading?: string;
  /** The project name for display */
  projectName?: string;
  createdAt: string;
  updatedAt: string;
  messages: SideMessage[];
  pinned: boolean;
  archived: boolean;
}

/** Goal capture form data — collected during onboarding */
export interface GoalCaptureData {
  goal: string;
  motivation: string;
  context: string;
}

/** Props for any component that can be in a loading state */
export interface WithLoadingState {
  isLoading: boolean;
}

/** Props for any component that can be in an error state */
export interface WithErrorState {
  error: string | null;
}
