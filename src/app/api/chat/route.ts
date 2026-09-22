/**
 * POST /api/chat
 *
 * Streams an AI response for a given conversation.
 *
 * Request body:
 *   { message, conversationId, projectId }
 *
 * Response:
 *   text/plain stream — raw token chunks, one per chunk.
 *   On error: JSON { error: string }
 *
 * Streaming contract:
 *   - User message is saved before streaming begins.
 *   - Assistant message is saved only after stream completes successfully.
 *   - Aborted streams (client disconnect / AbortController) leave no assistant message in DB.
 *   - The stream uses ReadableStream with an AbortSignal passed through to the AI provider.
 */

import { NextRequest } from "next/server";
import { chatRequestSchema, formatZodError } from "@/lib/validation/schemas";
import { conversationService, ServiceError } from "@/lib/services/conversation.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // ── Parse & validate body ────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: formatZodError(parsed.error) },
      { status: 422 }
    );
  }

  const { message, conversationId, projectId, curiosities } = parsed.data;

  // ── Abort signal — tied to client disconnect ──────────────────
  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort());

  // ── Prepare the stream ────────────────────────────────────────
  let preparedChat: Awaited<ReturnType<typeof conversationService.prepareChat>>;
  try {
    preparedChat = await conversationService.prepareChat({
      projectId,
      conversationId,
      userMessage: message,
      curiosities,
      signal: abortController.signal,
    });
  } catch (err) {
    if (err instanceof ServiceError) {
      return Response.json({ error: err.message }, { status: err.statusCode });
    }
    console.error("[POST /api/chat] prepareChat error:", err);
    return Response.json(
      { error: "Failed to initialize conversation" },
      { status: 500 }
    );
  }

  const { stream, onComplete } = preparedChat;

  // ── Stream to client ─────────────────────────────────────────
  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      let streamSucceeded = false;

      try {
        for await (const chunk of stream) {
          if (chunk.content) {
            fullContent += chunk.content;
            controller.enqueue(new TextEncoder().encode(chunk.content));
          }
          if (chunk.done) {
            streamSucceeded = true;
          }
        }
        // Stream exhausted normally — done flag may not fire on all providers
        if (!streamSucceeded) streamSucceeded = true;
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error("[POST /api/chat] stream error:", err);
          // Send a structured error marker the client can detect
          controller.enqueue(
            new TextEncoder().encode("\n\n[STREAM_ERROR]")
          );
        }
        streamSucceeded = false;
      } finally {
        controller.close();
      }

      // Only persist assistant message on clean completion
      if (streamSucceeded && fullContent.trim()) {
        try {
          await onComplete(fullContent);
        } catch (err) {
          // Non-fatal: stream already delivered to client
          console.error("[POST /api/chat] onComplete error:", err);
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Accel-Buffering": "no",
      "Cache-Control": "no-cache, no-store",
      "X-Prompt-Tokens": preparedChat.metrics.estimatedPromptTokens.toString(),
      "X-Response-Tokens": preparedChat.metrics.estimatedResponseTokens.toString(),
      ...(preparedChat.hasMemory ? { "X-Whyit-Uses-Memory": "1" } : {}),
    },
  });
}
