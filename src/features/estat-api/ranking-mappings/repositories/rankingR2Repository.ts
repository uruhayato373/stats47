import "server-only";

/**
 * ランキングデータR2リポジトリ
 *
 * ランキングデータをR2ストレージに保存・取得する機能を提供します。
 */

import { R2S3Client, getR2S3Config } from "@/infrastructure/storage/s3-client";
import type { StatsSchema } from "@/types/stats";

import type { RankingExportPayload, RankingMetadata } from "../types";

/**
 * ランキングR2保存リポジトリ
 */
export class EstatRankingR2Repository {
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
   * ランキングデータをR2に保存
   *
   * @param areaType - 地域タイプ（prefecture/city/national）
   * @param rankingKey - ランキングキー（item_code）
   * @param timeCode - 時間コード
   * @param statsSchemas - StatsSchema配列
   * @returns 保存されたキーとサイズ
   */
  static async saveRankingData(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    timeCode: string,
    statsSchemas: StatsSchema[]
  ): Promise<{ key: string; size: number }> {
    // キー生成: ranking/{areaType}/{rankingKey}/{timeCode}.json
    const key = `ranking/${areaType}/${rankingKey}/${timeCode}.json`;

    // StatsSchema[]をJSON形式で保存
    const jsonString = JSON.stringify(statsSchemas, null, 2);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");
    const client = this.getClient();

    // メタデータサニタイズ
    const sanitize = (v: string) =>
      v
        .replace(/[^\x20-\x7E]/g, "")
        .replace(/[\r\n\t]/g, " ")
        .trim()
        .substring(0, 1024);

    // 最初の要素から単位を取得（すべて同じ単位と仮定）
    const unit = statsSchemas.length > 0 ? statsSchemas[0].unit : "";

    await client.putObject(key, jsonBuffer, {
      contentType: "application/json",
      metadata: {
        "ranking-key": rankingKey,
        "area-type": areaType,
        "time-code": timeCode,
        "saved-at": new Date().toISOString(),
        "data-source": "estat",
        "unit": sanitize(unit),
        "values-count": String(statsSchemas.length),
      },
    });

    console.log(`[EstatRankingR2Repository] ランキングデータを保存: ${key}`);

    return { key, size: jsonBuffer.length };
  }

  /**
   * R2からランキングデータを取得
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @param timeCode - 時間コード
   * @returns StatsSchema配列、またはnull（見つからない場合）
   */
  static async findRankingData(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    timeCode: string
  ): Promise<StatsSchema[] | null> {
    try {
      const key = `ranking/${areaType}/${rankingKey}/${timeCode}.json`;
      const client = this.getClient();
      const buffer = await client.getObject(key);

      if (!buffer) {
        return null;
      }

      const statsSchemas: StatsSchema[] = JSON.parse(
        buffer.toString("utf-8")
      );

      console.log(
        `[EstatRankingR2Repository] ランキングデータを取得: ${key}`
      );

      return statsSchemas;
    } catch (error) {
      console.warn(
        `[EstatRankingR2Repository] ランキングデータ取得失敗:`,
        error
      );
      return null;
    }
  }

  /**
   * ランキングキーからR2キーを生成
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @param timeCode - 時間コード
   * @returns R2キー
   */
  static generateRankingKey(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    timeCode: string
  ): string {
    return `ranking/${areaType}/${rankingKey}/${timeCode}.json`;
  }

  /**
   * ランキングデータを削除
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @param timeCode - 時間コード
   */
  static async deleteRankingData(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    timeCode: string
  ): Promise<void> {
    try {
      const key = this.generateRankingKey(areaType, rankingKey, timeCode);
      const client = this.getClient();
      await client.deleteObject(key);
      console.log(`[EstatRankingR2Repository] ランキングデータを削除: ${key}`);
    } catch (error) {
      console.error(
        `[EstatRankingR2Repository] ランキングデータ削除失敗:`,
        error
      );
      throw error;
    }
  }

