import { prisma } from "@/lib/db/prisma";
import type { ContextProvider, ContextRequestParams, MemoryContextInfo } from "../types";

/**
 * MemoryContextProvider
 *
 * Surfaces the student's established axioms and mastered concepts from
 * PostgreSQL into active prompt context so the AI remembers prior epiphanies.
 */
export class MemoryContextProvider implements ContextProvider {
  readonly key = "memory";

  async provide(params: ContextRequestParams): Promise<MemoryContextInfo | undefined> {
    if (!params.projectId || params.projectId === "default") return undefined;

    try {
      const axioms = await prisma.learningAxiom.findMany({
        where: { projectId: params.projectId },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        take: 8,
      });

      if (!axioms || axioms.length === 0) return undefined;

      return {
        axioms: axioms.map((a) => ({
          id: a.id,
          statement: a.statement,
          formula: a.formula,
          category: a.category,
          status: a.status as "DISCOVERED" | "IN_PROGRESS" | "MASTERED",
          pinned: a.pinned,
        })),
      };
    } catch (err) {
      console.error("[MemoryContextProvider] Error fetching axioms:", err);
      return undefined;
    }
  }
}
