import type { StatsSchema } from "@stats47/types";

/**
 * 都道府県データのみを抽出
 *
 * @param statsSchemas - 統計データの配列
 * @returns 都道府県データのみの配列
 */
export function filterPrefectureData(
  statsSchemas: StatsSchema[]
): StatsSchema[] {
  return statsSchemas.filter((schema) => {
    const code = schema.areaCode;
    return (
      code.length === 5 &&
      code.substring(0, 2) !== "00" &&
      code.endsWith("000") &&
      code !== "00000"
    );
  });
}
