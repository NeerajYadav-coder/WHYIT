/**
 * POST /api/curiosity
 *
 * Ephemeral streaming endpoint for Side Conversations (Curiosity Mode).
 * Streams real AI responses without persisting them in the database.
 *
 * Sharing context:
 *   - Reads project/conversation context from DB if passed, preserving history.
 *   - Blends 60% user question intent + 40% storyteller/historical analogy persona.
 */

import { NextRequest } from "next/server";
import { z } from "zod";
import { conversationService } from "@/lib/services/conversation.service";
import { formatZodError } from "@/lib/validation/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const curiosityRequestSchema = z.object({
  selectedText: z.string().trim().min(1),
  surroundingContext: z.string().trim().optional(),
  sectionHeading: z.string().trim().optional(),
  projectId: z.string().optional(),
  conversationId: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1),
    })
  ),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = curiosityRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: formatZodError(parsed.error) },
      { status: 422 }
    );
  }

  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort());

  try {
    const stream = await conversationService.prepareCuriosityChat({
      ...parsed.data,
      signal: abortController.signal,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.content) {
              controller.enqueue(new TextEncoder().encode(chunk.content));
            }
          }
        } catch (err) {
          if (!abortController.signal.aborted) {
            console.error("[POST /api/curiosity] Stream error:", err);
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Accel-Buffering": "no",
        "Cache-Control": "no-cache, no-store",
      },
    });
  } catch (err) {
    console.error("[POST /api/curiosity] Error:", err);
    return Response.json({ error: "Failed to stream curiosity answer" }, { status: 500 });
  }
}
