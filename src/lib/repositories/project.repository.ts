/**
 * Project Repository
 *
 * All database access for Projects lives here.
 * Services call this — API routes never query Prisma directly.
 */

import { prisma } from "@/lib/db/prisma";
import type { Project, Conversation } from "@prisma/client";

export type ProjectWithConversation = Project & {
  conversations: Pick<Conversation, "id">[];
};

export const projectRepository = {
  /** Find a project by ID, including its conversation IDs */
  async findById(id: string): Promise<ProjectWithConversation | null> {
    return prisma.project.findUnique({
      where: { id },
      include: { conversations: { select: { id: true } } },
    });
  },

  /** List all projects for a workspace, newest first */
  async findByWorkspace(workspaceId: string): Promise<Project[]> {
    return prisma.project.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Create a new project under a workspace */
  async create(data: {
    workspaceId: string;
    name: string;
    goal: string;
    motivation: string;
    context?: string;
  }): Promise<Project> {
    return prisma.project.create({ data });
  },

  /** Update a project's name */
  async updateName(id: string, name: string): Promise<Project> {
    return prisma.project.update({ where: { id }, data: { name } });
  },
};
