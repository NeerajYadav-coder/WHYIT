import type { Extractor } from "./Extractor";
import type { ResourceInputPayload, ExtractionResult, ResourceType } from "../types";

export class MarkdownExtractor implements Extractor {
  readonly supportedTypes: ResourceType[] = ["MARKDOWN"];

  canHandle(type: ResourceType): boolean {
    return this.supportedTypes.includes(type);
  }

  async extract(payload: ResourceInputPayload): Promise<ExtractionResult> {
    try {
      let rawContent = payload.content ?? "";
      if (!rawContent && payload.fileBuffer) {
        rawContent = payload.fileBuffer.toString("utf-8");
      }

      if (!rawContent.trim()) {
        return {
          success: false,
          error: "Markdown content is empty.",
        };
      }

      // Extract title from first H1 `# Title` if available
      let derivedTitle = payload.title;
      const h1Match = rawContent.match(/^#\s+(.+)$/m);
      if (h1Match && h1Match[1]) {
        derivedTitle = h1Match[1].trim();
      }

      // Count code blocks and headers
      const headerMatches = rawContent.match(/^#{1,6}\s+.+$/gm) || [];
      const codeBlockMatches = rawContent.match(/```[\s\S]*?```/g) || [];

      return {
        success: true,
        content: {
          rawContent,
          title: derivedTitle,
          metadata: {
            format: "markdown",
            headerCount: headerMatches.length,
            codeBlockCount: codeBlockMatches.length,
            ...payload.metadata,
          },
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to extract markdown content",
      };
    }
  }
}
