import type { ContextProvider, ContextRequestParams, GoalContextInfo } from "../types";
import { projectRepository } from "@/lib/repositories/project.repository";

export class GoalContextProvider implements ContextProvider {
  readonly key = "goal";

  async provide(params: ContextRequestParams): Promise<GoalContextInfo | undefined> {
    const project = await projectRepository.findById(params.projectId);
    if (!project) return undefined;

    return {
      goal: project.goal,
      motivation: project.motivation,
    };
  }
}
