import { PromptBuilder } from "../context/PromptBuilder";
import { ContextService } from "./context.service";
import type { ChatMessage } from "@/lib/ai/types";
import type { TokenMetrics } from "../context/types";

/**
 * PromptService
 *
 * Coordinates the full context-assembly and prompt-building pipeline.
 *
 * Responsibilities:
 *   - Assembles and budgets context via ContextService
 *   - Formats final LLM payload using PromptBuilder
 *   - Returns the prepared messages and token metrics
 */
export class PromptService {
  private contextService: ContextService;
  private builder: PromptBuilder;

  constructor(contextService?: ContextService, builder?: PromptBuilder) {
    this.contextService = contextService ?? new ContextService();
    this.builder = builder ?? new PromptBuilder();
  }

   /**
   * Prepares the full prompt payload and returns it alongside token metrics.
   */
  async preparePrompt(opts: {
    projectId: string;
    conversationId?: string;
    userMessage?: string;
    curiosities?: {
      title: string;
      selectedText: string;
      messages: { role: "user" | "assistant"; content: string }[];
    }[];
  }): Promise<{ messages: ChatMessage[]; metrics: TokenMetrics }> {
    const { projectId, conversationId, userMessage, curiosities } = opts;

    // 1. Get pruned context and token metrics
    const { context, metrics } = await this.contextService.getContextAndBudget({
      projectId,
      conversationId,
      userMessage,
      curiosities,
    });

    // 2. Build the final formatted payload
    const messages = this.builder.build(context, userMessage);

    return {
      messages,
      metrics,
    };
  }
}
