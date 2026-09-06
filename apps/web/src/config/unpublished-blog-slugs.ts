/**
 * 未公開 (published:false) のブログ slug 一覧
 *
 * **このファイルは自動生成されます。手動編集しないこと。**
 *
 * 用途: middleware が `/blog/<slug>` を 410 Gone で前段短絡する。
 *   これが無いと OpenNext が焼き付けた notFound prerender が
 *   **HTTP 200 +「記事が見つかりません」** として永久配信される (soft 404)。
 *
 * 真実源: R2 `app/blog/all.json` の `published === false`。
 * 記事を再公開したら次回生成でこの集合から自動的に消える (手動メンテ不要)。
 *
 * 恒久削除が確定した slug は `gone-blog-slugs.ts` (手編集) に置く。
 *
 * 更新方法: `cd apps/web && npx tsx scripts/generate-unpublished-blog-slugs.ts`
 *
 * 最終生成日: 2026-09-06
 * 件数: 10
 */
export const UNPUBLISHED_BLOG_SLUGS: ReadonlySet<string> = new Set([
  "climate-lifestyle-connection",
  "estimated-hourly-wage-ranking",
  "food-culture-prefecture-map",
  "gender-wage-gap-ranking",
  "medical-access-regional-gap",
  "nurse-salary-ranking",
  "sports-participation-map",
  "telework-income-correlation",
  "tokyo-real-income-after-rent",
  "truck-driver-salary-trend",
]);
