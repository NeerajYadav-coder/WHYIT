import { NextRequest } from "next/server";
import { resourceService } from "@/lib/knowledge/services/resource.service";
import { createResourceSchema, formatZodError } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/resources?projectId=...
 * Lists all knowledge sources registered for a project.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return Response.json({ error: "projectId query parameter is required" }, { status: 400 });
  }

  try {
    const resources = await resourceService.listResources(projectId);
    return Response.json({ resources });
  } catch (err) {
    console.error("[GET /api/resources] Error:", err);
    return Response.json({ error: "Failed to list resources" }, { status: 500 });
  }
}

/**
 * POST /api/resources
 * Creates and ingests a new knowledge source through the standard pipeline.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    // Check if multipart form data or JSON
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const projectId = formData.get("projectId") as string;
      const title = formData.get("title") as string;
      const type = formData.get("type") as string;
      const file = formData.get("file") as File | null;
      const sourceUrl = formData.get("sourceUrl") as string | null;
      const contentText = formData.get("content") as string | null;

      let fileBuffer: Buffer | undefined;
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
      }

      const parsed = createResourceSchema.safeParse({
        projectId,
        title,
        type,
        content: contentText || undefined,
        sourceUrl: sourceUrl || undefined,
      });

      if (!parsed.success) {
        return Response.json(
          { error: "Validation failed", details: formatZodError(parsed.error) },
          { status: 422 }
        );
      }

      const result = await resourceService.createResource({
        ...parsed.data,
        fileBuffer,
      });

      return Response.json(result, { status: 201 });
    } else {
      body = await req.json();
      const parsed = createResourceSchema.safeParse(body);
      if (!parsed.success) {
        return Response.json(
          { error: "Validation failed", details: formatZodError(parsed.error) },
          { status: 422 }
        );
      }

      const result = await resourceService.createResource(parsed.data);
      return Response.json(result, { status: 201 });
    }
  } catch (err) {
    console.error("[POST /api/resources] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create resource" },
      { status: 500 }
    );
  }
}
