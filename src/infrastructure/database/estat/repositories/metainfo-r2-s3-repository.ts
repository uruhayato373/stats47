/**
 * e-StatメタインフォメーションR2 S3互換APIリポジトリ
 * ローカル開発環境でR2にアクセスするためのS3互換APIリポジトリ
 */

import { EstatMetaInfoResponse } from "@/features/estat-api/core/types";
import { MetaInfoCacheDataR2 } from "@/infrastructure/database/estat/types";
import {
  R2S3Client,
  getR2S3Config,
} from "@/infrastructure/database/storage/s3-client";

/**
 * e-StatメタインフォメーションR2 S3互換APIリポジトリ
 */
export class EstatMetaInfoR2S3Repository {
  private static client: R2S3Client | null = null;

  /**
   * S3クライアントを初期化
   */
  private static getClient(): R2S3Client {
    if (!this.client) {
      const config = getR2S3Config();
      if (!config) {
        throw new Error(
          "R2 S3設定が見つかりません。環境変数を確認してください。"
        );
      }
      this.client = new R2S3Client(config);
    }
    return this.client;
  }

  /**
   * e-Statメタ情報を保存
   *
   * @param statsDataId - 統計表ID
   * @param metaInfo - EstatMetaInfoResponse形式のデータ
   */
  static async save(
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

    // S3クライアントを取得
    const client = this.getClient();

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
        `R2メタ情報キャッシュ保存完了 (S3互換API): ${key} (${jsonBuffer.length}バイト)`
      );
    }

    return {
      key,
      size: jsonBuffer.length,
    };
  }

  /**
   * e-Statメタ情報を取得
   *
   * @param statsDataId - 統計表ID
   * @returns EstatMetaInfoResponse | null
   */
  static async findByStatsId(
    statsDataId: string
  ): Promise<EstatMetaInfoResponse | null> {
    try {
      const key = `estat-api/meta-info/${statsDataId}.json`;
      const client = this.getClient();
      const buffer = await client.getObject(key);

      if (!buffer) {
        if (process.env.NODE_ENV === "development") {
          console.log(`R2メタ情報キャッシュミス (S3互換API): ${key}`);
        }
        return null;
      }

      const jsonText = buffer.toString("utf-8");
      const cacheData: MetaInfoCacheDataR2 = JSON.parse(jsonText);

      if (process.env.NODE_ENV === "development") {
        console.log(`R2メタ情報キャッシュヒット (S3互換API): ${key}`);
      }

      return cacheData.meta_info_response as EstatMetaInfoResponse;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("R2メタ情報キャッシュ取得エラー (S3互換API):", error);
      }
      return null;
    }
  }

  /**
   * キャッシュを削除
   *
   * @param statsDataId - 統計表ID
   */
  static async delete(statsDataId: string): Promise<void> {
    try {
      const key = `estat-api/meta-info/${statsDataId}.json`;
      const client = this.getClient();
      await client.deleteObject(key);

      if (process.env.NODE_ENV === "development") {
        console.log(`R2メタ情報キャッシュ削除 (S3互換API): ${key}`);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("R2メタ情報キャッシュ削除エラー (S3互換API):", error);
      }
      throw error;
    }
  }

  /**
   * すべてのキャッシュを一覧取得
   *
   * @returns statsDataId の配列
   */
  static async listAll(): Promise<string[]> {
    try {
      const client = this.getClient();
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
        console.error("R2メタ情報キャッシュ一覧取得エラー (S3互換API):", error);
      }
      return [];
    }
  }
}
