/**
 * 全国データのみを抽出
 *
 * areaCode が "00000" と完全一致するデータのみを返す。
 * `filterOutNationalArea` の正確な逆関数。
 *
 * @param data - フィルタリング対象のデータ配列
 * @returns 全国データのみを含む配列
 */
export function filterToNational<T extends { areaCode: string }>(
  data: T[]
): T[] {
  return data.filter((item) => item.areaCode === "00000");
}
