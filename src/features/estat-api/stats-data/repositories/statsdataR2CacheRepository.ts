import { R2S3Client, getR2S3Config } from "@/infrastructure/storage/s3-client";

import type { EstatStatsDataResponse, FetchOptions } from "../types";
import { StatsDataCacheDataR2 } from "../types";
import { generateStatsDataCacheKey } from "../utils/cache-key";

/**
 * e-Stat統計データR2キャッシュリポジトリ（stats-data配下で責務一元化）
 */
export class EstatStatsDataR2CacheRepository {
  private static client: R2S3Client | null = null;

  private static getClient(): R2S3Client {
    if (!this.client) {
      const config = getR2S3Config();
      if (!config) throw new Error("R2 S3設定が見つかりません。環境変数要確認");
      this.client = new R2S3Client(config);
    }
    return this.client;
  }

  /**
   * R2に統計データを保存
   *
   * @param statsDataId - 統計表ID
   * @param options - 取得オプション
   * @param statsData - 保存する統計データ
   * @returns 保存されたキーとサイズ
   */
  static async save(
    statsDataId: string,
    options: FetchOptions,
    statsData: EstatStatsDataResponse
  ): Promise<{ key: string; size: number }> {
    const tableInf = statsData.GET_STATS_DATA?.STATISTICAL_DATA?.TABLE_INF;
    if (!tableInf) throw new Error("統計表情報が見つかりません");

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
    const client = this.getClient();

    // メタデータサニタイズ
    const sanitize = (v: string) =>
      v
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/[\r\n\t]/g, " ")
        .trim()
        .substring(0, 1024);

    await client.putObject(key, jsonBuffer, {
      contentType: "application/json",
      metadata: {
        "stats-data-id": statsDataId,
        "saved-at": r2Data.saved_at,
        "table-title": sanitize(r2Data.summary.table_title),
        "stat-name": sanitize(r2Data.summary.stat_name),
        organization: sanitize(r2Data.summary.organization),
      },
    });

    return { key, size: jsonBuffer.length };
  }

  /**
   * キャッシュキーで統計データを取得
   *
   * @param cacheKey - キャッシュキー
   * @returns 統計データ、またはnull（見つからない場合）
   */
  static async findByCacheKey(
    cacheKey: string
  ): Promise<EstatStatsDataResponse | null> {
    try {
      const client = this.getClient();
      const buffer = await client.getObject(cacheKey);
      if (!buffer) return null;

      const cacheData: StatsDataCacheDataR2 = JSON.parse(
        buffer.toString("utf-8")
      );
      return cacheData.stats_data_response as EstatStatsDataResponse;
    } catch (_) {
      return null;
    }
  }

  /**
   * 統計表IDとオプションから統計データを取得
   *
   * @param statsDataId - 統計表ID
   * @param options - 取得オプション
   * @returns 統計データ、またはnull（見つからない場合）
   */
  static async findByStatsIdAndParams(
    statsDataId: string,
    options: FetchOptions = {}
  ): Promise<EstatStatsDataResponse | null> {
    const cacheKey = generateStatsDataCacheKey(statsDataId, options);
    return this.findByCacheKey(cacheKey);
  }

  /**
   * キャッシュを削除
   *
   * @param statsDataId - 統計表ID
   * @param options - 取得オプション
   */
  static async delete(
    statsDataId: string,
    options: FetchOptions = {}
  ): Promise<void> {
    try {
      const key = generateStatsDataCacheKey(statsDataId, options);
      const client = this.getClient();
      await client.deleteObject(key);
    } catch (e) {
      throw e;
    }
  }

  /**
   * 統計表ID配下のすべてのキャッシュキーを取得
   *
   * @param statsDataId - 統計表ID
   * @returns キャッシュキーの配列
   */
  static async listByStatsId(statsDataId: string): Promise<string[]> {
    try {
      const client = this.getClient();
      const prefix = `estat-api/stats-data/${statsDataId}/`;
      const keys = await client.listObjects(prefix);
      return keys.filter((key) => key.startsWith(prefix) && key.endsWith(".json"));
    } catch {
      return [];
    }
  }
}
