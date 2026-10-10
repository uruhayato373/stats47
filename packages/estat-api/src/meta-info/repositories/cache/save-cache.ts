import { logger } from "@stats47/logger";
import type { R2Bucket } from "@stats47/r2-storage";
import { EstatMetaInfoResponse, MetaInfoCacheDataR2 } from "../../types";
import { sanitizeMetadata } from "./sanitize-metadata";

/**
 * e-Statメタ情報をR2に保存
 *
 * 旧実装は saveToR2 (手元の .local/r2 に書くだけ) を使っており、R2 には一度も届いていなかった。
 * stats-data のキャッシュと同じく R2 バケットへ直接書く。
 *
 * @param storage - R2ストレージ
 * @param statsDataId - 統計表ID
 * @param metaInfo - EstatMetaInfoResponse形式のデータ
 * @returns 保存されたキーとサイズ
 * @throws {Error} 統計表情報が見つからない場合、または保存に失敗した場合
 */
export async function saveMetaInfoCache(
  storage: R2Bucket,
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

  const jsonString = JSON.stringify(r2Data, null, 2);
  const size = new TextEncoder().encode(jsonString).length;

  await storage.put(key, jsonString, {
    httpMetadata: { contentType: "application/json" },
    customMetadata: {
      "stats-data-id": statsDataId,
      "saved-at": r2Data.savedAt || "",
      "table-title": sanitizeMetadata(r2Data.summary.table_title),
      "stat-name": sanitizeMetadata(r2Data.summary.stat_name),
      "organization": sanitizeMetadata(r2Data.summary.organization),
    },
  });

  logger.info(
    { key, size },
    `R2メタ情報キャッシュ保存完了: ${key} (${size}バイト)`
  );

  return { key, size };
}
