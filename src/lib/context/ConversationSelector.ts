import type { ConversationMessage } from "./types";

/**
 * Strategy interface for selecting messages from conversation history.
 * Allows switching the pruning strategy (e.g. recent vs semantic summary) later.
 */
export interface ConversationSelectionStrategy {
  /**
   * Filters and selects a subset of conversation messages to fit within
   * the specified token limit.
   */
  selectMessages(
    messages: ConversationMessage[],
    tokenLimit: number
  ): ConversationMessage[];
}

/**
 * Default Strategy: Recent Messages Selection
 *
 * Keeps the most recent messages that fit within the token limit.
 * Guaranteed to keep the last turn intact if it fits, and works backwards.
 */
export class RecentMessagesStrategy implements ConversationSelectionStrategy {
  selectMessages(
    messages: ConversationMessage[],
    tokenLimit: number
  ): ConversationMessage[] {
    if (!messages.length || tokenLimit <= 0) return [];

    const selected: ConversationMessage[] = [];
    let currentTokens = 0;

    // Start from the most recent message and work backwards
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      // Estimate token count: 1 token ~= 4 characters + 4 tokens overhead
      const msgTokens = Math.ceil(msg.content.length / 4) + 4;

      if (currentTokens + msgTokens > tokenLimit) {
        // If nothing has been selected yet and the single latest message is too large,
        // include a truncated version of the latest message so context is not completely lost
        if (selected.length === 0 && tokenLimit > 60) {
          const charLimit = (tokenLimit - 20) * 4;
          selected.unshift({
            ...msg,
            content: msg.content.slice(-charLimit) + " [earlier message context trimmed for length]",
          });
        }
        break;
      }

      selected.unshift(msg);
      currentTokens += msgTokens;
    }

    // Ensure prompt history does not start with an orphaned assistant message
    // if a preceding user message was dropped due to token limit
    if (selected.length > 1 && selected[0].role === "assistant") {
      selected.shift();
    }

    return selected;
  }
}

/**
 * Selector orchestrator using dependency injection for selection strategy.
 */
export class ConversationSelector {
  constructor(
    private strategy: ConversationSelectionStrategy = new RecentMessagesStrategy()
  ) {}

  /**
   * Selects messages from a conversation based on the current strategy and token limit.
   */
  select(messages: ConversationMessage[], tokenLimit: number): ConversationMessage[] {
    if (!messages.length) return [];
    return this.strategy.selectMessages(messages, tokenLimit);
  }
}
