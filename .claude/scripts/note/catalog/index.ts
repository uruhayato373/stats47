/**
 * note-catalog 集約入口 (git TS SSOT)
 *
 * 全 vertical の NoteArticle[] を束ね、マガジンレジストリと合わせて公開する。
 * validate / generate スクリプトと (次段の) downstream 消費者はここから読む。
 */
import type { NoteArticle } from "./types";
import { stats47NoteArticles } from "./data/stats47-note";
import { koumuinClaudeCodeArticles } from "./data/koumuin-claude-code";
import { koumuinEstatClaudeCodeArticles } from "./data/koumuin-estat-claude-code";
import { koumuinGisArticles } from "./data/koumuin-gis";

export const NOTE_ARTICLES: NoteArticle[] = [
  ...stats47NoteArticles,
  ...koumuinClaudeCodeArticles,
  ...koumuinEstatClaudeCodeArticles,
  ...koumuinGisArticles,
];

export { NOTE_MAGAZINES, NOTE_MAGAZINE_KEYS, getMagazine } from "./magazines";
export type { NoteArticle, NoteMagazine, NoteVertical, NoteSeries } from "./types";

export function getArticle(key: string): NoteArticle | undefined {
  return NOTE_ARTICLES.find((a) => a.key === key);
}

export function articlesByMagazine(magazineKey: string): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.magazine === magazineKey);
}

export function publishedArticles(): NoteArticle[] {
  return NOTE_ARTICLES.filter((a) => a.status === "published");
}
