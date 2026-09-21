import type { ContextProvider, ContextRequestParams, ProjectContextInfo } from "../types";
import { projectRepository } from "@/lib/repositories/project.repository";

export class ProjectContextProvider implements ContextProvider {
  readonly key = "project";

  async provide(params: ContextRequestParams): Promise<ProjectContextInfo | undefined> {
    const project = await projectRepository.findById(params.projectId);
    if (!project) return undefined;

    return {
      id: project.id,
      name: project.name,
      context: project.context,
    };
  }
}
