import "server-only";

import { EstatRankingR2Repository } from "../repositories/rankingR2Repository";
import type {
  EstatRankingMapping,
  RankingMetadata,
  RankingMetadataTime,
} from "../types";

/**
 * メタデータ生成サービス
 *
 * ランキングデータのメタ情報を生成・更新する機能を提供します。
 */
export class MetadataGenerator {
  /**
   * 時間コード（10桁）から年度コード（4桁）を抽出
   *
   * @param timeCode - 時間コード（例: "2020000000"）
   * @returns 年度コード（例: "2020"）
   */
  private static extractYear(timeCode: string): string {
    // 10桁の時間コードから最初の4桁を抽出
    if (timeCode.length >= 4) {
      return timeCode.substring(0, 4);
    }
    return timeCode;
  }

  /**
   * 年度コードから年度名を生成
   *
   * @param yearCode - 年度コード（例: "2020"）
   * @returns 年度名（例: "2020年度"）
   */
  private static generateTimeName(yearCode: string): string {
    return `${yearCode}年度`;
  }

  /**
   * R2からランキングキー配下のすべての時間コードを取得
   *
   * @param areaType - 地域タイプ
   * @param rankingKey - ランキングキー
   * @returns 時間コードの配列（ソート済み）
   */
  private static async getTimeCodesFromR2(
    areaType: "prefecture" | "city" | "national",
    rankingKey: string
  ): Promise<string[]> {
    try {
      // ランキングキー配下のすべてのファイルキーを取得
      const keys = await EstatRankingR2Repository.listRankingKeys(
        areaType,
        rankingKey
      );

      // パターン: ranking/{areaType}/{rankingKey}/{timeCode}.json
      const pattern = new RegExp(
        `^ranking/${areaType}/${rankingKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(.+)\\.json$`
      );

      const timeCodes: string[] = [];

      for (const key of keys) {
        const match = key.match(pattern);
        if (match && match[1]) {
          // metadata.jsonは除外
          if (match[1] !== "metadata") {
            timeCodes.push(match[1]);
          }
        }
      }

      // 重複を除去してソート
      return Array.from(new Set(timeCodes)).sort();
    } catch (error) {
      console.error(
        `[MetadataGenerator] 時間コード取得エラー: ${areaType}/${rankingKey}`,
        error
      );
      return [];
    }
  }

  /**
   * 時間コード配列から年度情報配列を生成
   *
   * @param timeCodes - 時間コード配列（10桁）
   * @returns 年度情報配列
   */
  private static generateTimes(timeCodes: string[]): RankingMetadataTime[] {
    const yearMap = new Map<string, string>(); // yearCode -> fullTimeCode

    // 各時間コードから年度コードを抽出
    for (const timeCode of timeCodes) {
      const yearCode = this.extractYear(timeCode);
      // 同じ年度コードが複数ある場合は、最初のものを保持
      if (!yearMap.has(yearCode)) {
        yearMap.set(yearCode, timeCode);
      }
    }

    // 年度コードでソートして年度情報配列を生成
    return Array.from(yearMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearCode]) => ({
        timeCode: yearCode,
        timeName: this.generateTimeName(yearCode),
      }));
  }

  /**
   * ランキングマッピングからメタデータを生成
   *
   * @param mapping - ランキングマッピング
   * @param timeCodes - 時間コード配列（指定がない場合はR2から取得）
   * @returns メタデータ
   */
  static async generateMetadata(
    mapping: EstatRankingMapping,
    timeCodes?: string[]
  ): Promise<RankingMetadata> {
    // 時間コードが指定されていない場合はR2から取得
    const actualTimeCodes =
      timeCodes ||
      (await this.getTimeCodesFromR2(mapping.area_type, mapping.item_code));

    // 年度情報配列を生成
    const times = this.generateTimes(actualTimeCodes);

    return {
      itemCode: mapping.item_code,
      item_name: mapping.item_name,
      unit: mapping.unit,
      stats_data_id: mapping.stats_data_id,
      cat01: mapping.cat01,
      area_type: mapping.area_type,
      saved_at: new Date().toISOString(),
      data_source: "estat",
      times,
    };
  }

  /**
   * 既存のメタデータを更新（年度情報のみ追加）
   *
   * @param existingMetadata - 既存のメタデータ
   * @param newTimeCodes - 新しい時間コード配列
   * @returns 更新されたメタデータ
   */
  static updateMetadataWithNewTimes(
    existingMetadata: RankingMetadata,
    newTimeCodes: string[]
  ): RankingMetadata {
    // 既存の年度情報を取得
    const existingYearCodes = new Set(
      existingMetadata.times.map((t) => t.timeCode)
    );

    // 新しい時間コードから年度情報を生成
    const newTimes = this.generateTimes(newTimeCodes);

    // 既存の年度情報と統合（重複除去）
    const mergedTimes: RankingMetadataTime[] = [];
    const allYearCodes = new Set([
      ...existingYearCodes,
      ...newTimes.map((t) => t.timeCode),
    ]);

    for (const yearCode of Array.from(allYearCodes).sort()) {
      mergedTimes.push({
        timeCode: yearCode,
        timeName: this.generateTimeName(yearCode),
      });
    }

    return {
      ...existingMetadata,
      times: mergedTimes,
      saved_at: new Date().toISOString(),
    };
  }
}

