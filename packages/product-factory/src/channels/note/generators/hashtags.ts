/**
 * hashtags.txt ジェネレータ。記事プランのタグ + シリーズ共通タグを 1 行 1 タグで出力する (3〜8 個)。
 */
import type { NoteArticlePlan } from "../types";

/** 全記事共通で付けるブランドタグ。 */
const BASE_TAGS = ["都道府県", "統計"];

export function resolveHashtags(article: NoteArticlePlan): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of [...article.hashtags, ...BASE_TAGS]) {
    const tag = t.replace(/^#/, "").trim();
    if (tag && !seen.has(tag)) {
      seen.add(tag);
      out.push(tag);
    }
    if (out.length >= 8) break;
  }
  return out;
}

export function renderHashtags(article: NoteArticlePlan): string {
  return resolveHashtags(article).map((t) => `#${t}`).join("\n") + "\n";
}
