import { NextRequest } from "next/server";
import { resourceService } from "@/lib/knowledge/services/resource.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/resources/:id/reprocess
 * Retries/reprocesses an existing failed or modified knowledge source.
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const result = await resourceService.reprocessResource(id);
    return Response.json(result);
  } catch (err) {
    console.error(`[POST /api/resources/${id}/reprocess] Error:`, err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to reprocess resource" },
      { status: 500 }
    );
  }
}
