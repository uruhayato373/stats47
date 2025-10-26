/**
 * Mock環境用のメタ情報データ取得関数
 */

import { EstatMetaInfoResponse } from "@/features/estat-api/core/types";

/**
 * 統計表IDに対応するモックメタ情報を取得
 * @param statsDataId - 統計表ID
 * @returns メタ情報レスポンスまたはnull
 */
export function getMockMetaInfo(
  statsDataId: string
): EstatMetaInfoResponse | null {
  try {
    // 統計表IDに基づいてファイルパスを決定
    let filePath: string;

    if (statsDataId.startsWith("000001")) {
      // 都道府県データ
      filePath = `./prefecture/${statsDataId}.json`;
    } else if (statsDataId.startsWith("000002")) {
      // 市区町村データ
      filePath = `./municipality/${statsDataId}.json`;
    } else {
      console.warn(`[Mock] 未対応の統計表ID: ${statsDataId}`);
      return null;
    }

    // 動的インポートでJSONファイルを読み込み
    const mockData = require(filePath);

    if (!mockData) {
      console.warn(`[Mock] ファイルが見つかりません: ${filePath}`);
      return null;
    }

    console.log(`[Mock] メタ情報取得成功: ${statsDataId}`, {
      hasData: !!mockData,
      dataKeys: mockData ? Object.keys(mockData) : null,
    });

    return mockData as EstatMetaInfoResponse;
  } catch (error) {
    console.error(`[Mock] メタ情報取得エラー: ${statsDataId}`, error);
    return null;
  }
}
