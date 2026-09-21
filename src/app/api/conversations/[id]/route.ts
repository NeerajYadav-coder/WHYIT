/**
 * GET /api/conversations/[id]
 *
 * Returns a conversation and all its messages.
 * Used when restoring a workspace session.
 */

import { conversationService, ServiceError } from "@/lib/services/conversation.service";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/conversations/[id]">
) {
  const { id } = await ctx.params;

  try {
    const conversation = await conversationService.getConversation(id);
    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }
    return Response.json({ conversation });
  } catch (err) {
    if (err instanceof ServiceError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error(`[GET /api/conversations/${id}]`, err);
    return Response.json(
      { error: "Failed to load conversation" },
      { status: 500 }
    );
  }
}
