import type { Extractor } from "./Extractor";
import type { ResourceInputPayload, ExtractionResult, ResourceType } from "../types";

export class BookExtractor implements Extractor {
  readonly supportedTypes: ResourceType[] = ["BOOK", "RESEARCH_PAPER"];

  canHandle(type: ResourceType): boolean {
    return this.supportedTypes.includes(type);
  }

  async extract(payload: ResourceInputPayload): Promise<ExtractionResult> {
    const author = (payload.metadata?.author as string) || "Unknown Author";
    const isbn = (payload.metadata?.isbn as string) || undefined;
    const summary = payload.content || "Structured book reference metadata.";

    const contentSummary = [
      `# Book: ${payload.title}`,
      `Author: ${author}`,
      isbn ? `ISBN: ${isbn}` : "",
      ``,
      `## Summary & Notes`,
      summary,
    ].filter(Boolean).join("\n");

    return {
      success: true,
      content: {
        rawContent: contentSummary,
        title: payload.title,
        author,
        metadata: {
          format: payload.type.toLowerCase(),
          author,
          isbn: isbn ?? null,
          ...payload.metadata,
        },
      },
    };
  }
}
