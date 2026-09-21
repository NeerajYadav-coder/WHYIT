import type { Extractor } from "./Extractor";
import type { ResourceInputPayload, ExtractionResult, ResourceType } from "../types";
import { YoutubeTranscript } from "youtube-transcript";

export class YouTubeExtractor implements Extractor {
  readonly supportedTypes: ResourceType[] = ["YOUTUBE"];

  canHandle(type: ResourceType): boolean {
    return this.supportedTypes.includes(type);
  }

  async extract(payload: ResourceInputPayload): Promise<ExtractionResult> {
    const url = payload.sourceUrl || payload.content || "";
    
    // Parse YouTube Video ID
    let videoId = "";
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      videoId = ytMatch[1];
    }

    let derivedTitle = payload.title;
    let authorName: string | undefined;
    let transcriptText = "";

    // 1. Fetch metadata via YouTube oEmbed API if available
    if (url) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
          headers: { "User-Agent": "Whyit-Knowledge-Ingestion/1.0" },
        });
        if (oembedRes.ok) {
          const oembedJson = (await oembedRes.json()) as { title?: string; author_name?: string };
          if (oembedJson.title && (!derivedTitle || derivedTitle === "YouTube Video" || derivedTitle === "New Resource")) {
            derivedTitle = oembedJson.title;
          }
          if (oembedJson.author_name) {
            authorName = oembedJson.author_name;
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    // 2. Fetch real Video Transcript / Subtitles using youtube-transcript
    if (url || videoId) {
      try {
        const transcriptItems = await YoutubeTranscript.fetchTranscript(url || videoId);
        if (transcriptItems && transcriptItems.length > 0) {
          transcriptText = transcriptItems.map((item) => item.text).join(" ");
        }
      } catch (err) {
        console.warn("[YouTubeExtractor] Could not fetch auto-transcript:", err);
      }
    }

    const finalTitle = derivedTitle || (videoId ? `YouTube Video (${videoId})` : "YouTube Resource");

    const contentSections = [
      `# ${finalTitle}`,
      `Resource Type: YouTube Video`,
      `Source URL: ${url}`,
      `Video ID: ${videoId || "N/A"}`,
      authorName ? `Channel / Author: ${authorName}` : "",
      ``,
      `## Video Transcript & Lesson Content`,
      transcriptText.trim()
        ? transcriptText.trim()
        : `Summary: Ingested YouTube video "${finalTitle}". (Note: Auto-generated transcript was unavailable or restricted for this video).`,
    ].filter(Boolean).join("\n");

    return {
      success: true,
      content: {
        rawContent: contentSections,
        title: finalTitle,
        author: authorName,
        sourceUrl: url,
        metadata: {
          videoId,
          platform: "YouTube",
          channel: authorName ?? null,
          hasTranscript: Boolean(transcriptText.trim()),
          ...payload.metadata,
        },
      },
    };
  }
}
