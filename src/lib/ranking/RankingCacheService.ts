/**
 * 汎用ランキングキャッシュサービス
 * 作成日: 2025-01-13
 * 目的: ranking_key ベースのデータ取得・保存
 */

import { createLocalD1Database } from "@/lib/db";
import { FormattedValue } from "@/lib/estat-api";

export interface RankingDataQuery {
  rankingKey: string;
  timeCode: string;
}

export interface RankingYearQuery {
  rankingKey: string;
}

/**
 * 汎用ランキングキャッシュサービス
 */
export class RankingCacheService {
  /**
   * ranking_key でデータ取得（データソース非依存）
   */
  static async getRankingData(
    rankingKey: string,
    timeCode: string
  ): Promise<FormattedValue[]> {
    const db = await createLocalD1Database();

    const result = await db
      .prepare(
        `
        SELECT
          rv.value,
          rv.numeric_value,
          rv.display_value,
          rv.rank,
          rv.area_code,
          rv.area_name,
          rv.time_code,
          rv.time_name,
          ri.unit,
          ri.name as category_name
        FROM ranking_values rv
        JOIN ranking_items ri ON rv.ranking_key = ri.ranking_key
        WHERE rv.ranking_key = ? AND rv.time_code = ?
        ORDER BY rv.rank ASC
      `
      )
      .bind(rankingKey, timeCode)
      .all();

    return result.results.map((row: any) => ({
      value: row.value,
      numericValue: row.numeric_value,
      displayValue: row.display_value,
      rank: row.rank,
      areaCode: row.area_code,
      areaName: row.area_name,
      timeCode: row.time_code,
      timeName: row.time_name,
      unit: row.unit,
      categoryName: row.category_name,
    }));
  }

  /**
   * ranking_key の利用可能年度取得
   */
  static async getAvailableYears(rankingKey: string): Promise<string[]> {
    const db = await createLocalD1Database();

    const result = await db
      .prepare(
        `
        SELECT DISTINCT time_code, time_name
        FROM ranking_values
        WHERE ranking_key = ?
        ORDER BY time_code DESC
      `
      )
      .bind(rankingKey)
      .all();

    return result.results.map((row: any) => row.time_code);
  }

  /**
   * ranking_key でデータ保存
   */
  static async saveRankingData(
    rankingKey: string,
    data: FormattedValue[]
  ): Promise<void> {
    const db = await createLocalD1Database();

    // 既存データを削除
    await db
      .prepare("DELETE FROM ranking_values WHERE ranking_key = ?")
      .bind(rankingKey)
      .run();

    // 新しいデータを挿入
    const insertStmt = db.prepare(`
      INSERT INTO ranking_values (
        ranking_key, area_code, area_name, time_code, time_name,
        value, numeric_value, display_value, rank
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of data) {
      await insertStmt
        .bind(
          rankingKey,
          item.areaCode,
          item.areaName,
          item.timeCode,
          item.timeName,
          item.value,
          item.numericValue,
          item.displayValue,
          item.rank
        )
        .run();
    }
  }

  /**
   * ranking_key の存在確認
   */
  static async existsRankingKey(rankingKey: string): Promise<boolean> {
    const db = await createLocalD1Database();

    const result = await db
      .prepare("SELECT 1 FROM ranking_items WHERE ranking_key = ?")
      .bind(rankingKey)
      .first();

    return !!result;
  }

  /**
   * データソース固有のメタデータ取得
   */
  static async getDataSourceMetadata(
    rankingKey: string,
    dataSourceId: string
  ): Promise<Record<string, any> | null> {
    const db = await createLocalD1Database();

    const result = await db
      .prepare(
        `
        SELECT dsm.metadata
        FROM data_source_metadata dsm
        JOIN ranking_items ri ON dsm.ranking_item_id = ri.id
        WHERE ri.ranking_key = ? AND dsm.data_source_id = ?
      `
      )
      .bind(rankingKey, dataSourceId)
      .first();

    if (!result) {
      return null;
    }

    try {
      return JSON.parse(result.metadata);
    } catch (error) {
      console.error("Failed to parse metadata JSON:", error);
      return null;
    }
  }

  /**
   * e-Stat固有のメタデータ取得（後方互換性のため）
   */
  static async getEstatMetadata(rankingKey: string): Promise<{
    statsDataId: string;
    cdCat01: string;
  } | null> {
    const metadata = await this.getDataSourceMetadata(rankingKey, "estat");

    if (!metadata) {
      return null;
    }

    return {
      statsDataId: metadata.stats_data_id,
      cdCat01: metadata.cd_cat01,
    };
  }
}
