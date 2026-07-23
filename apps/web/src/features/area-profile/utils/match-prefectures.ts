import type { Prefecture } from "@stats47/area";

/**
 * 都道府県名の末尾接尾辞（都/道/府/県）を 1 文字だけ落とした短縮名を返す。
 * 「東京都」→「東京」、「北海道」→「北海」ではなく「北海道」は特例で「北海道」のまま
 * にはせず、UI 検索では「東京」「大阪」等の suffix 省略入力に一致させる目的で使う。
 *
 * 注: 「北海道」は「北海」に短縮されるが、`東京`/`大阪`/`京都` など主要な suffix 省略
 * 入力を拾えれば十分なので、includes マッチと併用して過不足なく機能する。
 */
export function prefectureShortName(prefName: string): string {
  return prefName.replace(/[都道府県]$/, "");
}

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