  /**
   * ランキングキー配下のすべてのデータキーを取得
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー（オプション）
   * @returns データキーの配列
   */
  static async listRankingKeys(
    areaType?: "prefecture" | "city" | "national",
    rankingKey?: string
  ): Promise<string[]> {
    try {
      const client = this.getClient();
      let prefix = "ranking/";

      if (areaType) {
        prefix += `${areaType}/`;
        if (rankingKey) {
          prefix += `${rankingKey}/`;
        }
      }

      const keys = await client.listObjects(prefix);
      return keys.filter((key) => key.startsWith(prefix) && key.endsWith(".json"));
    } catch {
      return [];
    }
  }

  /**
   * ランキングキー配下のすべてのデータを削除
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @returns 削除されたファイル数とキーの配列
   */
  static async deleteAllRankingDataByKey(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string
  ): Promise<{ deletedCount: number; deletedKeys: string[] }> {
    try {
      // 該当するすべてのファイルキーを取得
      const keys = await this.listRankingKeys(areaType, rankingKey);

      if (keys.length === 0) {
        console.log(
          `[EstatRankingR2Repository] 削除対象のファイルが見つかりません: ranking/${areaType}/${rankingKey}/`
        );
        return { deletedCount: 0, deletedKeys: [] };
      }

      const deletedKeys: string[] = [];
      const client = this.getClient();

      // 各ファイルを削除
      for (const key of keys) {
        try {
          await client.deleteObject(key);
          deletedKeys.push(key);
          console.log(`[EstatRankingR2Repository] ランキングデータを削除: ${key}`);
        } catch (error) {
          console.error(
            `[EstatRankingR2Repository] ファイル削除エラー: ${key}`,
            error
          );
          // エラーが発生しても続行
        }
      }

      console.log(
        `[EstatRankingR2Repository] ランキングデータ削除完了: ${deletedKeys.length}/${keys.length}件`
      );

      return {
        deletedCount: deletedKeys.length,
        deletedKeys,
      };
    } catch (error) {
      console.error(
        `[EstatRankingR2Repository] ランキングデータ一括削除失敗:`,
        error
      );
      return { deletedCount: 0, deletedKeys: [] };
    }
  }

  /**
   * ランキングメタデータをR2に保存
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @param metadata - メタデータ
   * @returns 保存されたキーとサイズ
   */
  static async saveRankingMetadata(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    metadata: RankingMetadata
  ): Promise<{ key: string; size: number }> {
    // キー生成: ranking/{areaType}/{rankingKey}/metadata.json
    const key = `ranking/${areaType}/${rankingKey}/metadata.json`;

    // メタデータをJSON形式で保存
    const jsonString = JSON.stringify(metadata, null, 2);
    const jsonBuffer = Buffer.from(jsonString, "utf-8");
    const client = this.getClient();

    await client.putObject(key, jsonBuffer, {
      contentType: "application/json",
      metadata: {
        "ranking-key": rankingKey,
        "area-type": areaType,
        "saved-at": metadata.saved_at,
        "data-source": "estat",
      },
    });

    console.log(`[EstatRankingR2Repository] ランキングメタデータを保存: ${key}`);

    return { key, size: jsonBuffer.length };
  }

  /**
   * R2からランキングメタデータを取得
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @returns メタデータ、またはnull（見つからない場合）
   */
  static async findRankingMetadata(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string
  ): Promise<RankingMetadata | null> {
    try {
      const key = `ranking/${areaType}/${rankingKey}/metadata.json`;
      const client = this.getClient();
      const buffer = await client.getObject(key);

      if (!buffer) {
        return null;
      }

      const metadata: RankingMetadata = JSON.parse(buffer.toString("utf-8"));

      console.log(
        `[EstatRankingR2Repository] ランキングメタデータを取得: ${key}`
      );

      return metadata;
    } catch (error) {
      console.warn(
        `[EstatRankingR2Repository] ランキングメタデータ取得失敗:`,
        error
      );
      return null;
    }
  }
}

