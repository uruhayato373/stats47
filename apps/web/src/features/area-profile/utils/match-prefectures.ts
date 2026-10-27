import { prefectureShortName } from "@stats47/area/short-name";

import type { Prefecture } from "@stats47/area";

/**
 * 都道府県の短縮名 (「東京都」→「東京」、「北海道」は「北海道」のまま)。
 * 実装は `@stats47/area` の単一実装 (クライアント部品から使うのでデータを読まない軽量 subpath)。UI 検索で「東京」「大阪」等の suffix 省略入力に一致させる目的で使う。
 */
export { prefectureShortName };

/**
 * マッチのランク（小さいほど上位）。
 * 0: 完全一致 / 1: 前方一致 / 2: 部分一致
 */
function matchRank(prefName: string, shortName: string, query: string): number | null {
  if (prefName === query || shortName === query) return 0;
  if (prefName.startsWith(query) || shortName.startsWith(query)) return 1;
  if (prefName.includes(query) || shortName.includes(query)) return 2;
  return null;
}

/**
 * 検索クエリに一致する都道府県を、一致の強さ順（完全 → 前方 → 部分）で返す純関数。
 *
 * - 空クエリ（trim 後）は全 47 件を元の順序で返す。
 * - 「東京」「東京都」いずれも東京都に一致する（suffix 省略対応）。
 * - 該当なしは空配列。
 * - ローマ字・ひらがな・市区町村は対象外（データに reading を持たないため）。
 *
 * データ SSOT は `fetchPrefectures()`。この関数は配列を複製・保持せず、
 * 呼び出し側から渡された prefecture 配列だけを走査する。
 */
export function matchPrefectures(
  query: string,
  prefectures: readonly Prefecture[],
): Prefecture[] {
  const q = query.trim();
  if (q === "") return [...prefectures];

  const ranked: { pref: Prefecture; rank: number; order: number }[] = [];
  prefectures.forEach((pref, order) => {
    const rank = matchRank(pref.prefName, prefectureShortName(pref.prefName), q);
    if (rank !== null) ranked.push({ pref, rank, order });
  });

  ranked.sort((a, b) => (a.rank !== b.rank ? a.rank - b.rank : a.order - b.order));
  return ranked.map((r) => r.pref);
}
