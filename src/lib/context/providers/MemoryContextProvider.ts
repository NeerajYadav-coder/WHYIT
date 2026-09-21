import type { ContextProvider, MemoryContextInfo } from "../types";

/** Placeholder for Sprint 5 memory system integration */
export class MemoryContextProvider implements ContextProvider {
  readonly key = "memory";

  async provide(): Promise<MemoryContextInfo | undefined> {
    return undefined;
  }
}
