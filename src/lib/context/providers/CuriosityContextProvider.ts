import type { ContextProvider, ContextRequestParams, CuriosityContextInfo } from "../types";

/**
 * CuriosityContextProvider
 *
 * Exposes the user's explored curiosities to the main conversation.
 * Since side conversations live in localStorage, they are passed forward by the client.
 */
export class CuriosityContextProvider implements ContextProvider {
  readonly key = "curiosity";

  async provide(params: ContextRequestParams): Promise<CuriosityContextInfo | undefined> {
    if (!params.curiosities || params.curiosities.length === 0) return undefined;

    return {
      threads: params.curiosities.map((c) => ({
        title: c.title,
        selectedText: c.selectedText,
        messages: c.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      })),
    };
  }
}
