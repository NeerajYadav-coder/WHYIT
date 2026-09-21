/**
 * GET  /api/projects        — list all projects
 * POST /api/projects        — create a new project
 */

import { NextRequest } from "next/server";
import { conversationService } from "@/lib/services/conversation.service";
import { createProjectSchema, formatZodError } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

// ── GET /api/projects ────────────────────────────────────────────
export async function GET() {
  try {
    const projects = await conversationService.listProjects();
    return Response.json({ projects });
  } catch (err) {
    console.error("[GET /api/projects]", err);
    return Response.json({ error: "Failed to load projects" }, { status: 500 });
  }
}

// ── POST /api/projects ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: formatZodError(parsed.error) },
      { status: 422 }
    );
  }

  try {
    const { project, conversation } = await conversationService.createProject(
      parsed.data
    );
    return Response.json({ project, conversation }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/projects]", err);
    return Response.json({ error: "Failed to create project" }, { status: 500 });
  }
}
