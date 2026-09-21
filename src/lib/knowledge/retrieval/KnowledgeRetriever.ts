/**
 * KnowledgeRetriever
 *
 * High-precision retrieval engine for project knowledge chunks.
 *
 * Responsibilities:
 * - Queries all active KnowledgeChunk records for a given project.
 * - Extracts keywords from learner queries with intelligent stopword pruning.
 * - Scores chunks using term frequency, section heading weighting, and phrase matching.
 * - Packs highest-scoring relevant chunks within strict token budgets.
 * - Provides graceful fallback to foundational introduction chunks when queries are general.
 */

import { prisma } from "@/lib/db/prisma";
import type { RetrievedChunk } from "@/lib/context/types";

const COMMON_STOPWORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
  "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
  "below", "between", "both", "but", "by", "can", "can't", "cannot", "could",
  "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down",
  "during", "each", "explain", "few", "for", "from", "further", "had", "hadn't",
  "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's",
  "help", "her", "here", "here's", "hers", "herself", "him", "himself", "his",
  "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is",
  "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't",
  "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "or",
  "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "please",
  "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't",
  "so", "some", "such", "tell", "than", "that", "that's", "the", "their", "theirs",
  "them", "themselves", "then", "there", "there's", "these", "they", "they'd",
  "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under",
  "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've",
  "were", "weren't", "what", "what's", "whatever", "when", "when's", "where",
  "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
  "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've",
  "your", "yours", "yourself", "yourselves"
]);

export interface RetrieveOptions {
  projectId: string;
  query?: string;
  maxChunks?: number;
  maxTokens?: number;
}

export class KnowledgeRetriever {
  /**
   * Tokenizes and cleans query into significant search terms.
   */
  private extractSearchTerms(query?: string): string[] {
    if (!query || !query.trim()) return [];

    // Split on whitespace and common punctuation, retaining meaningful alphanumeric + technical symbols
    const rawTokens = query
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_\-+]/gu, " ")
      .split(/\s+/)
      .filter(Boolean);

    return rawTokens.filter((token) => token.length >= 2 && !COMMON_STOPWORDS.has(token));
  }

  /**
   * Retrieves the most relevant knowledge chunks for a query within token budget limits.
   */
  async retrieveRelevantChunks(options: RetrieveOptions): Promise<RetrievedChunk[]> {
    const { projectId, query, maxChunks = 4, maxTokens = 2000 } = options;

    if (!projectId) return [];

    // 1. Fetch all completed chunks belonging to this project
    let rawChunks: Array<{
      id: string;
      sourceId: string;
      position: number;
      sectionTitle: string | null;
      content: string;
      tokenEstimate: number;
      source: {
        id: string;
        title: string;
        type: string;
      };
    }> = [];

    try {
      rawChunks = await prisma.knowledgeChunk.findMany({
        where: {
          source: {
            projectId,
            status: "COMPLETED",
          },
        },
        include: {
          source: {
            select: {
              id: true,
              title: true,
              type: true,
            },
          },
        },
        orderBy: [
          { sourceId: "asc" },
          { position: "asc" },
        ],
      });
    } catch (err) {
      console.error("[KnowledgeRetriever] Database query failed:", err);
      return [];
    }

    if (rawChunks.length === 0) {
      return [];
    }

    const searchTerms = this.extractSearchTerms(query);
    const cleanedQuery = query ? query.toLowerCase().trim() : "";

    // 2. Score each chunk against the query terms
    const scoredChunks = rawChunks.map((chunk) => {
      const contentLower = chunk.content.toLowerCase();
      const sectionLower = (chunk.sectionTitle ?? "").toLowerCase();
      const sourceTitleLower = chunk.source.title.toLowerCase();

      let score = 0;

      if (searchTerms.length > 0) {
        // Multi-term matching
        for (const term of searchTerms) {
          // Section title match: +6 points per occurrence
          if (sectionLower.includes(term)) {
            score += 6;
          }

          // Source title match: +4 points per occurrence
          if (sourceTitleLower.includes(term)) {
            score += 4;
          }

          // Content match: count frequency
          const occurrences = (contentLower.match(new RegExp(`\\b${term}\\b`, "g")) || []).length;
          if (occurrences > 0) {
            // Logarithmic saturation so a single repeated word doesn't dominate unfairly
            score += Math.min(12, occurrences * 2.5);
          } else if (contentLower.includes(term)) {
            // Substring match
            score += 1.2;
          }
        }

        // Exact phrase boost (if student asked a specific multi-word phrase, e.g. "reverse-mode autodiff")
        if (cleanedQuery.length > 8 && contentLower.includes(cleanedQuery)) {
          score += 10;
        }
      }

      // Foundational boost for intro chunks when score is otherwise tied
      if (chunk.position <= 2) {
        score += 0.5;
      }

      return {
        chunk,
        score,
      };
    });

    // 3. Sort by relevance score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // 4. Determine if query matched any specific chunks
    const hasMeaningfulMatch = scoredChunks.length > 0 && scoredChunks[0].score > 1.0;

    const selectedList = hasMeaningfulMatch
      ? scoredChunks
      : // Fallback: Take introductory chunks from each active source
        scoredChunks.filter((item) => item.chunk.position <= 2);

    // 5. Pack into token budget
    const result: RetrievedChunk[] = [];
    let accumulatedTokens = 0;

    for (const item of selectedList) {
      if (result.length >= maxChunks) break;

      const tokens = item.chunk.tokenEstimate || Math.ceil(item.chunk.content.length / 4);

      if (accumulatedTokens + tokens <= maxTokens) {
        result.push({
          id: item.chunk.id,
          sourceId: item.chunk.sourceId,
          sourceTitle: item.chunk.source.title,
          sourceType: item.chunk.source.type,
          sectionTitle: item.chunk.sectionTitle,
          content: item.chunk.content,
          tokenEstimate: tokens,
          relevanceScore: Math.round(item.score * 10) / 10,
        });
        accumulatedTokens += tokens;
      } else if (result.length === 0) {
        // If the very first chunk is slightly over budget, slice it to fit
        const allowedChars = Math.max(100, maxTokens * 4);
        result.push({
          id: item.chunk.id,
          sourceId: item.chunk.sourceId,
          sourceTitle: item.chunk.source.title,
          sourceType: item.chunk.source.type,
          sectionTitle: item.chunk.sectionTitle,
          content: item.chunk.content.slice(0, allowedChars) + "\n[... truncated to fit token context]",
          tokenEstimate: maxTokens,
          relevanceScore: Math.round(item.score * 10) / 10,
        });
        break;
      }
    }

    return result;
  }
}

export const knowledgeRetriever = new KnowledgeRetriever();
