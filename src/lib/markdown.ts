/**
 * Safe, lightweight markdown renderer for Whyit chat messages.
 *
 * Supports:
 * - Fenced code blocks with language indicators (```lang ... ```)
 * - Inline code (`code`)
 * - Bold (**text**), Italic (*text*)
 * - Headings (###, ##, #)
 * - Blockquotes (> quote)
 * - Bulleted lists (- item, * item)
 * - Numbered lists (1. item)
 * - Line breaks
 *
 * Ensures HTML characters are escaped to prevent XSS injection.
 */

import katex from "katex";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderMarkdown(markdown: string): string {
  if (!markdown) return "";

  // 1. Extract fenced code blocks first to protect them from any formatting or math parsing
  const codeBlocks: string[] = [];
  let codeIndex = 0;

  let processed = markdown.replace(
    /```([a-zA-Z0-9_\-+]*)\r?\n([\s\S]*?)```/g,
    (_, lang, code) => {
      const placeholder = `___CODE_BLOCK_${codeIndex++}___`;
      const trimmedCode = code.trimEnd();
      const escapedCode = escapeHtml(trimmedCode);
      const displayLang = lang ? escapeHtml(lang) : "code";

      codeBlocks.push(
        `<div class="code-snippet-block my-3.5 rounded-xl overflow-hidden border border-[var(--color-separator)] bg-[var(--color-primary-background)] text-xs shadow-sm">
          <div class="flex items-center justify-between px-3.5 py-1.5 bg-[var(--color-secondary-background)] border-b border-[var(--color-separator)] text-[11px] font-mono text-[var(--color-label-tertiary)]">
            <span class="font-medium tracking-wide uppercase text-[10px] text-[var(--color-label-secondary)]">${displayLang}</span>
            <button
              type="button"
              onclick="navigator.clipboard.writeText(decodeURIComponent('${encodeURIComponent(trimmedCode)}')).then(() => { const el = this; el.textContent = 'Copied!'; setTimeout(() => { el.textContent = 'Copy'; }, 2000); })"
              class="hover:text-[var(--color-label-primary)] transition-colors px-1.5 py-0.5 rounded cursor-pointer select-none"
              title="Copy code"
            >
              Copy
            </button>
          </div>
          <pre class="p-3.5 overflow-x-auto font-mono text-[12px] leading-relaxed text-[var(--color-label-primary)] selection:bg-[var(--color-accent-dim)]"><code>${escapedCode}</code></pre>
        </div>`
      );
      return placeholder;
    }
  );

  // 2. Extract Display Math ($$...$$ or \[...\])
  const mathDisplayBlocks: string[] = [];
  let mathDisplayIndex = 0;

  processed = processed.replace(
    /(?:\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\])/g,
    (_, tex1, tex2) => {
      const placeholder = `___MATH_DISPLAY_${mathDisplayIndex++}___`;
      const tex = (tex1 ?? tex2).trim();
      let rendered = "";
      try {
        rendered = katex.renderToString(tex, {
          displayMode: true,
          throwOnError: false,
        });
      } catch {
        rendered = `<code class="font-mono text-xs text-rose-400">${escapeHtml(tex)}</code>`;
      }

      mathDisplayBlocks.push(
        `<div class="katex-math-block my-3 overflow-x-auto py-2.5 px-3 rounded-lg text-center bg-[var(--color-secondary-background)] border border-[var(--color-separator)] text-[var(--color-label-primary)] select-all">${rendered}</div>`
      );
      return placeholder;
    }
  );

  // 3. Extract Inline Code (`code`) before escaping HTML
  const inlineCodes: string[] = [];
  let inlineCodeIndex = 0;

  processed = processed.replace(/`([^`\n]+)`/g, (_, code) => {
    const placeholder = `___INLINE_CODE_${inlineCodeIndex++}___`;
    inlineCodes.push(
      `<code class="px-1.5 py-0.5 rounded text-[0.88em] font-mono bg-[var(--color-secondary-background)] border border-[var(--color-separator)] text-[var(--color-accent-primary)]">${escapeHtml(code)}</code>`
    );
    return placeholder;
  });

  // 4. Extract Inline Math ($...$ or \(...\))
  const mathInlineBlocks: string[] = [];
  let mathInlineIndex = 0;

  // Match $math$ (non-space after opening, non-space before closing, no double-dollar) or \(math\)
  processed = processed.replace(
    /(?:(?<!\\)\$(?!\s)([^$\n]+?)(?<!\s)(?<!\\)\$|\\\(([\s\S]*?)\\\))/g,
    (_, tex1, tex2) => {
      const placeholder = `___MATH_INLINE_${mathInlineIndex++}___`;
      const tex = (tex1 ?? tex2).trim();
      let rendered = "";
      try {
        rendered = katex.renderToString(tex, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        rendered = `<span>$${escapeHtml(tex)}$</span>`;
      }

      mathInlineBlocks.push(
        `<span class="katex-math-inline px-1 py-0.5 text-[var(--color-label-primary)]">${rendered}</span>`
      );
      return placeholder;
    }
  );

  // 5. Escape HTML on the rest of the text
  let html = escapeHtml(processed);

  // 6. Bold & Italic
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^\*])\*([^*]+)\*([^\*]|$)/g, "$1<em>$2</em>$3");

  // 7. Line-by-line processing for headings, lists, blockquotes
  const lines = html.split("\n");
  const processedLines: string[] = [];
  let inList = false;
  let inOrderedList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings
    if (/^###\s+(.+)$/.test(line)) {
      if (inList) { processedLines.push("</ul>"); inList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      line = line.replace(/^###\s+(.+)$/, '<h3 class="type-headline font-semibold text-[var(--color-label-primary)] mt-3 mb-1.5">$1</h3>');
      processedLines.push(line);
      continue;
    }
    if (/^##\s+(.+)$/.test(line)) {
      if (inList) { processedLines.push("</ul>"); inList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      line = line.replace(/^##\s+(.+)$/, '<h2 class="type-title-3 font-semibold text-[var(--color-label-primary)] mt-4 mb-2">$1</h2>');
      processedLines.push(line);
      continue;
    }
    if (/^#\s+(.+)$/.test(line)) {
      if (inList) { processedLines.push("</ul>"); inList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      line = line.replace(/^#\s+(.+)$/, '<h1 class="type-title-2 font-bold text-[var(--color-label-primary)] mt-4 mb-2">$1</h1>');
      processedLines.push(line);
      continue;
    }

    // Blockquote
    if (/^&gt;\s*(.+)$/.test(line)) {
      if (inList) { processedLines.push("</ul>"); inList = false; }
      if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
      line = line.replace(/^&gt;\s*(.+)$/, '<blockquote class="border-l-2 border-[var(--color-accent-primary)] pl-3 my-2 text-[var(--color-label-secondary)] italic">$1</blockquote>');
      processedLines.push(line);
      continue;
    }

    // Unordered List (- or *)
    if (/^[\*\-]\s+(.+)$/.test(line)) {
      if (!inList) {
        if (inOrderedList) { processedLines.push("</ol>"); inOrderedList = false; }
        processedLines.push('<ul class="list-disc list-inside my-1.5 space-y-1">');
        inList = true;
      }
      line = line.replace(/^[\*\-]\s+(.+)$/, '<li class="text-[var(--color-label-primary)]">$1</li>');
      processedLines.push(line);
      continue;
    }

    // Ordered List (1. )
    if (/^\d+\.\s+(.+)$/.test(line)) {
      if (!inOrderedList) {
        if (inList) { processedLines.push("</ul>"); inList = false; }
        processedLines.push('<ol class="list-decimal list-inside my-1.5 space-y-1">');
        inOrderedList = true;
      }
      line = line.replace(/^\d+\.\s+(.+)$/, '<li class="text-[var(--color-label-primary)]">$1</li>');
      processedLines.push(line);
      continue;
    }

    // Close any open lists if empty line or regular paragraph
    if (inList) {
      processedLines.push("</ul>");
      inList = false;
    }
    if (inOrderedList) {
      processedLines.push("</ol>");
      inOrderedList = false;
    }

    processedLines.push(line);
  }

  if (inList) processedLines.push("</ul>");
  if (inOrderedList) processedLines.push("</ol>");

  html = processedLines.join("<br />");

  // Clean up excessive <br /> around block elements
  html = html
    .replace(/<\/div><br \/>/g, "</div>")
    .replace(/<\/ul><br \/>/g, "</ul>")
    .replace(/<\/ol><br \/>/g, "</ol>")
    .replace(/<\/h[1-3]><br \/>/g, "</h$1>")
    .replace(/<\/blockquote><br \/>/g, "</blockquote>")
    .replace(/(<br \/>){3,}/g, "<br /><br />");

  // 8. Restore inline code
  inlineCodes.forEach((code, idx) => {
    html = html.replace(`___INLINE_CODE_${idx}___`, code);
  });

  // 9. Restore inline math
  mathInlineBlocks.forEach((math, idx) => {
    html = html.replace(`___MATH_INLINE_${idx}___`, math);
  });

  // 10. Restore display math
  mathDisplayBlocks.forEach((math, idx) => {
    html = html.replace(`___MATH_DISPLAY_${idx}___`, math);
  });

  // 11. Restore code blocks
  codeBlocks.forEach((block, idx) => {
    html = html.replace(`___CODE_BLOCK_${idx}___`, block);
  });

  return html;
}
