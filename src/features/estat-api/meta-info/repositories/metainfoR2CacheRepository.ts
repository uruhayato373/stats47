import { EstatMetaInfoResponse } from "@/features/estat-api/core/types";

import {
  R2S3Client,
  getR2S3Config,
} from "@/infrastructure/database/storage/s3-client";

import { MetaInfoCacheDataR2 } from "../types";

/**
 * e-Statメタ情報R2キャッシュリポジトリ（meta-info配下で責務一元化）
 */
export class EstatMetaInfoR2CacheRepository {
  private static client: R2S3Client | null = null;

  private static getClient(): R2S3Client {
    if (!this.client) {
      const config = getR2S3Config();
      if (!config) throw new Error("R2 S3設定が見つかりません。環境変数要確認");
      this.client = new R2S3Client(config);
    }
    return this.client;
  }

  static async save(
    statsDataId: string,
    metaInfo: EstatMetaInfoResponse
  ): Promise<{ key: string; size: number }> {
    const tableInf = metaInfo.GET_META_INFO?.METADATA_INF?.TABLE_INF;
    if (!tableInf) throw new Error("統計表情報が見つかりません");
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
    const key = `estat-api/meta-info/${statsDataId}.json`;
    const jsonString = JSON.stringify(r2Data, null, 2);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");
    const client = this.getClient();
    // メタデータサニタイズ
    const sanitize = (v: string) =>
      v
        .replace(/[^-\u007E]/g, "")
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

  static async findByStatsId(
    statsDataId: string
  ): Promise<EstatMetaInfoResponse | null> {
    try {
      const key = `estat-api/meta-info/${statsDataId}.json`;
      const client = this.getClient();
      const buffer = await client.getObject(key);
      if (!buffer) return null;
      const cacheData: MetaInfoCacheDataR2 = JSON.parse(
        buffer.toString("utf-8")
      );
      return cacheData.meta_info_response as EstatMetaInfoResponse;
    } catch (_) {
      return null;
    }
  }

  static async delete(statsDataId: string): Promise<void> {
    try {
      const key = `estat-api/meta-info/${statsDataId}.json`;
      const client = this.getClient();
      await client.deleteObject(key);
    } catch (e) {
      throw e;
    }
  }
  static async listAll(): Promise<string[]> {
    try {
      const client = this.getClient();
      const keys = await client.listObjects("estat-api/meta-info/");
      return keys
        .map((key) => key.match(/estat-api\/meta-info\/([^/]+)\.json$/)?.[1])
        .filter((id): id is string => !!id);
    } catch {
      return [];
    }
  }
}
