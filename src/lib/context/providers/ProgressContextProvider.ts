import type { ContextProvider, ProgressContextInfo } from "../types";

/** Placeholder for Sprint 5 progress tracking integration */
export class ProgressContextProvider implements ContextProvider {
  readonly key = "progress";

  async provide(): Promise<ProgressContextInfo | undefined> {
    return undefined;
  }
}
