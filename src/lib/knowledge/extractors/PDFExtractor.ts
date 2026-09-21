import type { Extractor } from "./Extractor";
import type { ResourceInputPayload, ExtractionResult, ResourceType } from "../types";
import { extractText } from "unpdf";

/**
 * Filter out raw PDF stream binary markers and non-text objects
 * without corrupting Unicode scripts (Hindi, etc.) or mathematical formulas.
 */
function cleanPDFStreamNoise(rawText: string): string {
  if (!rawText) return "";
  const lines = rawText.split("\n");
  const filtered = lines.filter((line) => {
    const t = line.trim();
    if (!t) return false;

    // Filter PDF structure operators and internal stream markers
    if (
      t.includes("/FlateDecode") ||
      t.includes("/Filter") ||
      t.includes("/Length ") ||
      t.includes("/Catalog") ||
      t.includes("/Pages") ||
      t.includes("endstream") ||
      t.includes("endobj") ||
      t.startsWith("stream") ||
      t.startsWith("xref") ||
      t.startsWith("trailer") ||
      t.startsWith("startxref") ||
      /^\d+\s+\d+\s+obj/.test(t) ||
      /^<<.*>>$/.test(t)
    ) {
      return false;
    }

    // Binary / non-printable control character check (null bytes and low controls)
    // Preserves all Unicode letters (\p{L}), numbers (\p{N}), math symbols (\p{S}), punctuation (\p{P})
    const controlChars = (t.match(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g) || []).length;
    if (controlChars > 0 && controlChars / t.length > 0.1) {
      return false;
    }

    return true;
  });
  return filtered.join("\n");
}

export class PDFExtractor implements Extractor {
  readonly supportedTypes: ResourceType[] = ["PDF"];

  canHandle(type: ResourceType): boolean {
    return this.supportedTypes.includes(type);
  }

  async extract(payload: ResourceInputPayload): Promise<ExtractionResult> {
    try {
      let textContent = payload.content ?? "";
      let numPages = 0;

      // 1. Parse binary PDF buffer with unpdf (pure JS, Node.js safe, no DOMMatrix dependency)
      if (payload.fileBuffer) {
        try {
          const uint8Array = new Uint8Array(payload.fileBuffer);
          const pdfResult = await extractText(uint8Array);
          const extractedText = Array.isArray(pdfResult.text)
            ? pdfResult.text.join("\n\n")
            : pdfResult.text || "";

          if (extractedText.trim()) {
            textContent = extractedText;
            numPages = pdfResult.totalPages || 0;
          }
        } catch (pdfErr) {
          console.warn("[PDFExtractor] unpdf extraction warning:", pdfErr);
        }
      }

      // 2. Clean out stream noise
      textContent = cleanPDFStreamNoise(textContent);

      // 3. Fallback text cleanup if textContent is empty
      if (!textContent.trim() && payload.fileBuffer) {
        const rawString = payload.fileBuffer.toString("utf-8");
        textContent = cleanPDFStreamNoise(rawString);
      }

      // 4. Final fallback notice
      if (!textContent.trim()) {
        textContent = `# ${payload.title}\n[PDF Document]\n(Note: PDF text layer could not be parsed automatically. Please ensure the PDF contains readable text.)`;
      }

      const finalTitle = payload.title || "PDF Document";
      const formattedContent = [
        `# ${finalTitle}`,
        `Document Type: PDF Paper`,
        numPages > 0 ? `Total Pages: ${numPages}` : "",
        ``,
        `## Document Content`,
        textContent.trim(),
      ]
        .filter(Boolean)
        .join("\n");

      return {
        success: true,
        content: {
          rawContent: formattedContent,
          title: finalTitle,
          metadata: {
            format: "pdf",
            numPages,
            fileSize: payload.fileBuffer ? payload.fileBuffer.length : 0,
            ...payload.metadata,
          },
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to extract PDF text content",
      };
    }
  }
}
