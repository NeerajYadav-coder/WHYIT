import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import type { SideConversation } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/curiosities?projectId=...
 * Fetch all persistent curiosity side conversations for a project
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "projectId query parameter required" }, { status: 400 });
  }

  try {
    const curiosities = await prisma.curiosity.findMany({
      where: { projectId },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    });

    const mapped: SideConversation[] = curiosities.map((c) => ({
      id: c.id,
      parentChatId: c.parentChatId || c.projectId,
      parentMessageId: c.parentMessageId || undefined,
      selectedText: c.selectedText,
      surroundingContext: c.surroundingContext || undefined,
      sectionHeading: c.sectionHeading || undefined,
      projectName: c.projectName || undefined,
      title: c.title,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      messages: Array.isArray(c.messages) ? (c.messages as any) : [],
      pinned: c.pinned,
      archived: c.archived,
    }));

    return Response.json({ curiosities: mapped });
  } catch (err) {
    console.error("[GET /api/curiosities] Error:", err);
    return Response.json({ error: "Failed to fetch curiosities" }, { status: 500 });
  }
}

const curiosityUpsertSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1),
  selectedText: z.string().min(1),
  surroundingContext: z.string().optional(),
  sectionHeading: z.string().optional(),
  projectName: z.string().optional(),
  title: z.string().min(1),
  pinned: z.boolean().optional(),
  archived: z.boolean().optional(),
  parentMessageId: z.string().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      createdAt: z.string(),
    })
  ).optional(),
});

/**
 * POST /api/curiosities
 * Upserts a curiosity thread into PostgreSQL
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = curiosityUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation failed", details: parsed.error.format() }, { status: 422 });
  }

  const data = parsed.data;

  try {
    const upserted = await prisma.curiosity.upsert({
      where: { id: data.id || "new-curiosity" },
      create: {
        ...(data.id ? { id: data.id } : {}),
        projectId: data.projectId,
        selectedText: data.selectedText,
        surroundingContext: data.surroundingContext,
        sectionHeading: data.sectionHeading,
        projectName: data.projectName,
        title: data.title,
        pinned: data.pinned ?? false,
        archived: data.archived ?? false,
        parentMessageId: data.parentMessageId,
        parentChatId: data.projectId,
        messages: data.messages ? (data.messages as any) : [],
      },
      update: {
        title: data.title,
        pinned: data.pinned,
        archived: data.archived,
        messages: data.messages ? (data.messages as any) : undefined,
        updatedAt: new Date(),
      },
    });

    return Response.json({ curiosity: upserted }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/curiosities] Error:", err);
    return Response.json({ error: "Failed to persist curiosity" }, { status: 500 });
  }
}

/**
 * DELETE /api/curiosities?id=...
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id query parameter required" }, { status: 400 });
  }

  try {
    await prisma.curiosity.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/curiosities] Error:", err);
    return Response.json({ error: "Failed to delete curiosity" }, { status: 500 });
  }
}
