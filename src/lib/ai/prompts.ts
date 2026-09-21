/**
 * System Prompt Builder
 *
 * Centralized, composable prompt construction.
 * No prompt strings live in API routes or components.
 *
 * Future engines (Memory, Learning, Resources) will add context
 * sections here without touching the AI provider or route layer.
 */

export interface ProjectContext {
  name: string;
  goal: string;
  motivation: string;
  context?: string;
}

/**
 * Builds the base system prompt for a project conversation.
 *
 * Injects: project name, goal, motivation, optional context.
 * Does NOT inject: memory, resources, progress — those are Sprint 4+.
 */
export function buildSystemPrompt(project: ProjectContext): string {
  const lines: string[] = [
    `You are Whyit, an AI learning assistant.`,
    ``,
    `You are helping a learner with their project: "${project.name}"`,
    ``,
    `Their goal:`,
    project.goal,
    ``,
    `Why this matters to them:`,
    project.motivation,
  ];

  if (project.context?.trim()) {
    lines.push(``, `Additional context they shared:`, project.context);
  }

  lines.push(
    ``,
    `## How to respond`,
    `- Be clear, precise, and intellectually honest.`,
    `- Match the learner's level — do not condescend or oversimplify.`,
    `- Ask one focused clarifying question when you genuinely need more information.`,
    `- Prefer concrete examples over abstract explanations.`,
    `- Acknowledge uncertainty when it exists.`,
    `- Stay focused on their learning goal. Do not add unsolicited recommendations.`,
    `- Format responses with markdown when it aids clarity (code blocks, numbered steps, bold key terms).`,
    `- Keep responses appropriately concise. Do not pad.`
  );

  return lines.join("\n");
}
