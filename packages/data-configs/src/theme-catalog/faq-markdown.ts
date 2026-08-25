/** ThemeCatalog の authored Markdown FAQ を構造化データへ変換する。 */

export interface ParsedFaqItem {
  question: string;
  answer: string;
}

export type FaqMarkdownParseResult =
  | { ok: true; items: ParsedFaqItem[] }
  | { ok: false; error: string };

const FAQ_HEADING_PATTERN = /^###\s+Q\d+\s*[:：]\s*(.+?)\s*$/;

/**
 * `### Q1: 質問` + 本文という authored 形式を厳密に解釈する。
 * runtime では再解釈せず、生成時にここで壊れた FAQ を拒否する。
 */
export function parseFaqMarkdown(markdown: unknown): FaqMarkdownParseResult {
  if (typeof markdown !== "string" || markdown.trim().length === 0) {
    return { ok: false, error: "FAQ 本文が空です" };
  }

  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const items: ParsedFaqItem[] = [];
  const seenQuestions = new Set<string>();
  let question: string | null = null;
  let answerLines: string[] = [];

  const finishItem = (): string | null => {
    if (question === null) return null;
    const answer = answerLines.join("\n").trim();
    if (answer.length === 0) return `「${question}」の回答が空です`;
    if (seenQuestions.has(question)) return `質問が重複しています: ${question}`;
    seenQuestions.add(question);
    items.push({ question, answer });
    return null;
  };

  for (const line of lines) {
    if (line.startsWith("###")) {
      const match = line.match(FAQ_HEADING_PATTERN);
      if (!match) {
        return { ok: false, error: `FAQ 見出し形式が不正です: ${line}` };
      }
      const itemError = finishItem();
      if (itemError) return { ok: false, error: itemError };
      question = match[1].trim();
      answerLines = [];
      continue;
    }

    if (question === null) {
      if (line.trim().length > 0) {
        return { ok: false, error: "最初の FAQ 見出しより前に本文があります" };
      }
      continue;
    }
    answerLines.push(line);
  }

  const itemError = finishItem();
  if (itemError) return { ok: false, error: itemError };
  if (items.length === 0) return { ok: false, error: "FAQ 項目がありません" };

  return { ok: true, items };
}
