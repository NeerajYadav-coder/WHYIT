import type { WhyitContext } from "./types";
import type { ChatMessage } from "@/lib/ai/types";

/**
 * PromptBuilder
 *
 * Formats the final provider payload from the constructed WhyitContext.
 *
 * Responsibilities:
 *   - Receives strongly-typed context
 *   - Formats project/goal information into system prompt
 *   - Appends message history
 *   - Appends the current user query
 *
 * Design:
 *   - Never fetches data (only formats)
 *   - No DB, API, or filesystem dependencies
 */
export class PromptBuilder {
  build(context: WhyitContext, userMessage?: string): ChatMessage[] {
    const systemPromptLines: string[] = [
      "You are Whyit, an AI learning assistant.",
    ];

    // Project Name & Context
    if (context.project) {
      systemPromptLines.push(
        `You are helping a learner with their project: "${context.project.name}"`
      );
      if (context.project.context?.trim()) {
        systemPromptLines.push(
          `Learner's Project Context:\n${context.project.context}`
        );
      }
    }

    // Goal & Motivation
    if (context.goal) {
      systemPromptLines.push(
        `Learner's Goal:\n${context.goal.goal}`,
        `Motivation (Why this matters):\n${context.goal.motivation}`
      );
    }

    // Curiosities / Side Conversations memory
    if (context.curiosity?.threads && context.curiosity.threads.length > 0) {
      const curiosityLines = [
        `## Explored Side Conversations (Curiosity Threads)`,
        `The learner has branched off to ask some side questions. Reference these if helpful to personalize explanations:`,
      ];
      for (const thread of context.curiosity.threads) {
        curiosityLines.push(
          `- On highlighted text "${thread.selectedText}":`
        );
        for (const msg of thread.messages) {
          curiosityLines.push(
            `  * ${msg.role === "user" ? "Learner asked" : "Whyit answered"}: "${msg.content}"`
          );
        }
      }
      systemPromptLines.push(curiosityLines.join("\n"));
    }

    // 1. High-precision Grounded Knowledge Chunks (from KnowledgeRetriever)
    if (context.knowledge?.chunks && context.knowledge.chunks.length > 0) {
      const knowledgeLines = [
        `## Grounded Reference Excerpts (Directly relevant to learner's current query)`,
        `The learner has uploaded technical materials to this project. The following excerpts were retrieved as the most relevant to their inquiry.`,
        `Directives:`,
        `- Ground your answers deeply in these excerpts and reference the source and section title (e.g. "[Source: Goodfellow Deep Learning | Section: 6.5]").`,
        `- Explain the foundational first principles, axioms, and intuitive mechanics underlying the excerpt.`,
        `- If the excerpts directly answer the question, prioritize their technical definitions, math, and concepts.`,
      ];

      for (const chunk of context.knowledge.chunks) {
        knowledgeLines.push(
          `\n[Source: "${chunk.sourceTitle}" (${chunk.sourceType})${chunk.sectionTitle ? ` | Section: "${chunk.sectionTitle}"` : ""}]`,
          chunk.content
        );
      }

      systemPromptLines.push(knowledgeLines.join("\n"));
    } else if (context.resources?.sources && context.resources.sources.length > 0) {
      // Fallback: General resource materials if specific chunks aren't available
      const activeSources = context.resources.sources.filter(
        (s) => s.status === "COMPLETED" && s.content
      );
      if (activeSources.length > 0) {
        const resourceLines = [
          `## Learner's Uploaded Knowledge Sources & Reference Materials`,
          `The learner has provided the following knowledge sources/reference materials for this project. Ground your answers directly in these resources when answering their questions or when they refer to "my resources", "given video", "my notes", "this paper", etc.:`,
        ];

        for (const source of activeSources) {
          resourceLines.push(
            `\n### Source: "${source.title}" (Type: ${source.type}, ${source.wordCount} words)`,
            `Content:`,
            source.content!
          );
        }

        systemPromptLines.push(resourceLines.join("\n"));
      }
    }

    // Static AI Persona Rules (complements Prompt Architecture)
    systemPromptLines.push(
      `## Response Guidelines`,
      `- Be clear, precise, and intellectually honest.`,
      `- Match the learner's level — do not condescend or oversimplify.`,
      `- Ask one focused clarifying question when you genuinely need more information.`,
      `- Prefer concrete examples over abstract explanations.`,
      `- Acknowledge uncertainty when it exists.`,
      `- Stay focused on their learning goal. Do not add unsolicited recommendations.`,
      `- Format responses with markdown when it aids clarity (code blocks, numbered steps, bold key terms).`,
      `- Keep responses appropriately concise. Do not pad.`
    );

    const payload: ChatMessage[] = [
      { role: "system", content: systemPromptLines.join("\n\n") },
    ];

    // Append conversation messages
    if (context.conversation?.messages) {
      for (const msg of context.conversation.messages) {
        payload.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Append current turn
    if (userMessage) {
      payload.push({
        role: "user",
        content: userMessage,
      });
    }

    return payload;
  }
}
