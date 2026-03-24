/**
 * 全国データと市区町村データを除外し、都道府県データのみ残す
 *
 * 都道府県の areaCode は 2桁 (01-47)。
 * convertToStatsSchema で 5桁→2桁 正規化済みのため、
 * 2桁以外のコード（全国 "00"/"00000"、市区町村 "01100" 等）を除外する。
 *
 * @param data - データ配列
 * @returns 都道府県データのみの配列
 */
export function filterOutNationalArea<T extends { areaCode: string }>(data: T[]): T[] {
  return data.filter((item) => {
    const code = item.areaCode;
    // 2桁の都道府県コード (01-47) のみ残す
    if (/^\d{2}$/.test(code)) {
      return code !== "00";
    }
    // 後方互換: 5桁で XX000 形式の場合も都道府県として扱う
    if (/^\d{2}000$/.test(code)) {
      return code !== "00000";
    }
    return false;
  });
}

/**
 * 全国データと都道府県データを除外し、市区町村データのみ残す
 *
 * 市区町村の areaCode は 5桁で XX000 以外（例: "01100", "13101"）。
 * 全国 "00000" と都道府県 "XX000" を除外する。
 *
 * @param data - データ配列
 * @returns 市区町村データのみの配列
 */
export function filterToCityArea<T extends { areaCode: string }>(data: T[]): T[] {
  return data.filter((item) => {
    const code = item.areaCode;
    // 5桁の市区町村コード（XX000 以外）のみ残す
    if (/^\d{5}$/.test(code)) {
      return !code.endsWith("000");
    }
    return false;
  });
}
