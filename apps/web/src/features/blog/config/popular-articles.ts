/**
 * ブログ一覧の「よく読まれている記事」表示順。
 *
 * 2026-08-28 の直近 28 日 affiliate impression（記事ページの表示機会）上位から選定。
 * タイトルは blog snapshot から解決し、非公開・削除済み slug は reader が除外する。
 */
export const POPULAR_BLOG_ARTICLE_SLUGS = [
  'local-government-debt-burden',
  'livable-prefecture-composite-ranking',
  'childcare-friendly-prefecture-ranking',
] as const;
