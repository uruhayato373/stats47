/**
 * ランキング一覧の並び順。
 *
 * 旧実装は `MetricConfig.featuredOrder` 昇順だったが、非 0 は 2,295 件中 8 件しか無く
 * (しかもその 8 件は `HOME_FEATURED_RANKINGS` と完全重複)、実質どこも並んでいなかった。
 * 2026-07-29 に `featuredOrder` を廃止し、索引 (/ranking・カテゴリ・ヘッダー) が代表として
 * 出すキーを先頭に置く方式へ統一した。カテゴリページ・関連ランキングレール・タグ一覧の
 * 先頭が索引と一致する。
 */
import { REPRESENTATIVE_RANKING_KEYS } from "@stats47/data-configs/ranking-prominence";

/** 索引が代表として出すキーの集合 (17 カテゴリ × 最大 6 件)。 */
const REPRESENTATIVE_KEY_SET: ReadonlySet<string> = new Set(
  REPRESENTATIVE_RANKING_KEYS,
);

/** 代表を先頭に、その中と外はそれぞれ更新の新しい順。決定的。 */
export function compareByRepresentativeThenRecency(
  a: { rankingKey: string; updatedAt?: string | null },
  b: { rankingKey: string; updatedAt?: string | null },
): number {
  const aRep = REPRESENTATIVE_KEY_SET.has(a.rankingKey) ? 0 : 1;
  const bRep = REPRESENTATIVE_KEY_SET.has(b.rankingKey) ? 0 : 1;
  if (aRep !== bRep) return aRep - bRep;
  return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
}
