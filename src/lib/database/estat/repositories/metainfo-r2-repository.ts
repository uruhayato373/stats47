/**
 * e-StatメタインフォメーションR2リポジトリ
 * e-Stat APIから取得したメタ情報をR2でキャッシュ管理
 *
 * データ永続化層：Repository Pattern
 */

import { MetaInfoCacheDataR2 } from "@/lib/database/estat/types";
import { EstatMetaInfoResponse } from "@/lib/estat-api/types";

/**
 * R2環境インターフェース
 */
export interface EstatMetaInfoR2Env {
  METAINFO_BUCKET: R2Bucket;
}

/**
 * e-StatメタインフォメーションR2リポジトリ
 */
export class EstatMetaInfoR2Repository {
  /**
   * e-Statメタ情報を保存
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @param metaInfo - EstatMetaInfoResponse形式のデータ
   */
  static async save(
    env: EstatMetaInfoR2Env,
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
    const key = `estat_metainfo/${statsDataId}/meta.json`;

    // JSONに変換
    const jsonString = JSON.stringify(r2Data, null, 2);
    const jsonBuffer = new TextEncoder().encode(jsonString);

    // R2に保存
    await env.METAINFO_BUCKET.put(key, jsonBuffer, {
      httpMetadata: {
        contentType: "application/json",
      },
      customMetadata: {
        "stats-data-id": statsDataId,
        "saved-at": r2Data.saved_at,
        "table-title": r2Data.summary.table_title,
      },
    });

    if (process.env.NODE_ENV === "development") {
      console.log(
        `R2メタ情報キャッシュ保存完了: ${key} (${jsonBuffer.byteLength}バイト)`
      );
    }

    return {
      key,
      size: jsonBuffer.byteLength,
    };
  }

  /**
   * e-Statメタ情報を取得
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   * @returns EstatMetaInfoResponse | null
   */
  static async findByStatsId(
    env: EstatMetaInfoR2Env,
    statsDataId: string
  ): Promise<EstatMetaInfoResponse | null> {
    try {
      const key = `estat_metainfo/${statsDataId}/meta.json`;
      const object = await env.METAINFO_BUCKET.get(key);

      if (!object) {
        if (process.env.NODE_ENV === "development") {
          console.log(`R2メタ情報キャッシュミス: ${key}`);
        }
        return null;
      }

      const jsonText = await object.text();
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
   * キャッシュを削除
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @param statsDataId - 統計表ID
   */
  static async delete(
    env: EstatMetaInfoR2Env,
    statsDataId: string
  ): Promise<void> {
    try {
      const key = `estat_metainfo/${statsDataId}/meta.json`;
      await env.METAINFO_BUCKET.delete(key);

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
   * すべてのキャッシュを一覧取得
   *
   * @param env - Cloudflare環境変数（R2バケット含む）
   * @returns statsDataId の配列
   */
  static async listAll(env: EstatMetaInfoR2Env): Promise<string[]> {
    try {
      const prefix = `estat_metainfo/`;
      const list = await env.METAINFO_BUCKET.list({ prefix });

      const statsDataIds = list.objects
        .map((obj) => {
          // "estat_metainfo/{statsDataId}/meta.json" から statsDataId を抽出
          const match = obj.key.match(/estat_metainfo\/([^/]+)\/meta\.json$/);
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

  /**
   * @deprecated Use save() instead
   */
  static async saveMetaInfo(
    env: EstatMetaInfoR2Env,
    statsDataId: string,
    metaInfo: EstatMetaInfoResponse
  ): Promise<{ key: string; size: number }> {
    console.warn(
      "saveMetaInfo() is deprecated. Use save() instead for consistency with Repository pattern."
    );
    return this.save(env, statsDataId, metaInfo);
  }

  /**
   * @deprecated Use findByStatsId() instead
   */
  static async getMetaInfo(
    env: EstatMetaInfoR2Env,
    statsDataId: string
  ): Promise<EstatMetaInfoResponse | null> {
    console.warn(
      "getMetaInfo() is deprecated. Use findByStatsId() instead for consistency with Repository pattern."
    );
    return this.findByStatsId(env, statsDataId);
  }

  /**
   * @deprecated Use delete() instead
   */
  static async deleteCache(
    env: EstatMetaInfoR2Env,
    statsDataId: string
  ): Promise<void> {
    console.warn(
      "deleteCache() is deprecated. Use delete() instead for consistency with Repository pattern."
    );
    return this.delete(env, statsDataId);
  }

  /**
   * @deprecated Use listAll() instead
   */
  static async listAllCaches(env: EstatMetaInfoR2Env): Promise<string[]> {
    console.warn(
      "listAllCaches() is deprecated. Use listAll() instead for consistency with Repository pattern."
    );
    return this.listAll(env);
  }
}
