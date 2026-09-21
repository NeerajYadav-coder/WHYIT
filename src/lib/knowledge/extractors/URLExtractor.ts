import type { Extractor } from "./Extractor";
import type { ResourceInputPayload, ExtractionResult, ResourceType } from "../types";

function decodeHTMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

export class URLExtractor implements Extractor {
  readonly supportedTypes: ResourceType[] = ["URL", "DOCUMENTATION_SITE"];

  canHandle(type: ResourceType): boolean {
    return this.supportedTypes.includes(type);
  }

  async extract(payload: ResourceInputPayload): Promise<ExtractionResult> {
    const url = payload.sourceUrl || payload.content;
    if (!url || !url.startsWith("http")) {
      return {
        success: false,
        error: "Valid URL starting with http/https is required.",
      };
    }

    try {
      let pageTitle = payload.title;

      // Realistic browser user agent to avoid bot blocking
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status} fetching URL`);
      }

      const html = await response.text();

      // Extract title from <title> tag if not provided
      if (!pageTitle || pageTitle === "New URL Resource") {
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          pageTitle = decodeHTMLEntities(titleMatch[1].trim());
        }
      }

      // 1. Strip non-content blocks completely
      let cleanHtml = html
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
        .replace(/<svg[\s\S]*?<\/svg>/gi, "")
        .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
        .replace(/<head[\s\S]*?<\/head>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "");

      // 2. Convert common semantic tags to markdown structure
      cleanHtml = cleanHtml
        .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n\n# $1\n\n")
        .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n\n## $1\n\n")
        .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n\n### $1\n\n")
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n\n$1\n\n")
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "\n* $1")
        .replace(/<br\s*\/?>/gi, "\n");

      // 3. Strip remaining HTML tags
      let textContent = cleanHtml.replace(/<[^>]+>/g, " ");

      // 4. Decode HTML entities
      textContent = decodeHTMLEntities(textContent);

      // 5. Clean whitespace & newlines
      textContent = textContent
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .join("\n\n");

      if (!textContent) {
        textContent = `[URL Knowledge Source: ${pageTitle}]\nURL: ${url}`;
      }

      let domain = "unknown";
      try {
        domain = new URL(url).hostname;
      } catch {
        /* noop */
      }

      return {
        success: true,
        content: {
          rawContent: textContent,
          title: pageTitle || url,
          sourceUrl: url,
          metadata: {
            domain,
            statusCode: response.status,
            ...payload.metadata,
          },
        },
      };
    } catch (err) {
      return {
        success: true,
        content: {
          rawContent: `[Web Page Resource]\nURL: ${url}\nTitle: ${payload.title}`,
          title: payload.title || url,
          sourceUrl: url,
          metadata: {
            error: err instanceof Error ? err.message : "Failed to fetch webpage live",
            ...payload.metadata,
          },
        },
      };
    }
  }
}
