import type { ContextProvider, ContextRequestParams, ResourceContextInfo } from "../types";
import { resourceService } from "@/lib/knowledge/services/resource.service";

/**
 * Strips raw PDF binary stream tokens (/FlateDecode, obj, endstream) if present
 * in legacy or raw database records before passing context to the AI.
 */
function sanitizeResourceContent(rawText: string | null | undefined): string | undefined {
  if (!rawText || !rawText.trim()) return undefined;

  let text = rawText;
  if (
    text.includes("/FlateDecode") ||
    text.includes("/Filter") ||
    text.includes("endstream") ||
    text.includes("%PDF")
  ) {
    const lines = text.split("\n");
    const cleanLines = lines.filter((line) => {
      const t = line.trim();
      if (!t) return false;
      if (
        t.includes("/FlateDecode") ||
        t.includes("/Filter") ||
        t.includes("endstream") ||
        t.includes("endobj")
      ) {
        return false;
      }
      if (/^\d+\s+\d+\s+obj/.test(t) || /^<<.*>>$/.test(t) || t.startsWith("stream") || t.startsWith("xref")) {
        return false;
      }
      const printable = (t.match(/[a-zA-Z0-9\s.,!?:;\-()"]/g) || []).length;
      if (t.length > 8 && printable / t.length < 0.5) return false;
      return true;
    });
    text = cleanLines.join("\n").trim();
  }

  return text || undefined;
}

/**
 * ResourceContextProvider (Sprint 5)
 *
 * Registers completed knowledge sources for the active project.
 */
export class ResourceContextProvider implements ContextProvider {
  readonly key = "resources";

  async provide(params: ContextRequestParams): Promise<ResourceContextInfo | undefined> {
    if (!params.projectId) return undefined;

    try {
      const resources = await resourceService.listResources(params.projectId);
      if (!resources || resources.length === 0) return undefined;

      return {
        sources: resources.map(
          (r: {
            id: string;
            title: string;
            type: string;
            status: string;
            wordCount: number;
            tokenEstimate: number;
            normalizedText?: string | null;
            rawContent?: string | null;
          }) => ({
            id: r.id,
            title: r.title,
            type: r.type,
            status: r.status,
            wordCount: r.wordCount,
            tokenEstimate: r.tokenEstimate,
            content: sanitizeResourceContent(r.normalizedText || r.rawContent),
          })
        ),
      };
    } catch {
      return undefined;
    }
  }
}
