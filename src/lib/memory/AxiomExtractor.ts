/**
 * AxiomExtractor
 *
 * Extracts axiomatic concepts, mathematical definitions, and foundational
 * principles from educational dialogue turns and curiosity branches.
 */

export interface ExtractedAxiomCandidate {
  statement: string;
  formula?: string;
  category: "Core Principle" | "Mathematical Theorem" | "Mechanistic Definition" | "Empirical Rule";
  confidence: number;
}

export class AxiomExtractor {
  /**
   * Extract potential axioms from a conversational turn or explanation text
   */
  static extractFromText(text: string): ExtractedAxiomCandidate[] {
    if (!text || text.trim().length < 20) return [];

    const candidates: ExtractedAxiomCandidate[] = [];

    // 1. Extract display math blocks ($$...$$) with surrounding context
    const displayMathRegex = /\$\$([\s\S]*?)\$\$/g;
    let match: RegExpExecArray | null;

    while ((match = displayMathRegex.exec(text)) !== null) {
      const formula = match[1].trim();
      // Look for a preceding or succeeding explanatory sentence
      const textBefore = text.slice(Math.max(0, match.index - 200), match.index).trim();
      const lastSentence = textBefore.split(/[.\n]/).filter(Boolean).pop()?.trim() || "";

      if (formula.length > 2) {
        candidates.push({
          statement: lastSentence || "Fundamental formula derived in session",
          formula,
          category: "Mathematical Theorem",
          confidence: 0.9,
        });
      }
    }

    // 2. Identify axiomatic statements (First-principles patterns)
    const lines = text.split("\n");
    for (const line of lines) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith("#")) continue;

      // Check for definition/axiom triggers
      if (
        cleanLine.toLowerCase().includes("is defined as") ||
        cleanLine.toLowerCase().includes("by definition") ||
        cleanLine.toLowerCase().includes("fundamental principle") ||
        cleanLine.toLowerCase().includes("the rule is") ||
        cleanLine.toLowerCase().includes("axiom:") ||
        cleanLine.toLowerCase().includes("theorem:")
      ) {
        // Strip bullet markers or markdown bold
        const cleanedStatement = cleanLine
          .replace(/^[-*•\d.]+\s*/, "")
          .replace(/\*\*/g, "")
          .trim();

        if (cleanedStatement.length > 15 && cleanedStatement.length < 250) {
          // Check if there is an inline formula
          const inlineMathMatch = cleanedStatement.match(/\$([^$\n]+)\$/);
          const formula = inlineMathMatch ? inlineMathMatch[1] : undefined;

          candidates.push({
            statement: cleanedStatement,
            formula,
            category: formula ? "Mathematical Theorem" : "Core Principle",
            confidence: 0.85,
          });
        }
      }
    }

    // Deduplicate candidates by statement similarity
    const unique = new Map<string, ExtractedAxiomCandidate>();
    for (const c of candidates) {
      const key = c.statement.toLowerCase().slice(0, 50);
      if (!unique.has(key) || (c.formula && !unique.get(key)!.formula)) {
        unique.set(key, c);
      }
    }

    return Array.from(unique.values()).slice(0, 5);
  }
}
