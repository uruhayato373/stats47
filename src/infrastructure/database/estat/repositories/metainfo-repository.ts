import type { AreaType } from "@/features/ranking/types";
import { getDataProvider } from "@/infrastructure/database";
import type { MockDataProvider } from "@/infrastructure/database/mock";
import { buildEnvironmentConfig } from "@/lib/environment";

import type {
  EstatMetaInfo,
  EstatMetaInfoListOptions,
  EstatMetaInfoSearchOptions,
  EstatMetaInfoSearchResult,
  EstatMetaInfoSummary,
  SaveEstatMetaInfoInput,
} from "../types/metainfo";

/**
 * e-Stat メタ情報リポジトリ
 * 統計表レベル（stats_data_id）での管理に特化
 */
export class EstatMetaInfoRepository {
  private db: D1Database | MockDataProvider;

  constructor(db: D1Database | MockDataProvider) {
    this.db = db;
  }

  /**
   * e-Statメタデータからarea_typeを判定する
   * @param metaInfo - e-Stat APIのメタ情報レスポンス
   * @returns 地域タイプ
   */
  private determineAreaType(metaInfo: any): AreaType {
    const tableInf = metaInfo?.GET_META_INFO?.METADATA_INF?.TABLE_INF;
    const tabulationCategory =
      tableInf?.STATISTICS_NAME_SPEC?.TABULATION_CATEGORY;

    if (!tabulationCategory) {
      return "national";
    }

    if (tabulationCategory.includes("市区町村")) {
      return "city";
    }
    if (tabulationCategory.includes("都道府県")) {
      return "prefecture";
    }
    return "national";
  }

  /**
   * 環境に応じた適切なリポジトリインスタンスを作成
   */
  static async create(): Promise<EstatMetaInfoRepository> {
    const config = buildEnvironmentConfig();

    console.log(
      `[${config.environment}] Creating EstatMetaInfoRepository with database provider`
    );
    const db = await getDataProvider();
    return new EstatMetaInfoRepository(db);
  }

  /**
   * 統計表メタデータを保存
   */
  async saveStatsData(data: SaveEstatMetaInfoInput): Promise<void> {
    console.log(`🔵 Repository: saveStatsData - ${data.stats_data_id}`);

    // MockDataProviderの場合は何もしない（読み取り専用）
    if (this.db instanceof MockDataProvider) {
      console.log(
        `⚠️ Repository: MockDataProvider - saveStatsData skipped for ${data.stats_data_id}`
      );
      return;
    }

    await this.db
      .prepare(
        `
      INSERT INTO estat_metainfo 
      (stats_data_id, stat_name, title, area_type, cycle, survey_date, description, last_fetched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(stats_data_id) DO UPDATE SET
        stat_name = excluded.stat_name,
        title = excluded.title,
        area_type = excluded.area_type,
        cycle = excluded.cycle,
        survey_date = excluded.survey_date,
        description = excluded.description,
        last_fetched_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    `
      )
      .bind(
        data.stats_data_id,
        data.stat_name,
        data.title,
        data.area_type,
        data.cycle || null,
        data.survey_date || null,
        data.description || null
      )
      .run();

    console.log(
      `✅ Repository: saveStatsData completed - ${data.stats_data_id}`
    );
  }

