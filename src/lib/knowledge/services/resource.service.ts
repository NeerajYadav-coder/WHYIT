import { prisma } from "@/lib/db/prisma";
import { IngestionPipeline } from "../pipelines/IngestionPipeline";
import type { ResourceInputPayload, IngestionResult } from "../types";

export class ResourceService {
  private pipeline: IngestionPipeline;

  constructor() {
    this.pipeline = new IngestionPipeline();
  }

  async createResource(payload: ResourceInputPayload): Promise<IngestionResult> {
    return this.pipeline.process(payload);
  }

  async listResources(projectId: string) {
    return prisma.knowledgeSource.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { chunks: true },
        },
        processingJobs: {
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getResourceById(id: string) {
    const resource = await prisma.knowledgeSource.findUnique({
      where: { id },
      include: {
        chunks: {
          orderBy: { position: "asc" },
        },
        processingJobs: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!resource) return null;

    return resource;
  }

  async deleteResource(id: string) {
    return prisma.knowledgeSource.delete({
      where: { id },
    });
  }

  async reprocessResource(id: string): Promise<IngestionResult> {
    return this.pipeline.reprocess(id);
  }
}

export const resourceService = new ResourceService();
