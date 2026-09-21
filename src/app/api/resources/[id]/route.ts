import { NextRequest } from "next/server";
import { resourceService } from "@/lib/knowledge/services/resource.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/resources/:id
 * Fetches resource metadata, processing jobs, and chunk information.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const resource = await resourceService.getResourceById(id);
    if (!resource) {
      return Response.json({ error: "Resource not found" }, { status: 404 });
    }

    return Response.json({ resource });
  } catch (err) {
    console.error(`[GET /api/resources/${id}] Error:`, err);
    return Response.json({ error: "Failed to fetch resource" }, { status: 500 });
  }
}

/**
 * DELETE /api/resources/:id
 * Deletes a resource and all associated chunks and processing jobs.
 */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    await resourceService.deleteResource(id);
    return Response.json({ success: true, message: "Resource deleted" });
  } catch (err) {
    console.error(`[DELETE /api/resources/${id}] Error:`, err);
    return Response.json({ error: "Failed to delete resource" }, { status: 500 });
  }
}
