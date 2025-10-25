/**
 * e-STAT統計データのモックデータプロバイダー
 */

// 都道府県データ
import municipalityData0000020201_A1101 from "./municipality/0000020201_A1101.json";
import prefectureData0000010101_A1101 from "./prefecture/0000010101_A1101.json";

// 市区町村データ

/**
 * モックデータマップ
 * キー形式: "{statsDataId}_{cdCat01}"
 */
export const mockStatsDataMap = {
  // 都道府県
  "0000010101_A1101": prefectureData0000010101_A1101,

  // 市区町村
  "0000020201_A1101": municipalityData0000020201_A1101,
} as const;

/**
 * モックデータ取得関数
 */
export function getMockStatsData(
  statsDataId: string,
  cdCat01?: string
): any | null {
  if (!cdCat01) {
    console.warn(
      `[mock] cdCat01が指定されていません: statsDataId=${statsDataId}`
    );
    return null;
  }

  const key = `${statsDataId}_${cdCat01}` as keyof typeof mockStatsDataMap;
  const data = mockStatsDataMap[key];

  if (!data) {
    console.warn(`[mock] モックデータが見つかりません: ${key}`);
    console.warn(`利用可能なキー: ${Object.keys(mockStatsDataMap).join(", ")}`);
    return null;
  }

  console.log(`[mock] モックデータを返却: ${key}`);
  return data;
}
