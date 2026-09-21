/**
 * Groq Provider
 *
 * Uses the `openai` SDK with Groq's OpenAI-compatible endpoint.
 * Groq API key format: gsk_*
 *
 * Default model: llama-3.3-70b-versatile
 * Override per-request via AIStreamOptions.model.
 *
 * Switching to real OpenAI: swap baseURL and apiKey — nothing else changes.
 */

import OpenAI from "openai";
import type { AIProvider, AIStreamOptions, StreamChunk } from "@/lib/ai/types";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const DEFAULT_MODEL = process.env.AI_DEFAULT_MODEL ?? "llama-3.3-70b-versatile";
const FALLBACK_MODELS = [DEFAULT_MODEL, "llama-3.1-8b-instant", "llama3-70b-8192", "llama-3.1-70b-versatile"];

export class GroqProvider implements AIProvider {
  readonly name = "Groq";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to .env.local as: GROQ_API_KEY=gsk_..."
      );
    }
    this.client = new OpenAI({
      apiKey,
      baseURL: GROQ_BASE_URL,
    });
  }

  async *streamChat(options: AIStreamOptions): AsyncGenerator<StreamChunk, void, unknown> {
    const { messages, model, signal, maxTokens, temperature } = options;

    const candidateModels = model ? [model, ...FALLBACK_MODELS.filter((m) => m !== model)] : FALLBACK_MODELS;
    let stream: any = null;
    let lastError: unknown = null;

    for (const candidate of candidateModels) {
      try {
        stream = await this.client.chat.completions.create(
          {
            model: candidate,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            stream: true,
            max_tokens: maxTokens ?? 2048,
            temperature: temperature ?? 0.7,
          },
          { signal }
        );
        break;
      } catch (err: any) {
        lastError = err;
        const isUnavailable =
          err?.status === 404 ||
          err?.code === "model_not_found" ||
          err?.code === "model_decommissioned" ||
          (err instanceof Error && err.message.includes("decommissioned"));

        if (isUnavailable) {
          console.warn(`[GroqProvider] Model ${candidate} unavailable (${err?.code ?? err?.status}), trying next fallback…`);
          continue;
        }
        throw err;
      }
    }

    // Dynamic Discovery Fallback: If static candidates failed, query Groq's live model catalog
    if (!stream) {
      try {
        console.log("[GroqProvider] Querying live Groq model catalog for available chat models…");
        const modelList = await this.client.models.list();
        const liveModelIds = modelList.data
          .map((m) => m.id)
          .filter(
            (id) =>
              id.includes("llama") ||
              id.includes("gemma") ||
              id.includes("mixtral") ||
              id.includes("deepseek") ||
              id.includes("qwen")
          );

        for (const liveModel of liveModelIds) {
          try {
            console.log(`[GroqProvider] Attempting live model: ${liveModel}`);
            stream = await this.client.chat.completions.create(
              {
                model: liveModel,
                messages: messages.map((m) => ({ role: m.role, content: m.content })),
                stream: true,
                max_tokens: maxTokens ?? 2048,
                temperature: temperature ?? 0.7,
              },
              { signal }
            );
            if (stream) break;
          } catch {
            continue;
          }
        }
      } catch (listErr) {
        console.error("[GroqProvider] Failed to list models from Groq API:", listErr);
      }
    }

    if (!stream) {
      throw lastError ?? new Error("Failed to initiate chat stream with any available Groq model");
    }

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content ?? "";
      const done = chunk.choices[0]?.finish_reason != null;
      if (content) {
        yield { content, done: false };
      }
      if (done) {
        yield { content: "", done: true };
      }
    }
  }
}
