import type { ContextProvider, ContextRequestParams, ConversationContextInfo } from "../types";
import { conversationRepository } from "@/lib/repositories/conversation.repository";

export class ConversationContextProvider implements ContextProvider {
  readonly key = "conversation";

  async provide(params: ContextRequestParams): Promise<ConversationContextInfo | undefined> {
    const conversationId = params.conversationId;
    if (!conversationId) return undefined;

    const conversation = await conversationRepository.findById(conversationId);
    if (!conversation) return undefined;

    return {
      conversationId: conversation.id,
      messages: conversation.messages.map((m) => ({
        role: m.role.toLowerCase() as "user" | "assistant" | "system",
        content: m.content,
      })),
    };
  }
}
