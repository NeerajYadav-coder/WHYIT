/**
 * Conversation Service
 *
 * All business logic for the conversation engine lives here.
 * This service is the ONLY consumer of repositories and AI provider.
 * API routes call this — they never touch Prisma or the AI provider directly.
 *
 * Streaming contract:
 *   - User message is persisted BEFORE streaming starts.
 *   - Assistant message is persisted ONLY after streaming completes successfully.
 *   - A failed/aborted stream never produces a partial message in the DB.
 */

import { conversationRepository } from "@/lib/repositories/conversation.repository";
import { projectRepository } from "@/lib/repositories/project.repository";
import { workspaceRepository } from "@/lib/repositories/workspace.repository";
import { getAIProvider } from "@/lib/ai/factory";
import { PromptService } from "./prompt.service";

export const conversationService = {
  /**
   * Get or create the active conversation for a project.
   * If no conversation exists, creates one automatically.
   */
  async getOrCreateConversation(projectId: string) {
    const existing = await conversationRepository.findByProject(projectId);
    if (existing) return existing;
    return conversationRepository.create(projectId);
  },

  /**
   * Fetch conversation with messages for display.
   */
  async getConversation(conversationId: string) {
    return conversationRepository.findById(conversationId);
  },

  /**
   * Create a new project and its first conversation.
   * Returns both so the client can navigate immediately.
   */
  async createProject(data: {
    name: string;
    goal: string;
    motivation: string;
    context?: string;
  }) {
    const workspace = await workspaceRepository.getOrCreateDefault();

    const project = await projectRepository.create({
      workspaceId: workspace.id,
      ...data,
    });

    // Create an empty conversation so the workspace page always has one
    const conversation = await conversationRepository.create(project.id);

    return { project, conversation };
  },

  /**
   * List all projects for the default workspace.
   */
  async listProjects() {
    const workspace = await workspaceRepository.getOrCreateDefault();
    return projectRepository.findByWorkspace(workspace.id);
  },

  /**
   * Get a single project by ID, including its conversation IDs.
   */
  async getProject(projectId: string) {
    return projectRepository.findById(projectId);
  },

  /**
   * Core streaming method.
   *
   * 1. Validates the project + conversation exist and are related.
   * 2. Persists the user message immediately.
   * 3. Builds the full message history for the AI.
   * 4. Streams the AI response as an async generator.
   * 5. Caller must call onComplete(fullContent) when done to persist the
   *    assistant message — this keeps persistence out of the stream loop.
   *
   * @returns An object with { stream, onComplete }
   */
  async prepareChat(opts: {
    projectId: string;
    conversationId: string;
    userMessage: string;
    curiosities?: {
      title: string;
      selectedText: string;
      messages: { role: "user" | "assistant"; content: string }[];
    }[];
    signal?: AbortSignal;
  }) {
    const { projectId, conversationId, userMessage, curiosities, signal } = opts;

    // Validate project + conversation exist
    const [project, conversation] = await Promise.all([
      projectRepository.findById(projectId),
      conversationRepository.findById(conversationId),
    ]);

    if (!project) throw new ServiceError("Project not found", 404);
    if (!conversation) throw new ServiceError("Conversation not found", 404);
    if (conversation.projectId !== projectId) {
      throw new ServiceError("Conversation does not belong to this project", 403);
    }

    // 1. Use the central PromptService to assemble context, enforce token budgeting, and construct the final messages payload.
    const promptService = new PromptService();
    const { messages: aiMessages, metrics, hasMemory } = await promptService.preparePrompt({
      projectId,
      conversationId,
      userMessage,
      curiosities,
    });

    // 2. Persist user message immediately (before streaming begins)
    await conversationRepository.addMessage({
      conversationId,
      role: "USER",
      content: userMessage,
    });

    const provider = getAIProvider();
    const stream = provider.streamChat({ messages: aiMessages, signal });

    /**
     * Call this after streaming completes to persist the assistant response.
     * Never call this if streaming failed or was aborted.
     */
    async function onComplete(fullContent: string) {
      await conversationRepository.addMessage({
        conversationId,
        role: "ASSISTANT",
        content: fullContent,
        metadata: hasMemory ? { usesMemory: true } : undefined,
      });
    }

    return { stream, onComplete, metrics, hasMemory };
  },

  /**
   * Prepare an ephemeral curiosity branch response.
   * Feeds context from the main conversation and blends 60% intent + 40% storytelling/history.
   */
  async prepareCuriosityChat(opts: {
    selectedText: string;
    surroundingContext?: string;
    sectionHeading?: string;
    projectId?: string;
    conversationId?: string;
    messages: { role: "user" | "assistant"; content: string }[];
    signal?: AbortSignal;
  }) {
    const {
      selectedText,
      surroundingContext,
      sectionHeading,
      conversationId,
      messages,
      signal,
    } = opts;

    let mainChatHistory = "";
    if (conversationId) {
      try {
        const conv = await conversationRepository.findById(conversationId);
        if (conv && conv.messages.length > 0) {
          const recent = conv.messages.slice(-8);
          mainChatHistory = recent
            .map((m) => `${m.role === "USER" ? "Learner" : "Whyit"}: ${m.content}`)
            .join("\n");
        }
      } catch (err) {
        console.warn("[conversationService.prepareCuriosityChat] Context fetch error:", err);
      }
    }

    const promptLines = [
      `You are Whyit, a learning assistant answering a learner's curiosity question inside a side-conversation popup.`,
      `The learner highlighted the following text in their lesson: "${selectedText}"`,
    ];

    if (sectionHeading) {
      promptLines.push(`Under the section heading: "${sectionHeading}"`);
    }
    if (surroundingContext) {
      promptLines.push(`Surrounding context from the lesson:\n"${surroundingContext}"`);
    }

    if (mainChatHistory) {
      promptLines.push(
        `## Main Chat History Context`,
        `Here is what you and the learner have been discussing in the main chat room. Use this for style reference and continuity:`,
        `"""`,
        mainChatHistory,
        `"""`
      );
    }

    promptLines.push(
      `## Response Persona & Blended Style Guidelines`,
      `You must answer by blending your response style as follows:`,
      `- 40% Default Storyteller/Historical Style:`,
      `  * Provide a "touch of history" (contextual origins, how the idea was discovered, named, or what real-world problem it originally tried to solve).`,
      `  * Explain in a story-like way, going deeply into the "why" rather than just mechanical facts.`,
      `  * Avoid heavy technical terms without explaining them in simple terms first.`,
      `  * Use simple human analogies and real-world intuition.`,
      `- 60% Intent Adaptive Style:`,
      `  * Directly address the learner's specific question, match their tone, and satisfy their curiosity about the highlighted text.`,
      `  * Keep your answer focused without excessive fluff.`
    );

    const chatMessages = [
      { role: "system" as const, content: promptLines.join("\n\n") },
      ...messages,
    ];

    const provider = getAIProvider();
    return provider.streamChat({
      messages: chatMessages,
      signal,
      temperature: 0.6,
    });
  },
};

/** Structured error for service-layer failures */
export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
