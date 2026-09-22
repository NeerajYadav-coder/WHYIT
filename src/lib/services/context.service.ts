import { ContextEngine } from "../context/ContextEngine";
import { ConversationSelector } from "../context/ConversationSelector";
import type { WhyitContext, TokenMetrics, TokenBudget, ContextRequestParams } from "../context/types";

/**
 * ContextService
 *
 * Coordinates context assembly and enforces token budgeting/pruning.
 *
 * Responsibilities:
 *   - Assembles context using ContextEngine
 *   - Computes token budgets and metrics
 *   - Delegates conversation pruning to ConversationSelector
 */
export class ContextService {
  private engine: ContextEngine;
  private selector: ConversationSelector;

  constructor(engine?: ContextEngine, selector?: ConversationSelector) {
    this.engine = engine ?? new ContextEngine();
    this.selector = selector ?? new ConversationSelector();
  }

  /**
   * Assembles the context and returns the pruned context alongside token budget metrics.
   */
  async getContextAndBudget(
    params: ContextRequestParams,
    budgetOverrides?: Partial<TokenBudget>
  ): Promise<{ context: WhyitContext; metrics: TokenMetrics }> {
    // ── 1. Configure Default Token Budgets ──────────────────────
    const budget: TokenBudget = {
      maxContextTokens: budgetOverrides?.maxContextTokens ?? 8192,
      maxCompletionTokens: budgetOverrides?.maxCompletionTokens ?? 2048,
    };

    // ── 2. Assemble Raw Context ─────────────────────────────────
    const context = await this.engine.assembleContext(params);

    // ── 3. Calculate Static Context Size (Project + Goal + Curiosities) ──
    let staticTokens = 0;
    if (context.project) {
      staticTokens += Math.ceil((context.project.name.length + (context.project.context?.length ?? 0)) / 4);
    }
    if (context.goal) {
      staticTokens += Math.ceil((context.goal.goal.length + context.goal.motivation.length) / 4);
    }
    if (context.curiosity?.threads) {
      for (const thread of context.curiosity.threads) {
        staticTokens += Math.ceil(thread.selectedText.length / 4);
        for (const msg of thread.messages) {
          staticTokens += Math.ceil(msg.content.length / 4) + 4;
        }
      }
    }
    if (context.memory?.axioms) {
      for (const ax of context.memory.axioms) {
        staticTokens += Math.ceil((ax.statement.length + (ax.formula?.length ?? 0)) / 4) + 10;
      }
    }

    // System prompt template overhead estimate (~180 tokens)
    staticTokens += 180;

    // ── 4. Calculate Current User Turn Size ─────────────────────
    const userMessage = params.userMessage ?? "";
    const userMessageTokens = Math.ceil(userMessage.length / 4);

    // ── 5. Budget and Prune Knowledge Chunks & Resources ────────
    let knowledgeTokens = 0;
    // Cap knowledge/resources to at most 35% of total context or 2,500 tokens
    const maxKnowledgeBudget = Math.min(2500, Math.floor(budget.maxContextTokens * 0.35));

    // Priority 1: High-precision retrieved chunks from KnowledgeRetriever
    if (context.knowledge?.chunks && context.knowledge.chunks.length > 0) {
      let currentBudget = maxKnowledgeBudget;
      const budgetedChunks = [];

      for (const chunk of context.knowledge.chunks) {
        if (currentBudget <= 0) break;
        const est = chunk.tokenEstimate || Math.ceil(chunk.content.length / 4);
        if (est <= currentBudget) {
          budgetedChunks.push(chunk);
          currentBudget -= est;
          knowledgeTokens += est;
        } else {
          // Truncate last chunk if needed
          const allowedChars = Math.max(100, currentBudget * 4);
          budgetedChunks.push({
            ...chunk,
            content: chunk.content.slice(0, allowedChars) + "\n[... truncated to fit token context]",
            tokenEstimate: currentBudget,
          });
          knowledgeTokens += currentBudget;
          currentBudget = 0;
          break;
        }
      }

      context.knowledge = {
        chunks: budgetedChunks,
      };
    } else if (context.resources?.sources && context.resources.sources.length > 0) {
      // Priority 2: Fallback to active knowledge sources
      const activeSources = context.resources.sources.filter(
        (s) => s.status === "COMPLETED" && s.content
      );

      let currentBudget = maxKnowledgeBudget;
      const budgetedSources = [];

      for (const source of activeSources) {
        if (currentBudget <= 0) break;
        const est = Math.ceil((source.content?.length ?? 0) / 4);
        if (est <= currentBudget) {
          budgetedSources.push(source);
          currentBudget -= est;
          knowledgeTokens += est;
        } else {
          // Truncate to fit remaining budget
          const allowedChars = Math.max(0, currentBudget * 4);
          const truncatedContent =
            source.content!.slice(0, allowedChars) +
            `\n\n[... content truncated to fit token context limit]`;
          budgetedSources.push({
            ...source,
            content: truncatedContent,
          });
          knowledgeTokens += currentBudget;
          currentBudget = 0;
          break;
        }
      }

      context.resources = {
        ...context.resources,
        sources: budgetedSources,
      };
    }

    // ── 6. Budget Calculation for Conversation History ──────────
    // Remaining budget for conversation = maxContext - static - knowledge - user query
    const conversationTokenLimit = Math.max(
      0,
      budget.maxContextTokens - staticTokens - knowledgeTokens - userMessageTokens
    );

    // ── 7. Select/Prune Conversation History ────────────────────
    if (context.conversation && context.conversation.messages.length > 0) {
      const originalMessages = context.conversation.messages;
      const selectedMessages = this.selector.select(
        originalMessages,
        conversationTokenLimit
      );

      context.conversation = {
        ...context.conversation,
        messages: selectedMessages,
      };
    }

    // ── 8. Calculate Final Estimated Prompt Size ────────────────
    let finalConversationTokens = 0;
    if (context.conversation?.messages) {
      for (const msg of context.conversation.messages) {
        finalConversationTokens += Math.ceil(msg.content.length / 4) + 4;
      }
    }

    const estimatedPromptTokens =
      staticTokens + knowledgeTokens + userMessageTokens + finalConversationTokens;

    return {
      context,
      metrics: {
        budget,
        estimatedPromptTokens,
        estimatedResponseTokens: budget.maxCompletionTokens,
      },
    };
  }
}
