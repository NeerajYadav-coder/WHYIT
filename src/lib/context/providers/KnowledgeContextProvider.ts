import type { ContextProvider, ContextRequestParams, KnowledgeContextInfo } from "../types";
import { knowledgeRetriever } from "@/lib/knowledge/retrieval/KnowledgeRetriever";

/**
 * KnowledgeContextProvider
 *
 * Provides the most relevant knowledge chunks for the active project
 * and user query using intelligent keyword/heading scoring.
 */
export class KnowledgeContextProvider implements ContextProvider {
  readonly key = "knowledge";

  async provide(params: ContextRequestParams): Promise<KnowledgeContextInfo | undefined> {
    if (!params.projectId) return undefined;

    try {
      const chunks = await knowledgeRetriever.retrieveRelevantChunks({
        projectId: params.projectId,
        query: params.userMessage,
        maxChunks: 4,
        maxTokens: 2200,
      });

      if (!chunks || chunks.length === 0) return undefined;

      return {
        chunks,
      };
    } catch (err) {
      console.error("[KnowledgeContextProvider] Retrieval error:", err);
      return undefined;
    }
  }
}
