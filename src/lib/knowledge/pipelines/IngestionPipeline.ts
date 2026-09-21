import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import type { ResourceInputPayload, IngestionResult } from "../types";
import { ExtractorRegistry } from "../extractors/ExtractorRegistry";
import { TextNormalizer } from "../normalizers/TextNormalizer";
import { HeadingAwareChunker } from "../chunkers/HeadingAwareChunker";
import { MetadataGenerator } from "../metadata/MetadataGenerator";

export class IngestionPipeline {
  private registry: ExtractorRegistry;
  private normalizer: TextNormalizer;
  private chunker: HeadingAwareChunker;
  private metadataGen: MetadataGenerator;

  constructor() {
    this.registry = new ExtractorRegistry();
    this.normalizer = new TextNormalizer();
    this.chunker = new HeadingAwareChunker();
    this.metadataGen = new MetadataGenerator();
  }

  /**
   * Executes the full standard ingestion pipeline asynchronously:
   * Receive -> Validate -> Extract -> Normalize -> Metadata -> Chunk -> Store -> Register
   */
  async process(payload: ResourceInputPayload): Promise<IngestionResult> {
    // ── 0. Ensure Project exists in PostgreSQL ─────────────────
    const existingProject = await prisma.project.findUnique({
      where: { id: payload.projectId },
    });

    if (!existingProject) {
      let workspace = await prisma.workspace.findFirst();
      if (!workspace) {
        let user = await prisma.user.findFirst();
        if (!user) {
          user = await prisma.user.create({
            data: { email: "default@whyit.ai", name: "Default User" },
          });
        }
        workspace = await prisma.workspace.create({
          data: { name: "Personal Workspace", userId: user.id },
        });
      }

      await prisma.project.create({
        data: {
          id: payload.projectId,
          name: "Learning Workspace",
          goal: "Explore & Learn Knowledge",
          motivation: "Self-driven discovery",
          workspaceId: workspace.id,
        },
      });
    }

    // ── 1. Create KnowledgeSource record in DB ──────────────────
    const source = await prisma.knowledgeSource.create({
      data: {
        projectId: payload.projectId,
        title: payload.title || "New Knowledge Source",
        type: payload.type,
        status: "QUEUED",
        sourceUrl: payload.sourceUrl ?? null,
        filePath: payload.filePath ?? null,
      },
    });

    const sourceId = source.id;

    // ── 2. Create initial ProcessingJob record ─────────────────
    const job = await prisma.processingJob.create({
      data: {
        sourceId,
        stage: "EXTRACTING",
        startedAt: new Date(),
      },
    });

    try {
      // ── Stage A: Extract Content ──────────────────────────────
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: "EXTRACTING" },
      });

      const extractor = this.registry.getExtractor(payload.type);
      const extractResult = await extractor.extract(payload);

      if (!extractResult.success || !extractResult.content) {
        throw new Error(extractResult.error || "Content extraction failed.");
      }

      const extracted = extractResult.content;

      // ── Stage B: Normalize Text ───────────────────────────────
      await prisma.processingJob.update({
        where: { id: job.id },
        data: { stage: "NORMALIZING" },
      });

      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: "NORMALIZING" },
      });

      const normalized = this.normalizer.normalize(extracted.rawContent);

      // ── Stage C: Generate Metadata ────────────────────────────
      const metadata = this.metadataGen.generate(payload.type, extracted, normalized);

      // ── Stage D: Chunking ─────────────────────────────────────
      await prisma.processingJob.update({
        where: { id: job.id },
        data: { stage: "CHUNKING" },
      });

      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: "CHUNKING" },
      });

      const chunks = this.chunker.chunk(normalized.text);

      // ── Stage E: Store & Register in Database ─────────────────
      if (chunks.length > 0) {
        await prisma.knowledgeChunk.createMany({
          data: chunks.map((c) => ({
            sourceId,
            position: c.position,
            sectionTitle: c.sectionTitle ?? null,
            content: c.content,
            tokenEstimate: c.tokenEstimate,
          })),
        });
      }

      // Update KnowledgeSource to COMPLETED
      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: {
          title: metadata.title,
          status: "COMPLETED",
          rawContent: extracted.rawContent,
          normalizedText: normalized.text,
          metadata: metadata as unknown as Prisma.InputJsonValue,
          wordCount: normalized.wordCount,
          tokenEstimate: normalized.tokenEstimate,
        },
      });

      // Update ProcessingJob to COMPLETED
      await prisma.processingJob.update({
        where: { id: job.id },
        data: {
          stage: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return {
        sourceId,
        status: "COMPLETED",
        chunkCount: chunks.length,
        wordCount: normalized.wordCount,
        tokenEstimate: normalized.tokenEstimate,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ingestion processing failed";

      await prisma.knowledgeSource.update({
        where: { id: sourceId },
        data: { status: "FAILED" },
      }).catch(() => {});

      await prisma.processingJob.update({
        where: { id: job.id },
        data: {
          stage: "FAILED",
          error: errorMessage,
          completedAt: new Date(),
        },
      }).catch(() => {});

      return {
        sourceId,
        status: "FAILED",
        chunkCount: 0,
        wordCount: 0,
        tokenEstimate: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Reprocess an existing knowledge source
   */
  async reprocess(sourceId: string): Promise<IngestionResult> {
    const existing = await prisma.knowledgeSource.findUnique({
      where: { id: sourceId },
    });

    if (!existing) {
      throw new Error(`Knowledge source with ID ${sourceId} not found.`);
    }

    // Clear existing chunks and jobs
    await prisma.knowledgeChunk.deleteMany({ where: { sourceId } });

    return this.process({
      projectId: existing.projectId,
      title: existing.title,
      type: existing.type as unknown as ResourceInputPayload["type"],
      content: existing.rawContent || undefined,
      sourceUrl: existing.sourceUrl || undefined,
    });
  }
}
