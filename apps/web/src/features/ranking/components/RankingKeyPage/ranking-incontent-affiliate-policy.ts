/**
 * 「データの考察」直後のアフィリエイトを表示しないランキング。
 *
 * 医療統計と汎用的な健康・フィットネス案件のように、検索意図との一致を
 * 明示的に確認できないページはここで個別に抑止する。
 */
const SUPPRESSED_RANKING_KEYS = new Set(["psychiatric-bed-count"]);

export function shouldShowRankingInContentAffiliate(rankingKey: string): boolean {
  return !SUPPRESSED_RANKING_KEYS.has(rankingKey);
}
