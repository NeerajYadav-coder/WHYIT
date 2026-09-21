import type { KnowledgeChunkInput, ChunkerOptions } from "../types";

/**
 * HeadingAwareChunker
 *
 * Configurable heading-aware chunker that preserves section context,
 * respects paragraph boundaries, and maintains configurable overlap.
 */
export class HeadingAwareChunker {
  chunk(text: string, options?: ChunkerOptions): KnowledgeChunkInput[] {
    if (!text || !text.trim()) return [];

    const maxWords = options?.maxChunkSizeTokens
      ? Math.floor(options.maxChunkSizeTokens / 1.3)
      : 350; // ~350 words (~450 tokens)
    const overlapWords = options?.overlapTokens
      ? Math.floor(options.overlapTokens / 1.3)
      : 40;

    const chunks: KnowledgeChunkInput[] = [];
    let currentSectionTitle = "Overview";
    let currentBuffer: string[] = [];
    let currentWordCount = 0;

    const pushChunk = (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;
      const words = trimmed.split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      if (wordCount === 0) return;

      chunks.push({
        position: chunks.length + 1,
        sectionTitle: currentSectionTitle,
        content: trimmed,
        tokenEstimate: Math.ceil(wordCount * 1.3),
        wordCount,
      });
    };

    const flushBuffer = () => {
      if (currentBuffer.length === 0) return;
      const fullText = currentBuffer.join("\n\n").trim();
      if (!fullText) {
        currentBuffer = [];
        currentWordCount = 0;
        return;
      }

      pushChunk(fullText);

      // Overlap for the next chunk
      const allWords = fullText.split(/\s+/).filter(Boolean);
      if (overlapWords > 0 && allWords.length > overlapWords) {
        const overlap = allWords.slice(-overlapWords).join(" ");
        currentBuffer = [overlap];
        currentWordCount = overlapWords;
      } else {
        currentBuffer = [];
        currentWordCount = 0;
      }
    };

    // Split text into paragraphs first to respect semantic boundaries
    const rawParagraphs = text.split(/\r?\n\s*\r?\n/);

    for (const rawPara of rawParagraphs) {
      const para = rawPara.trim();
      if (!para) continue;

      // Detect markdown headings
      if (/^#{1,6}\s+/.test(para)) {
        if (currentWordCount >= 60) {
          flushBuffer();
        }
        const firstLine = para.split("\n")[0];
        currentSectionTitle = firstLine.replace(/^#{1,6}\s+/, "").trim();
      }

      const paraWords = para.split(/\s+/).filter(Boolean);

      // Case 1: Paragraph alone exceeds maxWords -> split into sentences/sub-blocks
      if (paraWords.length > maxWords) {
        // Flush any existing buffered content first
        if (currentWordCount > 0) {
          flushBuffer();
        }

        // Split paragraph by sentences
        const sentences = para.match(/[^.!?]+(?:[.!?]+|$)/g) || [para];
        let subBuffer: string[] = [];
        let subWords = 0;

        for (const sentence of sentences) {
          const sTrim = sentence.trim();
          if (!sTrim) continue;
          const sWords = sTrim.split(/\s+/).filter(Boolean);

          // If a single sentence itself is giant, slice it by words
          if (sWords.length > maxWords) {
            if (subWords > 0) {
              pushChunk(subBuffer.join(" "));
              subBuffer = [];
              subWords = 0;
            }

            for (let i = 0; i < sWords.length; i += (maxWords - overlapWords)) {
              const slice = sWords.slice(i, i + maxWords).join(" ");
              pushChunk(slice);
            }
            continue;
          }

          if (subWords + sWords.length > maxWords) {
            pushChunk(subBuffer.join(" "));
            // Retain overlap if possible
            const prevWords = subBuffer.join(" ").split(/\s+/).filter(Boolean);
            const overlap = prevWords.slice(-overlapWords).join(" ");
            subBuffer = overlap ? [overlap, sTrim] : [sTrim];
            subWords = (overlap ? overlapWords : 0) + sWords.length;
          } else {
            subBuffer.push(sTrim);
            subWords += sWords.length;
          }
        }

        if (subBuffer.length > 0) {
          pushChunk(subBuffer.join(" "));
        }
        continue;
      }

      // Case 2: Adding this paragraph exceeds maxWords -> flush then add
      if (currentWordCount + paraWords.length > maxWords) {
        flushBuffer();
      }

      currentBuffer.push(para);
      currentWordCount += paraWords.length;
    }

    // Flush any remaining buffered content
    if (currentBuffer.length > 0) {
      const remaining = currentBuffer.join("\n\n").trim();
      if (remaining) {
        pushChunk(remaining);
      }
    }

    return chunks;
  }
}
