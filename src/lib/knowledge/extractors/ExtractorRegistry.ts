import type { Extractor } from "./Extractor";
import type { ResourceType } from "../types";
import { TextExtractor } from "./TextExtractor";
import { MarkdownExtractor } from "./MarkdownExtractor";
import { PDFExtractor } from "./PDFExtractor";
import { URLExtractor } from "./URLExtractor";
import { YouTubeExtractor } from "./YouTubeExtractor";
import { BookExtractor } from "./BookExtractor";

export class ExtractorRegistry {
  private extractors: Extractor[];

  constructor(customExtractors?: Extractor[]) {
    this.extractors = customExtractors ?? [
      new TextExtractor(),
      new MarkdownExtractor(),
      new PDFExtractor(),
      new URLExtractor(),
      new YouTubeExtractor(),
      new BookExtractor(),
    ];
  }

  getExtractor(type: ResourceType): Extractor {
    const found = this.extractors.find((ext) => ext.canHandle(type));
    if (!found) {
      // Default to TextExtractor fallback
      return new TextExtractor();
    }
    return found;
  }
}
