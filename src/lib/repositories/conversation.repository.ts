/**
 * Conversation Repository
 *
 * All database access for Conversations and Messages lives here.
 */

import { prisma } from "@/lib/db/prisma";
import type { Conversation, Message, MessageRole, MessageStatus } from "@prisma/client";

export type ConversationWithMessages = Conversation & {
  messages: Message[];
};

export const conversationRepository = {
  /** Find a conversation with all its messages, ordered chronologically */
  async findById(id: string): Promise<ConversationWithMessages | null> {
    return prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  /** Find the active conversation for a project (most recently updated) */
  async findByProject(projectId: string): Promise<ConversationWithMessages | null> {
    return prisma.conversation.findFirst({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  },

  /** Get just the messages for a conversation (for AI context injection) */
  async getMessages(conversationId: string): Promise<Message[]> {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  },

  /** Create a new conversation for a project */
  async create(projectId: string): Promise<Conversation> {
    return prisma.conversation.create({ data: { projectId } });
  },

  /** Append a user message — returns the saved message */
  async addMessage(data: {
    conversationId: string;
    role: MessageRole;
    content: string;
    tokenCount?: number;
    metadata?: Record<string, unknown>;
    status?: MessageStatus;
  }): Promise<Message> {
    const { conversationId, role, content, tokenCount, metadata, status } = data;

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          role,
          content,
          tokenCount: tokenCount ?? null,
          metadata: metadata ? (metadata as object) : undefined,
          status: status ?? "COMPLETE",
        },
      }),
      // Touch conversation.updatedAt so findByProject sorts correctly
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  },
};
