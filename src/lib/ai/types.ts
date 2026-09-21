/**
 * AI Provider Interface
 *
 * All AI providers implement this contract.
 * The application layer never touches provider-specific objects.
 *
 * To add a new provider:
 *   1. Create src/lib/ai/providers/your-provider.ts
 *   2. Implement AIProvider
 *   3. Register it in src/lib/ai/factory.ts
 *   4. Set AI_PROVIDER=your-provider in .env.local
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface AIStreamOptions {
  messages: ChatMessage[];
  model?: string;
  signal?: AbortSignal;
  /** Max tokens for the response. Defaults to provider default. */
  maxTokens?: number;
  /** Sampling temperature 0–1. Defaults to 0.7. */
  temperature?: number;
}

export interface AIProvider {
  /** Human-readable name, e.g. "Groq (llama-3.3-70b)" */
  readonly name: string;
  /**
   * Returns an async generator that yields content chunks as they stream.
   * The caller is responsible for aborting via AbortSignal.
   */
  streamChat(options: AIStreamOptions): AsyncGenerator<StreamChunk, void, unknown>;
}
