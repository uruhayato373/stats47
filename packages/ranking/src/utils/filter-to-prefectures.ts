/**
 * 都道府県データのフィルタリング（全国除外）
 * 
 * 地域コードの先頭2桁が01-47の範囲内のデータのみを抽出します。
 * 
 * @param data - フィルタリング対象のデータ配列
 * @returns 都道府県データのみを含む配列
 */
export function filterToPrefectures<T extends { areaCode: string }>(
  data: T[]
): T[] {
  return data.filter((item) => {
    const areaCodeNum = parseInt(item.areaCode.substring(0, 2), 10);
    return areaCodeNum >= 1 && areaCodeNum <= 47;
  });
}
