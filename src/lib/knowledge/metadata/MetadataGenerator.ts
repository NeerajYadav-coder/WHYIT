import type { ResourceType, ExtractedContent, NormalizedContent } from "../types";

export interface KnowledgeMetadataOutput {
  title: string;
  author?: string;
  sourceUrl?: string;
  uploadDate: string;
  language: string;
  wordCount: number;
  tokenEstimate: number;
  documentType: ResourceType;
  headings: string[];
  codeBlockCount: number;
  customMetadata?: Record<string, unknown>;
}

export class MetadataGenerator {
  generate(
    type: ResourceType,
    extracted: ExtractedContent,
    normalized: NormalizedContent
  ): KnowledgeMetadataOutput {
    return {
      title: extracted.title || "Untitled Knowledge Source",
      author: extracted.author || (extracted.metadata.author as string) || undefined,
      sourceUrl: extracted.sourceUrl,
      uploadDate: new Date().toISOString(),
      language: "en", // Default ISO language code
      wordCount: normalized.wordCount,
      tokenEstimate: normalized.tokenEstimate,
      documentType: type,
      headings: normalized.headings,
      codeBlockCount: normalized.codeBlockCount,
      customMetadata: extracted.metadata,
    };
  }
}
