/**
 * Workspace Repository
 *
 * Sprint 3: A "default" workspace is used for all projects
 * since auth is not yet implemented.
 *
 * When auth lands: replace getOrCreateDefault with a proper
 * findByUserId call using the authenticated user's session.
 */

import { prisma } from "@/lib/db/prisma";
import type { Workspace } from "@prisma/client";

const DEFAULT_WORKSPACE_ID = "workspace-default";
const DEFAULT_USER_ID = "user-default";

export const workspaceRepository = {
  /**
   * Returns the default workspace, creating it (and a stub user) if needed.
   * Auth-safe: when real auth lands, replace the body with a session lookup.
   */
  async getOrCreateDefault(): Promise<Workspace> {
    // Ensure the stub user exists
    await prisma.user.upsert({
      where: { id: DEFAULT_USER_ID },
      update: {},
      create: {
        id: DEFAULT_USER_ID,
        email: "default@whyit.local",
        name: "Default User",
      },
    });

    return prisma.workspace.upsert({
      where: { id: DEFAULT_WORKSPACE_ID },
      update: {},
      create: {
        id: DEFAULT_WORKSPACE_ID,
        name: "My Workspace",
        userId: DEFAULT_USER_ID,
      },
    });
  },

  async findById(id: string): Promise<Workspace | null> {
    return prisma.workspace.findUnique({ where: { id } });
  },
};
