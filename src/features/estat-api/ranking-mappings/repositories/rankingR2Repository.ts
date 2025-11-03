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
   * 10桁のtimeCodeから4桁の年度コードを抽出
   *
   * @param timeCode - 時間コード（例: "2020000000"）
   * @returns 年度コード（例: "2020"）
   */
  private static extractYearFromTimeCode(timeCode: string): string {
    // 10桁の時間コードから最初の4桁を抽出
    if (timeCode.length >= 4) {
      return timeCode.substring(0, 4);
    }
    return timeCode;
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
    // 10桁timeCodeから4桁年度コードを抽出してファイル名に使用
    const yearCode = this.extractYearFromTimeCode(timeCode);
    // キー生成: ranking/{areaType}/{rankingKey}/{yearCode}.json
    const key = `ranking/${areaType}/${rankingKey}/${yearCode}.json`;

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
      // 10桁timeCodeから4桁年度コードを抽出してファイル名に使用
      const yearCode = this.extractYearFromTimeCode(timeCode);
      const key = `ranking/${areaType}/${rankingKey}/${yearCode}.json`;
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
    // 10桁timeCodeから4桁年度コードを抽出してファイル名に使用
    const yearCode = this.extractYearFromTimeCode(timeCode);
    return `ranking/${areaType}/${rankingKey}/${yearCode}.json`;
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
   * ランキングデータが存在するか確認
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @param timeCode - 時間コード
   * @returns データが存在する場合はtrue、存在しない場合はfalse
   */
  static async hasRankingData(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string,
    timeCode: string
  ): Promise<boolean> {
    try {
      const key = this.generateRankingKey(areaType, rankingKey, timeCode);
      const keys = await this.listRankingKeys(areaType, rankingKey);
      return keys.includes(key);
    } catch {
      return false;
    }
  }

  /**
   * rankingディレクトリ配下のすべてのデータを一括削除
   *
   * @returns 削除されたファイル数とキーの配列
   */
  static async deleteAllRankingData(): Promise<{
    deletedCount: number;
    deletedKeys: string[];
  }> {
    try {
      console.log("[EstatRankingR2Repository] rankingディレクトリ配下の全データ削除開始");

      // rankingディレクトリ配下のすべてのオブジェクトを取得
      const client = this.getClient();
      const allKeys = await client.listObjects("ranking/");

      if (allKeys.length === 0) {
        console.log(
          "[EstatRankingR2Repository] 削除対象のファイルが見つかりません: ranking/"
        );
        return { deletedCount: 0, deletedKeys: [] };
      }

      console.log(
        `[EstatRankingR2Repository] 削除対象: ${allKeys.length}件のオブジェクト`
      );

      const deletedKeys: string[] = [];

      // 各オブジェクトを削除
      for (const key of allKeys) {
        try {
          await client.deleteObject(key);
          deletedKeys.push(key);
        } catch (error) {
          console.error(
            `[EstatRankingR2Repository] ファイル削除エラー: ${key}`,
            error
          );
          // エラーが発生しても続行
        }
      }

      console.log(
        `[EstatRankingR2Repository] rankingディレクトリ配下の全データ削除完了: ${deletedKeys.length}/${allKeys.length}件`
      );

      // 削除に失敗したオブジェクトがある場合は警告
      if (deletedKeys.length < allKeys.length) {
        const failedCount = allKeys.length - deletedKeys.length;
        console.warn(
          `[EstatRankingR2Repository] ${failedCount}件のオブジェクトの削除に失敗しました`
        );
      }

      return {
        deletedCount: deletedKeys.length,
        deletedKeys,
      };
    } catch (error) {
      console.error(
        "[EstatRankingR2Repository] rankingディレクトリ配下の全データ削除失敗:",
        error
      );
      return { deletedCount: 0, deletedKeys: [] };
    }
  }

  /**
   * ランキングキー配下のすべてのデータを削除（ランキングデータとメタデータの両方）
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
      // 該当するすべてのファイルキーを取得（ランキングデータファイル）
      const keys = await this.listRankingKeys(areaType, rankingKey);

      // メタデータファイルも追加
      const metadataKey = `ranking/${areaType}/${rankingKey}/metadata.json`;
      const allKeys = [...keys, metadataKey];

      if (allKeys.length === 0) {
        console.log(
          `[EstatRankingR2Repository] 削除対象のファイルが見つかりません: ranking/${areaType}/${rankingKey}/`
        );
        return { deletedCount: 0, deletedKeys: [] };
      }

      const deletedKeys: string[] = [];
      const client = this.getClient();

      // 各ファイルを削除
      for (const key of allKeys) {
        try {
          await client.deleteObject(key);
          deletedKeys.push(key);
          console.log(`[EstatRankingR2Repository] ランキングデータを削除: ${key}`);
        } catch (error) {
          // メタデータファイルが存在しない場合はエラーを無視
          if (key === metadataKey) {
            // メタデータファイルが存在しない場合はスキップ
            continue;
          }
          console.error(
            `[EstatRankingR2Repository] ファイル削除エラー: ${key}`,
            error
          );
          // エラーが発生しても続行
        }
      }

      console.log(
        `[EstatRankingR2Repository] ランキングデータ削除完了: ${deletedKeys.length}/${allKeys.length}件`
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

