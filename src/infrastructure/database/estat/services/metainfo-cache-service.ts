import {
  SaveMetaInfoCacheRequest,
  SaveMetaInfoCacheResponse,
} from "@/infrastructure/database/estat/types";
import { EstatMetaInfoResponse } from "@/features/estat-api/core/types";

export class EstatMetaInfoCacheService {
  /**
   * メタ情報をR2キャッシュに保存
   *
   * @param statsDataId - 統計表ID
   * @param metaInfo - メタ情報レスポンス
   * @returns 保存結果
   * @throws Error - API呼び出しまたは保存に失敗した場合
   */
  static async saveToR2(
    statsDataId: string,
    metaInfo: EstatMetaInfoResponse
  ): Promise<SaveMetaInfoCacheResponse> {
    const requestBody: SaveMetaInfoCacheRequest = {
      statsDataId,
      metaInfoResponse: metaInfo,
    };

    const response = await fetch("/api/estat-api/metainfo-cache/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = (await response.json()) as SaveMetaInfoCacheResponse;

    if (!result.success) {
      throw new Error(result.message || "保存に失敗しました");
    }

    return result;
  }
}
