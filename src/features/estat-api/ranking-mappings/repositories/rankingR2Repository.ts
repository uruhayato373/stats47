import "server-only";

/**
 * ランキングデータR2リポジトリ
 *
 * ランキングデータをR2ストレージに保存・取得する機能を提供します。
 */

import { R2S3Client, getR2S3Config } from "@/infrastructure/storage/s3-client";

import type { RankingExportPayload } from "../types";

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
   * @param payload - ランキングエクスポートペイロード
   * @returns 保存されたキーとサイズ
   */
  static async saveRankingData(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    timeCode: string,
    payload: RankingExportPayload
  ): Promise<{ key: string; size: number }> {
    // キー生成: ranking/{areaType}/{rankingKey}/{timeCode}.json
    const key = `ranking/${areaType}/${rankingKey}/${timeCode}.json`;

    const jsonString = JSON.stringify(payload, null, 2);
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
        "ranking-key": rankingKey,
        "area-type": areaType,
        "time-code": timeCode,
        "saved-at": new Date().toISOString(),
        "data-source": "estat",
        "unit": sanitize(payload.metadata.unit),
        "values-count": String(payload.values.length),
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
   * @returns ランキングエクスポートペイロード、またはnull（見つからない場合）
   */
  static async findRankingData(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    timeCode: string
  ): Promise<RankingExportPayload | null> {
    try {
      const key = `ranking/${areaType}/${rankingKey}/${timeCode}.json`;
      const client = this.getClient();
      const buffer = await client.getObject(key);

      if (!buffer) {
        return null;
      }

      const payload: RankingExportPayload = JSON.parse(
        buffer.toString("utf-8")
      );

      console.log(
        `[EstatRankingR2Repository] ランキングデータを取得: ${key}`
      );

      return payload;
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
}

