import type { Extractor } from "./Extractor";
import type { ResourceInputPayload, ExtractionResult, ResourceType } from "../types";

export class TextExtractor implements Extractor {
  readonly supportedTypes: ResourceType[] = ["TEXT"];

  canHandle(type: ResourceType): boolean {
    return this.supportedTypes.includes(type);
  }

  async extract(payload: ResourceInputPayload): Promise<ExtractionResult> {
    try {
      let content = payload.content ?? "";
      if (!content && payload.fileBuffer) {
        content = payload.fileBuffer.toString("utf-8");
      }

      if (!content.trim()) {
        return {
          success: false,
          error: "Text content is empty.",
        };
      }

      return {
        success: true,
        content: {
          rawContent: content,
          title: payload.title,
          metadata: {
            source: "text_upload",
            length: content.length,
            ...payload.metadata,
          },
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to extract text content",
      };
    }
  }
}
