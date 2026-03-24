import { logger } from "@stats47/logger";
import { fetchFromR2 } from "@stats47/r2-storage/server";
import { EstatMetaInfoResponse, MetaInfoCacheDataR2 } from "../../types";

/**
 * メタ情報をR2キャッシュから取得
 */
export async function findMetaInfoCache(
  statsDataId: string
): Promise<EstatMetaInfoResponse | null> {
  const key = `estat-api/meta-info/${statsDataId}.json`;

  try {
    const buffer = await fetchFromR2(key);
    if (!buffer) return null;

    const jsonString = buffer.toString("utf-8");
    const data = JSON.parse(jsonString) as MetaInfoCacheDataR2;

    return data.metaInfoResponse;
  } catch (error) {
    logger.warn({ statsDataId, error }, "R2キャッシュ取得エラー");
    return null;
  }
}
