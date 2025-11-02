/**
 * e-Stat統計データR2キャッシュリポジトリ
 *
 * e-Stat APIの統計データをR2ストレージにキャッシュするための純粋関数群。
 * ローカル開発環境でもS3互換API経由でR2にアクセスできます。
 */

import { R2S3Client, getR2S3Config } from "@/infrastructure/storage/s3-client";

import { StatsDataCacheDataR2 } from "../types";
import { generateStatsDataCacheKey } from "../utils/cache-key";

import type { EstatStatsDataResponse, FetchOptions } from "../types";

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
 * e-Stat統計データをR2に保存
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @param statsData - 保存する統計データ
 * @returns 保存されたキーとサイズ
 * @throws {Error} 統計表情報が見つからない場合、または保存に失敗した場合
 */
export async function saveStatsDataCache(
  statsDataId: string,
  options: FetchOptions,
  statsData: EstatStatsDataResponse
): Promise<{ key: string; size: number }> {
  const tableInf = statsData.GET_STATS_DATA?.STATISTICAL_DATA?.TABLE_INF;
  if (!tableInf) {
    throw new Error("統計表情報が見つかりません");
  }

  const r2Data: StatsDataCacheDataR2 = {
    version: "1.0",
    stats_data_id: statsDataId,
    saved_at: new Date().toISOString(),
    stats_data_response: statsData,
    summary: {
      table_title: tableInf.TITLE?.$ || "",
      stat_name: tableInf.STAT_NAME?.$ || "",
      organization: tableInf.GOV_ORG?.$ || "",
      survey_date: tableInf.SURVEY_DATE || "",
      updated_date: tableInf.UPDATED_DATE || "",
    },
  };

  const key = generateStatsDataCacheKey(statsDataId, options);
  const jsonString = JSON.stringify(r2Data, null, 2);
  const jsonBuffer = Buffer.from(jsonString, "utf-8");
  const client = createR2Client();

  // メタデータの値をサニタイズ（S3互換APIの制限に対応）
  const sanitizeMetadata = (value: string): string => {
    return value
      .replace(/[^\x20-\x7E]/g, "") // 非ASCII文字を削除
      .replace(/[\r\n\t]/g, " ") // 改行・タブをスペースに変換
      .trim()
      .substring(0, 1024); // 長さ制限
  };

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
      `R2統計データキャッシュ保存完了: ${key} (${jsonBuffer.length}バイト)`
    );
  }

  return { key, size: jsonBuffer.length };
}

/**
 * e-Stat統計データをR2から検索（キャッシュキー指定）
 *
 * キャッシュキーを指定してR2ストレージから統計データを検索します。
 *
 * @param cacheKey - キャッシュキー
 * @returns EstatStatsDataResponse | null（見つからない場合はnull）
 */
export async function findStatsDataByCacheKey(
  cacheKey: string
): Promise<EstatStatsDataResponse | null> {
  try {
    const client = createR2Client();
    const buffer = await client.getObject(cacheKey);

    if (!buffer) {
      if (process.env.NODE_ENV === "development") {
        console.log(`R2統計データキャッシュミス: ${cacheKey}`);
      }
      return null;
    }

    const jsonText = buffer.toString("utf-8");
    const cacheData: StatsDataCacheDataR2 = JSON.parse(jsonText);

    if (process.env.NODE_ENV === "development") {
      console.log(`R2統計データキャッシュヒット: ${cacheKey}`);
    }

    return cacheData.stats_data_response as EstatStatsDataResponse;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("R2統計データキャッシュ取得エラー:", error);
    }
    return null;
  }
}

/**
 * e-Stat統計データをR2から検索（統計表IDとオプション指定）
 *
 * 統計表IDとオプションから統計データを検索します。
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @returns EstatStatsDataResponse | null（見つからない場合はnull）
 */
export async function findStatsDataByStatsIdAndParams(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<EstatStatsDataResponse | null> {
  const cacheKey = generateStatsDataCacheKey(statsDataId, options);
  return findStatsDataByCacheKey(cacheKey);
}

/**
 * e-Stat統計データのキャッシュを削除
 *
 * @param statsDataId - 統計表ID
 * @param options - 取得オプション
 * @throws {Error} 削除に失敗した場合
 */
export async function deleteStatsDataCache(
  statsDataId: string,
  options: FetchOptions = {}
): Promise<void> {
  try {
    const key = generateStatsDataCacheKey(statsDataId, options);
    const client = createR2Client();
    await client.deleteObject(key);

    if (process.env.NODE_ENV === "development") {
      console.log(`R2統計データキャッシュ削除: ${key}`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("R2統計データキャッシュ削除エラー:", error);
    }
    throw error;
  }
}

/**
 * 統計表ID配下のすべてのキャッシュキーを一覧取得
 *
 * R2ストレージから指定された統計表ID配下のすべてのキャッシュキーを取得します。
 *
 * @param statsDataId - 統計表ID
 * @returns キャッシュキーの配列
 */
export async function listStatsDataCacheKeys(
  statsDataId: string
): Promise<string[]> {
  try {
    const client = createR2Client();
    const prefix = `estat-api/stats-data/${statsDataId}/`;
    const keys = await client.listObjects(prefix);
    const filteredKeys = keys.filter(
      (key) => key.startsWith(prefix) && key.endsWith(".json")
    );

    if (process.env.NODE_ENV === "development") {
      console.log(
        `R2統計データキャッシュキー一覧取得: ${statsDataId} (${filteredKeys.length}件)`
      );
    }

    return filteredKeys;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("R2統計データキャッシュキー一覧取得エラー:", error);
    }
    return [];
  }
}
