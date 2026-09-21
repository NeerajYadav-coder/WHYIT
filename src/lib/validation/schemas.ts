/**
 * Request Validation Schemas
 *
 * All API route inputs are validated here before reaching services.
 * Zod is used for runtime type safety and clear error messages.
 */

import { z } from "zod";

// ── POST /api/chat ────────────────────────────────────────────────
export const chatRequestSchema = z.object({
  /** The user's message content */
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(8000, "Message is too long (max 8000 characters)"),

  /** The conversation to append to */
  conversationId: z
    .string()
    .min(1, "Invalid conversation ID"),

  /** The project this conversation belongs to */
  projectId: z
    .string()
    .min(1, "Invalid project ID"),

  /** Optional curiosities from client localStorage for memory sharing */
  curiosities: z
    .array(
      z.object({
        title: z.string(),
        selectedText: z.string(),
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ),
      })
    )
    .optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

// ── POST /api/projects ───────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(120, "Project name is too long"),

  goal: z
    .string()
    .trim()
    .min(1, "Goal is required")
    .max(2000, "Goal is too long"),

  motivation: z
    .string()
    .trim()
    .min(1, "Motivation is required")
    .max(2000, "Motivation is too long"),

  context: z
    .string()
    .trim()
    .max(2000, "Context is too long")
    .optional(),
});

export type CreateProjectRequest = z.infer<typeof createProjectSchema>;

// ── POST /api/resources ──────────────────────────────────────────
export const createResourceSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  title: z.string().trim().min(1, "Title is required"),
  type: z.enum([
    "PDF",
    "MARKDOWN",
    "TEXT",
    "URL",
    "YOUTUBE",
    "BOOK",
    "AUDIO",
    "VIDEO",
    "RESEARCH_PAPER",
    "GITHUB_REPO",
    "DOCUMENTATION_SITE",
  ]),
  content: z.string().optional(),
  sourceUrl: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateResourceRequest = z.infer<typeof createResourceSchema>;

// ── Shared error response shape ───────────────────────────────────
export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

/** Converts a ZodError into a flat Record<fieldName, messages[]> */
export function formatZodError(err: z.ZodError): Record<string, string[]> {
  return err.flatten().fieldErrors as Record<string, string[]>;
}
