import { logger } from "@stats47/logger";
import { saveToR2 } from "@stats47/r2-storage/server";
import { EstatMetaInfoResponse, MetaInfoCacheDataR2 } from "../../types";
import { sanitizeMetadata } from "./sanitize-metadata";

/**
 * e-Statメタ情報をR2に保存
 *
 * @param statsDataId - 統計表ID
 * @param metaInfo - EstatMetaInfoResponse形式のデータ
 * @returns 保存されたキーとサイズ
 * @throws {Error} 統計表情報が見つからない場合、または保存に失敗した場合
 */
export async function saveMetaInfoCache(
  statsDataId: string,
  metaInfo: EstatMetaInfoResponse
): Promise<{ key: string; size: number }> {
  // サマリー情報を抽出
  const tableInf = metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF;
  if (!tableInf) {
    throw new Error("統計表情報が見つかりません");
  }

  // R2保存用データ構造に変換
  const r2Data: MetaInfoCacheDataR2 = {
    version: "1.0",
    statsDataId: statsDataId,
    savedAt: new Date().toISOString(),
    metaInfoResponse: metaInfo,
    updatedAt: new Date().toISOString(),
    summary: {
      table_title: tableInf.TITLE?.$ || "",
      stat_name: tableInf.STAT_NAME?.$ || "",
      organization: tableInf.GOV_ORG?.$ || "",
      survey_date: tableInf.SURVEY_DATE || "",
      updated_date: tableInf.UPDATED_DATE || "",
    },
  };

  // R2オブジェクトキー生成（.json形式を使用）
  const key = `estat-api/meta-info/${statsDataId}.json`;

  // JSONに変換
  const jsonString = JSON.stringify(r2Data, null, 2);
  const jsonBuffer = Buffer.from(jsonString, "utf-8");

  // R2に保存
  await saveToR2(key, jsonBuffer, {
    contentType: "application/json",
    metadata: {
      "stats-data-id": statsDataId,
      "saved-at": r2Data.savedAt || "",
      "table-title": sanitizeMetadata(r2Data.summary.table_title),
      "stat-name": sanitizeMetadata(r2Data.summary.stat_name),
      "organization": sanitizeMetadata(r2Data.summary.organization),
    },
  });

  logger.info(
    { key, size: jsonBuffer.length },
    `R2メタ情報キャッシュ保存完了: ${key} (${jsonBuffer.length}バイト)`
  );

  return { key, size: jsonBuffer.length };
}
