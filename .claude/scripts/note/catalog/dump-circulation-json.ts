/**
 * note 回遊監査用の catalog JSON。監査側が TS SSOT を正規表現で再解釈しないための境界。
 *
 * Usage: npx tsx .claude/scripts/note/catalog/dump-circulation-json.ts
 */
import { NOTE_ARTICLES, NOTE_MAGAZINES } from "./index";

const articles = NOTE_ARTICLES.filter(
  (article) => article.status === "published" && article.noteUrl,
).map((article) => ({
  key: article.key,
  vertical: article.vertical,
  series: article.series ?? null,
  title: article.title,
  magazine: article.magazine,
  isPaid: article.isPaid,
  priceJpy: article.priceJpy ?? 0,
  noteUrl: article.noteUrl,
  publishedAt: article.publishedAt ?? null,
  pinned: article.pinned ?? false,
  profiled: article.profiled ?? false,
  publishedSeparator: article.publishedSeparator ?? null,
  r2Body: article.r2Body !== false,
  stats47Targets: article.stats47Targets ?? [],
  nextBestArticle: article.nextBestArticle ?? null,
  publishedLinkRepairs: article.publishedLinkRepairs ?? [],
}));

const magazines = NOTE_MAGAZINES.map((magazine) => ({
  ...magazine,
  publishedMemberKeys: articles
    .filter((article) => article.magazine === magazine.key)
    .map((article) => article.key),
}));

console.log(JSON.stringify({ account: "stats47", articles, magazines }));
