/**
 * Mock環境用のメタ情報データ取得関数
 */

import { EstatMetaInfoResponse } from "@/features/estat-api/meta-info/types";

// 静的インポート
import municipality0000020201 from "./municipality/0000020201.json";
import prefecture0000010101 from "./prefecture/0000010101.json";

/**
 * モックデータマップ
 */
const mockMetaInfoMap = {
  "0000010101": prefecture0000010101,
  "0000020201": municipality0000020201,
} as unknown as Record<string, EstatMetaInfoResponse>;

/**
 * 統計表IDに対応するモックメタ情報を取得
 * @param statsDataId - 統計表ID
 * @returns メタ情報レスポンスまたはnull
 */
export function getMockMetaInfo(
  statsDataId: string
): EstatMetaInfoResponse | null {
  const mockData = mockMetaInfoMap[statsDataId];

  if (!mockData) {
    console.warn(`[Mock] モックデータが見つかりません: ${statsDataId}`);
    console.warn(`利用可能なID: ${Object.keys(mockMetaInfoMap).join(", ")}`);
    return null;
  }

  console.log(`[Mock] メタ情報取得成功: ${statsDataId}`);
  return mockData;
}
