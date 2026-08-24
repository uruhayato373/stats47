/**
 * DB から完全削除済みのブログ slug 一覧
 *
 * articles テーブルから slug ごと削除した記事は Next.js ルートで 404 を返すが、
 * Google に過去インデックスされた URL は長期間クロールされ続ける。middleware で
 * 410 Gone を返すことで「完全削除」シグナルを送りインデックス除去を早める。
 *
 * 対象外:
 * - 一時 unpublished（将来復帰の可能性あり）→ 404 のままでよい
 * - slug rename（301）→ `BLOG_SLUG_REDIRECTS` に追加する
 *
 * 追加ルール:
 * - GSC「見つかりませんでした」レポートに `/blog/{slug}` が出てきたらここに追加
 * - 記事を復活させる場合はここから削除
 */
export const GONE_BLOG_SLUGS = new Set<string>([
  // GSC soft-404 監査で「記事実体なし + HTTP 200 not-found」を確認 (2026-08-24)
  "BarChartRace",
  "cc-estat-12-industry-treemap",
  "energy-production-regional-gap",
  "fiscal-strength-index-gap",
  "food-expenditure-ratio",
  "job-salary-39-comparison",
  "local-allocation-tax-structure",
  "migration-destination-ranking-factors",
  "population-decline-regional-gap",
  "population-density-land-use-structure",
  "population-choropleth",
  "wage-gap-factors-2026",
]);
