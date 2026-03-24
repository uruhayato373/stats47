/**
 * 5桁の地域コードから2桁の都道府県コードを抽出
 *
 * 指定された地域コードの先頭2桁を都道府県コードとして抽出する。
 * 都道府県コードまたは市区町村コードのいずれからも抽出可能。
 *
 * ## 主な用途
 * - 地図データ（TopoJSON）を外部API（Geoshape等）から取得するためのURL構築など、
 *   地域ドメイン横断的なロジックで使用されます（@stats47/gis パッケージ等）。
 *
 * @param {string} areaCode - 地域コード（2桁以上）
 * @returns {string | null} 都道府県コード（2桁形式、例: `"13"`）。2桁未満の場合は `null`
 *
 * @example
 * ```ts
 * extractPrefectureCode("13000"); // "13"
 * extractPrefectureCode("13113"); // "13"
 * extractPrefectureCode("13"); // "13"
 * extractPrefectureCode(""); // null
 * ```
 */
export function extractPrefectureCode(areaCode: string): string | null {
  if (!areaCode || areaCode.length < 2) {
    return null;
  }

  return areaCode.substring(0, 2);
}
