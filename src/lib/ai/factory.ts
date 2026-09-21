/**
 * AI Provider Factory
 *
 * Single place that reads AI_PROVIDER and returns the correct implementation.
 * Used as a singleton (one instance per server process).
 *
 * To register a new provider:
 *   1. Create src/lib/ai/providers/your-provider.ts
 *   2. Import it here and add a case
 *   3. Set AI_PROVIDER=your-provider-name in .env.local
 */

import type { AIProvider } from "@/lib/ai/types";

import { GroqProvider } from "@/lib/ai/providers/groq";
import { OpenAIProvider } from "@/lib/ai/providers/openai";

// Singleton — created once per server cold start
let _instance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (_instance) return _instance;

  const provider = (process.env.AI_PROVIDER ?? "groq").toLowerCase();

  switch (provider) {
    case "groq": {
      _instance = new GroqProvider();
      break;
    }
    case "openai": {
      _instance = new OpenAIProvider();
      break;
    }
    default:
      throw new Error(
        `Unknown AI provider: "${provider}". ` +
        `Set AI_PROVIDER to one of: groq, openai`
      );
  }

  return _instance;
}

/** Reset the singleton — only for testing */
export function _resetAIProvider(): void {
  _instance = null;
}
