/**
 * 見出しテキストから URL-safe な anchor slug を生成する。
 *
 * 日本語・英数字をそのまま残し、空白を `-` に、特殊文字を除去する。
 * 例: "1. 公務員の Claude Code 活用例" → "1-公務員の-claude-code-活用例"
 */
export function buildHeadingSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9぀-ゟ゠-ヿ一-鿿-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

interface HeadingItem {
  level: 2 | 3;
  text: string;
  id: string;
}

/**
 * Markdown ソース文字列から h2 / h3 を抽出する。
 *
 * - コードブロック (` ``` `) 内の `##` は除外
 * - h2 (`## `) と h3 (`### `) のみ対象 (h4 以降は無視)
 */
export function extractHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split("\n");
  const headings: HeadingItem[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const h2Match = line.match(/^##\s+(.+?)\s*$/);
    if (h2Match) {
      const text = h2Match[1].replace(/[*_`]/g, "").trim();
      headings.push({ level: 2, text, id: buildHeadingSlug(text) });
      continue;
    }

    const h3Match = line.match(/^###\s+(.+?)\s*$/);
    if (h3Match) {
      const text = h3Match[1].replace(/[*_`]/g, "").trim();
      headings.push({ level: 3, text, id: buildHeadingSlug(text) });
    }
  }

  return headings;
}
