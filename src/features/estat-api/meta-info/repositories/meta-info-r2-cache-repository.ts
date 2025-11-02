/**
 * e-Statメタ情報R2キャッシュリポジトリ
 *
 * e-Stat APIのメタ情報をR2ストレージにキャッシュするための純粋関数群。
 * ローカル開発環境でもS3互換API経由でR2にアクセスできます。
 */

import { R2S3Client, getR2S3Config } from "@/infrastructure/storage/s3-client";

import { MetaInfoCacheDataR2, type EstatMetaInfoResponse } from "../types";

/**
 * R2 S3クライアントを作成
 *
 * @returns R2S3Client
 * @throws {Error} R2 S3設定が見つからない場合
 */
function createR2Client(): R2S3Client {
  const config = getR2S3Config();
  if (!config) {
    throw new Error("R2 S3設定が見つかりません。環境変数を確認してください。");
  }
  return new R2S3Client(config);
}

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
    stats_data_id: statsDataId,
    saved_at: new Date().toISOString(),
    meta_info_response: metaInfo,
    summary: {
      table_title: tableInf.TITLE?.$ || "",
      stat_name: tableInf.STAT_NAME?.$ || "",
      organization: tableInf.GOV_ORG?.$ || "",
      survey_date: tableInf.SURVEY_DATE || "",
      updated_date: tableInf.UPDATED_DATE || "",
    },
  };

  // R2オブジェクトキー生成
  const key = `estat-api/meta-info/${statsDataId}.json`;

  // JSONに変換
  const jsonString = JSON.stringify(r2Data, null, 2);
  const jsonBuffer = Buffer.from(jsonString, "utf-8");

  // S3クライアントを作成
  const client = createR2Client();

  // メタデータの値をサニタイズ（S3互換APIの制限に対応）
  const sanitizeMetadata = (value: string): string => {
    return value
      .replace(/[^\x20-\x7E]/g, "") // 非ASCII文字を削除
      .replace(/[\r\n\t]/g, " ") // 改行・タブをスペースに変換
      .trim()
      .substring(0, 1024); // 長さ制限
  };

  // R2に保存
  await client.putObject(key, jsonBuffer, {
    contentType: "application/json",
    metadata: {
      "stats-data-id": statsDataId,
      "saved-at": r2Data.saved_at,
      "table-title": sanitizeMetadata(r2Data.summary.table_title),
      "stat-name": sanitizeMetadata(r2Data.summary.stat_name),
      organization: sanitizeMetadata(r2Data.summary.organization),
    },
  });

  if (process.env.NODE_ENV === "development") {
    console.log(
      `R2メタ情報キャッシュ保存完了: ${key} (${jsonBuffer.length}バイト)`
    );
  }

  return { key, size: jsonBuffer.length };
}

/**
 * e-Statメタ情報をR2から検索
 *
 * 統計表IDを指定してR2ストレージからメタ情報を検索します。
 *
 * @param statsDataId - 統計表ID
 * @returns EstatMetaInfoResponse | null（見つからない場合はnull）
 */
export async function findMetaInfoByStatsId(
  statsDataId: string
): Promise<EstatMetaInfoResponse | null> {
  try {
    const key = `estat-api/meta-info/${statsDataId}.json`;
    const client = createR2Client();
    const buffer = await client.getObject(key);

    if (!buffer) {
      if (process.env.NODE_ENV === "development") {
        console.log(`R2メタ情報キャッシュミス: ${key}`);
      }
      return null;
    }

    const jsonText = buffer.toString("utf-8");
    const cacheData: MetaInfoCacheDataR2 = JSON.parse(jsonText);

    if (process.env.NODE_ENV === "development") {
      console.log(`R2メタ情報キャッシュヒット: ${key}`);
    }

    return cacheData.meta_info_response as EstatMetaInfoResponse;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("R2メタ情報キャッシュ取得エラー:", error);
    }
    return null;
  }
}

/**
 * e-Statメタ情報のキャッシュを削除
 *
 * @param statsDataId - 統計表ID
 * @throws {Error} 削除に失敗した場合
 */
export async function deleteMetaInfoCache(statsDataId: string): Promise<void> {
  try {
    const key = `estat-api/meta-info/${statsDataId}.json`;
    const client = createR2Client();
    await client.deleteObject(key);

    if (process.env.NODE_ENV === "development") {
      console.log(`R2メタ情報キャッシュ削除: ${key}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("R2メタ情報キャッシュ削除エラー:", error);
    }
    throw error;
  }
}

/**
 * すべてのキャッシュされたメタ情報の統計表IDを一覧取得
 *
 * R2ストレージから保存されているすべてのメタ情報の統計表IDを取得します。
 *
 * @returns statsDataId の配列
 */
export async function listAllMetaInfoIds(): Promise<string[]> {
  try {
    const client = createR2Client();
    const keys = await client.listObjects("estat-api/meta-info/");

    const statsDataIds = keys
      .map((key) => {
        // "estat-api/meta-info/{statsDataId}.json" から statsDataId を抽出
        const match = key.match(/estat-api\/meta-info\/([^/]+)\.json$/);
        return match ? match[1] : null;
      })
      .filter((id): id is string => id !== null);

    return statsDataIds;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("R2メタ情報キャッシュ一覧取得エラー:", error);
    }
    return [];
  }
}
