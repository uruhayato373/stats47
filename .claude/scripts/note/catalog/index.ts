/**
 * note 記事台帳の読み込み口。
 *
 * 正本は data/note/articles.json と data/note/magazines.json (JSON Schema 付き)。
 * ここは台帳を読んで型を付けるだけで、記事のデータを持たない。書き込みは lib/article-ledger.mjs。
 */
import type { NoteArticle } from "./types";
import { readArticleLedger, hasStoredBody } from "../lib/article-ledger.mjs";

export const NOTE_ARTICLES: NoteArticle[] = readArticleLedger().articles.map(
  (article: Omit<NoteArticle, "r2Body">) => ({ ...article, r2Body: hasStoredBody(article) }),
);

export { NOTE_MAGAZINES, NOTE_MAGAZINE_KEYS, getMagazine } from "./magazines";
export type { NoteArticle, NoteMagazine, NoteVertical, NoteSeries, NoteArticleBody, NoteBodyStore } from "./types";

export function getArticle(key: string): NoteArticle | undefined {
  return NOTE_ARTICLES.find((a) => a.key === key);
}

export function articlesByMagazine(magazineKey: string): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.magazine === magazineKey);
}

export function publishedArticles(): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.status === "published");
}
