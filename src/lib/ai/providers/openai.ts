/**
 * OpenAI Provider (reserved)
 *
 * Identical contract to GroqProvider — uses the real OpenAI endpoint.
 * Activate by setting AI_PROVIDER=openai and OPENAI_API_KEY in .env.local.
 */

import OpenAI from "openai";
import type { AIProvider, AIStreamOptions, StreamChunk } from "@/lib/ai/types";

const DEFAULT_MODEL =
  process.env.AI_DEFAULT_MODEL ?? "gpt-4o-mini";

export class OpenAIProvider implements AIProvider {
  readonly name = "OpenAI";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to .env.local as: OPENAI_API_KEY=sk-..."
      );
    }
    this.client = new OpenAI({ apiKey });
  }

  async *streamChat(options: AIStreamOptions): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, model, signal, maxTokens, temperature } = options;

    const stream = await this.client.chat.completions.create(
      {
        model: model ?? DEFAULT_MODEL,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        stream: true,
        max_tokens: maxTokens,
        temperature: temperature ?? 0.7,
      },
      { signal }
    );

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      const done = chunk.choices[0]?.finish_reason != null;
      if (content) yield { content, done: false };
      if (done) yield { content: "", done: true };
    }
  }
}