  /**
   * 複数の統計表メタデータを一括保存
   */
  async saveStatsDataBatch(dataList: SaveEstatMetaInfoInput[]): Promise<void> {
    if (dataList.length === 0) {
      console.log("✅ Repository: saveStatsDataBatch - No data to save");
      return;
    }

    // MockDataProviderの場合は何もしない（読み取り専用）
    if (this.db instanceof MockDataProvider) {
      console.log(
        `⚠️ Repository: MockDataProvider - saveStatsDataBatch skipped for ${dataList.length} items`
      );
      return;
    }

    console.log(`🔵 Repository: saveStatsDataBatch - ${dataList.length} items`);
    const startTime = Date.now();

    // バッチサイズを制限（D1の制限を考慮）
    const batchSize = 20;
    const chunks = [];
    for (let i = 0; i < dataList.length; i += batchSize) {
      chunks.push(dataList.slice(i, i + batchSize));
    }

    // 並列処理（最大3チャンク同時）
    const concurrencyLimit = 3;
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const batchGroup = chunks.slice(i, i + concurrencyLimit);

      await Promise.all(
        batchGroup.map(async (chunk) => {
          await this.processBatch(chunk);
          processedCount += chunk.length;
        })
      );
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `✅ Repository: saveStatsDataBatch completed - ${processedCount} items in ${totalTime}ms`
    );
  }

  /**
   * バッチ処理（D1 Batch API使用）
   */
  private async processBatch(
    dataList: SaveEstatMetaInfoInput[]
  ): Promise<void> {
    if (dataList.length === 0) return;

    const statements = dataList.map((data) =>
      this.db
        .prepare(
          `
        INSERT INTO estat_metainfo 
        (stats_data_id, stat_name, title, area_type, cycle, survey_date, description, last_fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(stats_data_id) DO UPDATE SET
          stat_name = excluded.stat_name,
          title = excluded.title,
          area_type = excluded.area_type,
          cycle = excluded.cycle,
          survey_date = excluded.survey_date,
          description = excluded.description,
          last_fetched_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `
        )
        .bind(
          data.stats_data_id,
          data.stat_name,
          data.title,
          data.area_type,
          data.cycle || null,
          data.survey_date || null,
          data.description || null
        )
    );

    await this.db.batch(statements);
  }

  /**
   * メタ情報を検索
   */
  async searchMetaInfo(
    query: string,
    options: EstatMetaInfoSearchOptions = {}
  ): Promise<EstatMetaInfoSearchResult> {
    const { limit = 50, offset = 0, searchType = "full" } = options;

    // MockDataProviderの場合は空の結果を返す
    if (this.db instanceof MockDataProvider) {
      return {
        items: [],
        totalCount: 0,
        searchQuery: query,
        executedAt: new Date().toISOString(),
      };
    }

    let sqlQuery: string;
    let params: string[];

    switch (searchType) {
      case "stat_name":
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE stat_name LIKE ?
          ORDER BY updated_at DESC
          LIMIT ? OFFSET ?
        `;
        params = [`%${query}%`, limit.toString(), offset.toString()];
        break;

      case "title":
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE title LIKE ?
          ORDER BY updated_at DESC
          LIMIT ? OFFSET ?
        `;
        params = [`%${query}%`, limit.toString(), offset.toString()];
        break;

      case "description":
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE description LIKE ?
          ORDER BY updated_at DESC
          LIMIT ? OFFSET ?
        `;
        params = [`%${query}%`, limit.toString(), offset.toString()];
        break;

      default: // full
        sqlQuery = `
          SELECT * FROM estat_metainfo
          WHERE stat_name LIKE ? OR title LIKE ? OR description LIKE ?
          ORDER BY updated_at DESC
          LIMIT ? OFFSET ?
        `;
        params = [
          `%${query}%`,
          `%${query}%`,
          `%${query}%`,
          limit.toString(),
          offset.toString(),
        ];
        break;
    }

    const result = await this.db
      .prepare(sqlQuery)
      .bind(...params)
      .all();

    // 総件数を取得
    const countQuery = sqlQuery
      .replace(/SELECT \* FROM/, "SELECT COUNT(*) as count FROM")
      .replace(/ORDER BY.*LIMIT.*OFFSET.*/, "");
    const countParams = params.slice(0, -2); // LIMIT と OFFSET を除く
    const countResult = await this.db
      .prepare(countQuery)
      .bind(...countParams)
      .first();
    const totalCount = countResult
      ? (countResult as { count: number }).count
      : 0;

    return {
      items: result.results as EstatMetaInfo[],
      totalCount,
      searchQuery: query,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * 統計表一覧を取得
   */
  async getStatsList(
    options: EstatMetaInfoListOptions = {}
  ): Promise<EstatMetaInfo[]> {
    const {
      limit = 50,
      offset = 0,
      orderBy = "updated_at",
      orderDirection = "DESC",
    } = options;

    // MockDataProviderの場合は空の結果を返す
    if (this.db instanceof MockDataProvider) {
      return [];
    }

    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metainfo
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT ? OFFSET ?
    `
      )
      .bind(limit, offset)
      .all();

    return result.results as unknown as EstatMetaInfo[];
  }

  /**
   * 特定の統計表を取得
   */
  async getStatsData(statsDataId: string): Promise<EstatMetaInfo | null> {
    // MockDataProviderの場合はnullを返す
    if (this.db instanceof MockDataProvider) {
      return null;
    }

    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metainfo WHERE stats_data_id = ?
    `
      )
      .bind(statsDataId)
      .first();

    return result as EstatMetaInfo | null;
  }

  /**
   * 統計表の存在確認
   */
  async exists(statsDataId: string): Promise<boolean> {
    // MockDataProviderの場合はfalseを返す
    if (this.db instanceof MockDataProvider) {
      return false;
    }

    const result = await this.db
      .prepare(
        `
      SELECT 1 FROM estat_metainfo WHERE stats_data_id = ? LIMIT 1
    `
      )
      .bind(statsDataId)
      .first();

    return result !== null;
  }

  /**
   * メタ情報サマリーを取得
   */
  async getMetaInfoSummary(): Promise<EstatMetaInfoSummary> {
    // MockDataProviderの場合は空の結果を返す
    if (this.db instanceof MockDataProvider) {
      return { totalEntries: 0, lastUpdated: null };
    }

    const totalResult = await this.db
      .prepare("SELECT COUNT(*) as count FROM estat_metainfo")
      .first();
    const totalEntries = totalResult
      ? (totalResult as { count: number }).count
      : 0;

    const lastUpdatedResult = await this.db
      .prepare("SELECT MAX(updated_at) as last_updated FROM estat_metainfo")
      .first();
    const lastUpdated = lastUpdatedResult
      ? (lastUpdatedResult as { last_updated: string }).last_updated
      : null;

    return { totalEntries, lastUpdated };
  }

  /**
   * 統計表を削除
   */
  async deleteStatsData(statsDataId: string): Promise<boolean> {
    // MockDataProviderの場合は何もしない（読み取り専用）
    if (this.db instanceof MockDataProvider) {
      console.log(
        `⚠️ Repository: MockDataProvider - deleteStatsData skipped for ${statsDataId}`
      );
      return false;
    }

    const result = await this.db
      .prepare(
        `
      DELETE FROM estat_metainfo WHERE stats_data_id = ?
    `
      )
      .bind(statsDataId)
      .run();

    return (result as any).changes > 0;
  }

  /**
   * area_typeで絞り込んで統計表一覧を取得
   */
  async getStatsListByAreaType(
    areaType: AreaType,
    options?: { limit?: number; offset?: number }
  ): Promise<EstatMetaInfo[]> {
    const { limit = 50, offset = 0 } = options || {};

    // MockDataProviderの場合は空の結果を返す
    if (this.db instanceof MockDataProvider) {
      return [];
    }

    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metainfo
      WHERE area_type = ?
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `
      )
      .bind(areaType, limit, offset)
      .all();

    return result.results as EstatMetaInfo[];
  }

  /**
   * 複数の統計表を削除
   */
  async deleteStatsDataBatch(statsDataIds: string[]): Promise<number> {
    if (statsDataIds.length === 0) return 0;

    // MockDataProviderの場合は何もしない（読み取り専用）
    if (this.db instanceof MockDataProvider) {
      console.log(
        `⚠️ Repository: MockDataProvider - deleteStatsDataBatch skipped for ${statsDataIds.length} items`
      );
      return 0;
    }

    const statements = statsDataIds.map((id) =>
      this.db
        .prepare(`DELETE FROM estat_metainfo WHERE stats_data_id = ?`)
        .bind(id)
    );

    const result = await this.db.batch(statements);
    return result.reduce((total, r) => total + (r as any).changes, 0);
  }
}
