/**
 * GET /api/projects/[id]
 *
 * Returns a project and its active conversation ID.
 * Used by the workspace page to initialize the chat.
 */

import { conversationService, ServiceError } from "@/lib/services/conversation.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/projects/[id]">
) {
  const { id } = await ctx.params;

  try {
    // Get project with conversation IDs
    const project = await conversationService.getProject(id);
    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Get or create the active conversation
    const conversation = await conversationService.getOrCreateConversation(id);

    return Response.json({ project, conversation });
  } catch (err) {
    if (err instanceof ServiceError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error(`[GET /api/projects/${id}]`, err);
    return Response.json(
      { error: "Failed to load project" },
      { status: 500 }
    );
  }
}
