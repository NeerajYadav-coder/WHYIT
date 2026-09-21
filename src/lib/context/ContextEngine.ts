import type { WhyitContext, ContextProvider, ContextRequestParams } from "./types";
import { ProjectContextProvider } from "./providers/ProjectContextProvider";
import { GoalContextProvider } from "./providers/GoalContextProvider";
import { ConversationContextProvider } from "./providers/ConversationContextProvider";
import { MemoryContextProvider } from "./providers/MemoryContextProvider";
import { ProgressContextProvider } from "./providers/ProgressContextProvider";
import { ResourceContextProvider } from "./providers/ResourceContextProvider";
import { KnowledgeContextProvider } from "./providers/KnowledgeContextProvider";
import { CuriosityContextProvider } from "./providers/CuriosityContextProvider";

/**
 * ContextEngine
 *
 * Orchestrates and merges context fragments from independent, modular providers.
 *
 * Principles:
 *   - Modular: providers do not know about each other.
 *   - Pluggable: new providers (e.g. Memory, Progress) can be registered with zero schema changes.
 *   - Strongly-typed: no 'any' types in the pipeline.
 */
export class ContextEngine {
  private providers: ContextProvider[];

  constructor(providers?: ContextProvider[]) {
    // Default fallback list of active and future stub providers
    this.providers = providers ?? [
      new ProjectContextProvider(),
      new GoalContextProvider(),
      new ConversationContextProvider(),
      new MemoryContextProvider(),
      new ProgressContextProvider(),
      new ResourceContextProvider(),
      new KnowledgeContextProvider(),
      new CuriosityContextProvider(),
    ];
  }

  /**
   * Assembles the complete context object by calling all registered providers in parallel.
   */
  async assembleContext(params: ContextRequestParams): Promise<WhyitContext> {
    const context: WhyitContext = {};

    const results = await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const fragment = await provider.provide(params);
          return { key: provider.key, fragment };
        } catch (err) {
          console.error(`[ContextEngine] Provider "${provider.key}" failed:`, err);
          return { key: provider.key, fragment: undefined };
        }
      })
    );

    for (const result of results) {
      if (result.fragment !== undefined) {
        // Safe type mapping via dynamic key matching
        (context as Record<string, unknown>)[result.key] = result.fragment;
      }
    }

    return context;
  }
}
