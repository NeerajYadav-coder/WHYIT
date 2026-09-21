import type { NormalizedContent } from "../types";

/**
 * TextNormalizer
 *
 * Normalizes extracted text according to Sprint 5 requirements:
 *   - Unicode & whitespace cleanup
 *   - Line ending normalization (\r\n -> \n)
 *   - Paragraph reconstruction
 *   - Heading detection (#, ##, ###)
 *   - Code block, list, and table structure preservation
 */
export class TextNormalizer {
  normalize(raw: string): NormalizedContent {
    if (!raw) {
      return {
        text: "",
        headings: [],
        codeBlockCount: 0,
        wordCount: 0,
        tokenEstimate: 0,
      };
    }

    // 1. Line ending normalization
    let text = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    // 2. Unicode cleanup (non-breaking spaces, zero-width characters)
    text = text
      .replace(/\u00A0/g, " ")
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

    // 3. Extract and protect code blocks during whitespace normalization
    const codeBlocks: string[] = [];
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });

    // 4. Clean up multiple spaces and empty lines (preserve double newlines for paragraphs)
    const lines = text.split("\n");
    const cleanedLines: string[] = [];
    const headings: string[] = [];

    for (let line of lines) {
      // Trim horizontal whitespace
      line = line.replace(/[ \t]+/g, " ").trim();

      // Heading detection
      if (line.startsWith("#")) {
        const headingTitle = line.replace(/^#+\s*/, "").trim();
        if (headingTitle) headings.push(headingTitle);
      }

      cleanedLines.push(line);
    }

    // Paragraph reconstruction: join single-newline lines, preserve double newlines
    let normalized = cleanedLines.join("\n");
    normalized = normalized.replace(/\n{3,}/g, "\n\n");

    // 5. Restore code blocks
    normalized = normalized.replace(/__CODE_BLOCK_(\d+)__/g, (_, indexStr) => {
      const idx = parseInt(indexStr, 10);
      return codeBlocks[idx] ?? "";
    });

    // Compute metrics
    const words = normalized.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const tokenEstimate = Math.ceil(wordCount * 1.3); // standard ~1.3 tokens per English word

    return {
      text: normalized,
      headings,
      codeBlockCount: codeBlocks.length,
      wordCount,
      tokenEstimate,
    };
  }
}
