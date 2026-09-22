import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/axioms?projectId=...
 * Fetch all established axioms for the active learning project
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "projectId query parameter is required" }, { status: 400 });
  }

  try {
    const axioms = await prisma.learningAxiom.findMany({
      where: { projectId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return Response.json({ axioms });
  } catch (err) {
    console.error("[GET /api/axioms] Error:", err);
    return Response.json({ error: "Failed to fetch axioms" }, { status: 500 });
  }
}

const axiomUpsertSchema = z.object({
  id: z.string().optional(),
  projectId: z.string().min(1),
  statement: z.string().trim().min(3),
  formula: z.string().trim().optional().nullable(),
  category: z.string().trim().default("Core Principle"),
  status: z.enum(["DISCOVERED", "IN_PROGRESS", "MASTERED"]).default("DISCOVERED"),
  evidence: z.string().trim().optional().nullable(),
  pinned: z.boolean().default(false),
});

/**
 * POST /api/axioms
 * Creates or updates an axiom in PostgreSQL
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = axiomUpsertSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.format() },
      { status: 422 }
    );
  }

  const data = parsed.data;

  try {
    const axiom = await prisma.learningAxiom.upsert({
      where: { id: data.id || "new-axiom" },
      create: {
        ...(data.id ? { id: data.id } : {}),
        projectId: data.projectId,
        statement: data.statement,
        formula: data.formula,
        category: data.category,
        status: data.status,
        evidence: data.evidence,
        pinned: data.pinned,
      },
      update: {
        statement: data.statement,
        formula: data.formula,
        category: data.category,
        status: data.status,
        evidence: data.evidence,
        pinned: data.pinned,
        updatedAt: new Date(),
      },
    });

    return Response.json({ axiom }, { status: 200 });
  } catch (err) {
    console.error("[POST /api/axioms] Error:", err);
    return Response.json({ error: "Failed to save axiom" }, { status: 500 });
  }
}

/**
 * DELETE /api/axioms?id=...
 */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "id query parameter is required" }, { status: 400 });
  }

  try {
    await prisma.learningAxiom.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/axioms] Error:", err);
    return Response.json({ error: "Failed to delete axiom" }, { status: 500 });
  }
}
