/**
 * Knowledge Ingestion Engine Types (Sprint 5)
 *
 * Strongly typed contracts for resources, extractors, normalizers, chunkers, and pipelines.
 * Never use 'any'.
 */

export type ResourceType =
  | "PDF"
  | "MARKDOWN"
  | "TEXT"
  | "URL"
  | "YOUTUBE"
  | "BOOK"
  | "AUDIO"
  | "VIDEO"
  | "RESEARCH_PAPER"
  | "GITHUB_REPO"
  | "DOCUMENTATION_SITE";

export type ProcessingStatus =
  | "QUEUED"
  | "EXTRACTING"
  | "NORMALIZING"
  | "CHUNKING"
  | "COMPLETED"
  | "FAILED";

export interface ResourceInputPayload {
  projectId: string;
  title: string;
  type: ResourceType;
  content?: string;       // Raw text or markdown string
  sourceUrl?: string;     // URL or YouTube URL
  fileBuffer?: Buffer;    // File buffer for uploaded PDF/TXT
  filePath?: string;      // Storage path if file saved on disk
  metadata?: Record<string, unknown>;
}

export interface ExtractedContent {
  rawContent: string;
  title?: string;
  author?: string;
  sourceUrl?: string;
  metadata: Record<string, unknown>;
}

export interface ExtractionResult {
  success: boolean;
  content?: ExtractedContent;
  error?: string;
}

export interface NormalizedContent {
  text: string;
  headings: string[];
  codeBlockCount: number;
  wordCount: number;
  tokenEstimate: number;
}

export interface KnowledgeChunkInput {
  position: number;
  sectionTitle?: string;
  content: string;
  tokenEstimate: number;
  wordCount: number;
}

export interface ChunkerOptions {
  maxChunkSizeTokens?: number; // Default: 500 (~2000 chars)
  overlapTokens?: number;      // Default: 50 (~200 chars)
  preserveHeadings?: boolean;
}

export interface IngestionResult {
  sourceId: string;
  status: ProcessingStatus;
  chunkCount: number;
  wordCount: number;
  tokenEstimate: number;
  error?: string;
}
