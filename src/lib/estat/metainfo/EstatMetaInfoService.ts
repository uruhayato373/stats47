import { estatAPI } from "@/services/estat-api";
import {
  EstatMetaCategoryData,
  EstatMetaInfoResponse,
  TransformedMetadataEntry,
  MetadataSummary,
  MetadataSearchResult,
} from "../types";

/**
 * e-STAT メタ情報サービスクラス
 * メタ情報の取得、変換、保存、検索を統合管理
 */
export class EstatMetaInfoService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * メタ情報を取得・変換・保存
   */
  async processAndSaveMetaInfo(statsDataId: string): Promise<{
    success: boolean;
    entriesProcessed: number;
    error?: string;
  }> {
    console.log("🔵 Service: processAndSaveMetaInfo 開始:", statsDataId);
    const startTime = Date.now();

    try {
      // 1. APIからメタ情報を取得
      console.log("🔵 Service: e-STAT API呼び出し開始");
      const apiStartTime = Date.now();
      const metaInfo = await estatAPI.getMetaInfo({ statsDataId });
      console.log(
        `✅ Service: e-STAT API呼び出し完了 (${Date.now() - apiStartTime}ms)`
      );

      // 2. CSV形式に変換
      console.log("🔵 Service: データ変換開始");
      const transformStartTime = Date.now();
      const transformedData = this.transformToCSVFormat(metaInfo);
      console.log(
        `✅ Service: データ変換完了 (${Date.now() - transformStartTime}ms) - ${
          transformedData.length
        }件`
      );

      // 3. データベースに保存
      console.log("🔵 Service: DB保存開始");
      const saveStartTime = Date.now();
      await this.saveTransformedData(transformedData);
      console.log(`✅ Service: DB保存完了 (${Date.now() - saveStartTime}ms)`);

      const totalTime = Date.now() - startTime;
      console.log(
        `✅ Service: processAndSaveMetaInfo 完了 (合計: ${totalTime}ms)`
      );

      return {
        success: true,
        entriesProcessed: transformedData.length,
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(
        `❌ Service: processAndSaveMetaInfo エラー (${totalTime}ms):`,
        error
      );

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        entriesProcessed: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * 複数の統計データIDを一括処理
   */
  async processBulkMetaInfo(
    statsDataIds: string[],
    options: {
      batchSize?: number;
      delayMs?: number;
    } = {}
  ): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      statsDataId: string;
      success: boolean;
      entriesProcessed: number;
      error?: string;
    }>;
  }> {
    const { batchSize = 10, delayMs = 1000 } = options;
    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // バッチ処理
    for (let i = 0; i < statsDataIds.length; i += batchSize) {
      const batch = statsDataIds.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (id) => ({
          statsDataId: id,
          ...(await this.processAndSaveMetaInfo(id)),
        }))
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          results.push(result.value);
          if (result.value.success) {
            successCount++;
          } else {
            failureCount++;
          }
        } else {
          results.push({
            statsDataId: "unknown",
            success: false,
            entriesProcessed: 0,
            error: result.reason?.message || "Processing failed",
          });
          failureCount++;
        }
      }

      // 次のバッチの前に待機（API制限対応）
      if (i + batchSize < statsDataIds.length && delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return {
      totalProcessed: statsDataIds.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * 統計データIDの範囲を指定して一括処理
   */
  async processMetaInfoRange(
    startId: string,
    endId: string,
    options?: {
      batchSize?: number;
      delayMs?: number;
    }
  ): Promise<{
    totalProcessed: number;
    successCount: number;
    failureCount: number;
    results: Array<{
      statsDataId: string;
      success: boolean;
      entriesProcessed: number;
      error?: string;
    }>;
  }> {
    const startNum = parseInt(startId);
    const endNum = parseInt(endId);

    if (isNaN(startNum) || isNaN(endNum)) {
      throw new Error("開始IDと終了IDは数値である必要があります");
    }

    if (startNum > endNum) {
      throw new Error("開始IDは終了ID以下である必要があります");
    }

    const statsDataIds: string[] = [];
    for (let i = startNum; i <= endNum; i++) {
      statsDataIds.push(i.toString().padStart(10, "0"));
    }

    return this.processBulkMetaInfo(statsDataIds, options);
  }

  /**
   * メタ情報を検索
   */
  async searchMetaInfo(
    query: string,
    options: {
      searchType?: "full" | "stat_name" | "category" | "stats_id";
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<MetadataSearchResult> {
    const { searchType = "full", limit = 100, offset = 0 } = options;

    let sqlQuery: string;
    let params: string[];

    switch (searchType) {
      case "stat_name":
        sqlQuery = `
          SELECT *, ranking_key FROM estat_metainfo
          WHERE stat_name LIKE ?
          ORDER BY stat_name, title
          LIMIT ? OFFSET ?
        `;
        params = [`%${query}%`, limit.toString(), offset.toString()];
        break;

      case "category":
        sqlQuery = `
          SELECT *, ranking_key FROM estat_metainfo
          WHERE cat01 = ?
          ORDER BY stat_name, title
          LIMIT ? OFFSET ?
        `;
        params = [query, limit.toString(), offset.toString()];
        break;

      case "stats_id":
        sqlQuery = `
          SELECT *, ranking_key FROM estat_metainfo
          WHERE stats_data_id = ?
          ORDER BY cat01, item_name
          LIMIT ? OFFSET ?
        `;
        params = [query, limit.toString(), offset.toString()];
        break;

      default: // full
        sqlQuery = `
          SELECT *, ranking_key FROM estat_metainfo
          WHERE stat_name LIKE ? OR title LIKE ? OR item_name LIKE ?
          ORDER BY stat_name, title
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
      entries: result.results as unknown as EstatMetaCategoryData[],
      totalCount,
      searchQuery: query,
      executedAt: new Date().toISOString(),
    };
  }

  /**
   * メタ情報サマリーを取得
   */
  async getMetaInfoSummary(): Promise<MetadataSummary> {
    // 総エントリ数
    const totalResult = await this.db
      .prepare("SELECT COUNT(*) as count FROM estat_metainfo")
      .first();
    const totalEntries = totalResult
      ? (totalResult as { count: number }).count
      : 0;

    // ユニーク統計数
    const uniqueResult = await this.db
      .prepare(
        "SELECT COUNT(DISTINCT stats_data_id) as count FROM estat_metainfo"
      )
      .first();
    const uniqueStats = uniqueResult
      ? (uniqueResult as { count: number }).count
      : 0;

    // カテゴリ別件数
    const categoryResult = await this.db
      .prepare(
        `
        SELECT cat01 as code,
               MAX(item_name) as name,
               COUNT(*) as count
        FROM estat_metainfo
        GROUP BY cat01
        ORDER BY count DESC
        LIMIT 20
      `
      )
      .all();

    const categories = (
      categoryResult.results as Array<{
        code: string;
        name: string;
        count: number;
      }>
    ).map((row) => ({
      code: row.code,
      name: row.name,
      count: row.count,
    }));

    // 最終更新日時
    const lastUpdatedResult = await this.db
      .prepare("SELECT MAX(updated_at) as last_updated FROM estat_metainfo")
      .first();
    const lastUpdated = lastUpdatedResult
      ? (lastUpdatedResult as { last_updated: string }).last_updated
      : null;

    return {
      totalEntries,
      uniqueStats,
      categories,
      lastUpdated,
    };
  }

  /**
   * stats_data_idとcat01からranking_keyを検索
   */
  async findRankingKey(
    statsDataId: string,
    cat01: string
  ): Promise<string | null> {
    try {
      const result = await this.db
        .prepare(
          `
        SELECT ri.ranking_key
        FROM ranking_items ri
        JOIN data_source_metadata dsm ON ri.id = dsm.ranking_item_id
        WHERE dsm.data_source_id = 'estat'
          AND json_extract(dsm.metadata, '$.stats_data_id') = ?
          AND json_extract(dsm.metadata, '$.cd_cat01') = ?
        LIMIT 1
      `
        )
        .bind(statsDataId, cat01)
        .first();

      return result?.ranking_key || null;
    } catch (error) {
      console.warn(
        `Failed to find ranking_key for ${statsDataId}/${cat01}:`,
        error
      );
      return null;
    }
  }

  /**
   * 統計データ一覧を取得
   */
  async getStatsList(
    options: {
      orderBy?: "last_updated" | "stat_name" | "item_count";
    } = {}
  ): Promise<
    Array<{
      stats_data_id: string;
      stat_name: string;
      title: string;
      item_count: number;
      last_updated: string;
    }>
  > {
    const { orderBy = "last_updated" } = options;

    const orderClause = {
      last_updated: "updated_at DESC",
      stat_name: "stat_name ASC",
      item_count: "item_count DESC",
    }[orderBy];

    const result = await this.db
      .prepare(
        `SELECT stats_data_id, stat_name, title, item_count, updated_at as last_updated FROM estat_metainfo_unique ORDER BY ${orderClause}`
      )
      .all();

    return result.results as Array<{
      stats_data_id: string;
      stat_name: string;
      title: string;
      item_count: number;
      last_updated: string;
    }>;
  }

  /**
   * メタ情報をCSV形式に変換
   */
  private transformToCSVFormat(
    metaInfo: EstatMetaInfoResponse
  ): TransformedMetadataEntry[] {
    console.log("🔵 Service: transformToCSVFormat 開始");
    const startTime = Date.now();

    const metaData = metaInfo.GET_META_INFO?.METADATA_INF;
    if (!metaData) {
      throw new Error("メタ情報が見つかりません");
    }

    const tableInfo = metaData.TABLE_INF;
    const classInfo = metaData.CLASS_INF?.CLASS_OBJ;

    if (!tableInfo || !classInfo) {
      throw new Error("必要なメタ情報が不足しています");
    }

    const result: TransformedMetadataEntry[] = [];
    const statsDataId = tableInfo["@id"] || "";
    const statName = tableInfo.STAT_NAME?.$ || "";
    const title = tableInfo.TITLE?.$ || "";

    // カテゴリ情報を取得（cat01のみ）
    const cat01Class = classInfo.find(
      (cls: { "@id": string }) => cls["@id"] === "cat01"
    );
    if (!cat01Class?.CLASS) {
      throw new Error("cat01カテゴリが見つかりません");
    }

    const categories = Array.isArray(cat01Class.CLASS)
      ? cat01Class.CLASS
      : [cat01Class.CLASS];

    console.log(`🔵 Service: ${categories.length}個のカテゴリを処理中`);

    // 各カテゴリをCSV行として変換
    categories.forEach(
      (category: {
        "@code"?: string;
        "@name"?: string | undefined;
        "@unit"?: string;
      }) => {
        const itemName = category["@name"] || null;
        result.push({
          stats_data_id: statsDataId,
          stat_name: statName,
          title: title,
          cat01: category["@code"] ?? "",
          item_name: itemName,
          unit: category["@unit"] || null,
        });
      }
    );

    console.log(
      `✅ Service: transformToCSVFormat 完了 (${Date.now() - startTime}ms) - ${
        result.length
      }件`
    );
    return result;
  }

  /**
   * 変換されたデータをデータベースに保存
   * バッチサイズ最適化 + 並列処理
   */
  private async saveTransformedData(
    dataList: TransformedMetadataEntry[]
  ): Promise<void> {
    console.log(`🔵 Service: saveTransformedData 開始 - ${dataList.length}件`);
    const startTime = Date.now();

    if (dataList.length === 0) {
      console.log("✅ Service: saveTransformedData 完了 - データなし");
      return;
    }

    // 最適化されたバッチサイズ
    const batchSize = 20;
    const chunks = [];
    for (let i = 0; i < dataList.length; i += batchSize) {
      chunks.push(dataList.slice(i, i + batchSize));
    }
    console.log(
      `🔵 Service: ${chunks.length}個のチャンクに分割 (${batchSize}件/チャンク)`
    );

    // 並列処理（最大3チャンク同時）
    const concurrencyLimit = 3;
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const batchGroup = chunks.slice(i, i + concurrencyLimit);
      const batchStartTime = Date.now();

      console.log(
        `🔵 Service: チャンクグループ処理開始 (${i + 1}-${Math.min(
          i + concurrencyLimit,
          chunks.length
        )}/${chunks.length})`
      );

      await Promise.all(
        batchGroup.map(async (chunk, index) => {
          const chunkIndex = i + index + 1;
          const chunkStartTime = Date.now();
          await this.processBatch(chunk);
          console.log(
            `✅ Service: チャンク${chunkIndex}/${chunks.length} 保存完了 (${
              Date.now() - chunkStartTime
            }ms)`
          );
          processedCount += chunk.length;
        })
      );

      console.log(
        `✅ Service: チャンクグループ完了 (${
          Date.now() - batchStartTime
        }ms) - 進捗: ${processedCount}/${dataList.length}件`
      );
    }

    const totalTime = Date.now() - startTime;
    const avgTimePerRecord = (totalTime / dataList.length).toFixed(2);
    console.log(
      `✅ Service: saveTransformedData 完了 (合計: ${totalTime}ms, 平均: ${avgTimePerRecord}ms/件)`
    );
  }

  /**
   * バッチ処理（D1 Batch API使用 + バルクINSERT）
   */
  private async processBatch(
    dataList: TransformedMetadataEntry[]
  ): Promise<void> {
    if (dataList.length === 0) return;

    // SQLインジェクション対策: エスケープ関数
    const escape = (str: string | null): string => {
      if (str === null) return "NULL";
      return `'${str.replace(/'/g, "''")}'`;
    };

    // バルクINSERT用のVALUES句を生成（ranking_keyを含む）
    const values = await Promise.all(
      dataList.map(async (data) => {
        // ranking_keyを検索
        const rankingKey = data.cat01
          ? await this.findRankingKey(data.stats_data_id, data.cat01)
          : null;

        return `(
        ${escape(data.stats_data_id)},
        ${escape(data.stat_name)},
        ${escape(data.title)},
        ${escape(data.cat01)},
        ${escape(data.item_name)},
        ${escape(data.unit)},
        ${escape(rankingKey)},
        CURRENT_TIMESTAMP
      )`;
      })
    );

    const query = `
      INSERT INTO estat_metainfo
      (stats_data_id, stat_name, title, cat01, item_name, unit, ranking_key, updated_at)
      VALUES ${values.join(",")}
      ON CONFLICT(stats_data_id, cat01)
      DO UPDATE SET
        stat_name = excluded.stat_name,
        title = excluded.title,
        item_name = excluded.item_name,
        unit = excluded.unit,
        ranking_key = excluded.ranking_key,
        updated_at = CURRENT_TIMESTAMP
    `;

    console.log("🔵 Service: SQL Length:", query.length);
    console.log("🔵 Service: SQL Preview:", query.substring(0, 200) + "...");

    try {
      await this.db.prepare(query).run();
    } catch (error) {
      console.error(
        `❌ Service: バッチ保存エラー (${dataList.length}件):`,
        error
      );
      throw error;
    }
  }

  // ============================================================================
  // 高レベルAPI（EstatMetadataServiceから統合）
  // ============================================================================

  /**
   * 単一の統計表IDからメタ情報を取得・変換・保存（高レベルAPI）
   */
  async fetchAndSaveMetadata(statsDataId: string): Promise<void> {
    const result = await this.processAndSaveMetaInfo(statsDataId);
    if (!result.success) {
      throw new Error(result.error || "メタ情報の保存に失敗しました");
    }
  }

  /**
   * 複数の統計表IDを一括処理（高レベルAPI）
   */
  async fetchAndSaveMultipleMetadata(statsDataIds: string[]): Promise<void> {
    await this.processBulkMetaInfo(statsDataIds);
  }

  /**
   * 統計表IDの範囲を指定して一括処理（高レベルAPI）
   */
  async fetchAndSaveMetadataRange(
    startId: string,
    endId: string
  ): Promise<void> {
    await this.processMetaInfoRange(startId, endId);
  }

  /**
   * 保存済みデータの検索（高レベルAPI）
   */
  async searchSavedMetadata(query: string): Promise<EstatMetaCategoryData[]> {
    const result = await this.searchMetaInfo(query);
    return result.entries;
  }

  /**
   * 統計表一覧取得（高レベルAPI）
   */
  async getSavedStatList(): Promise<
    Array<{
      stats_data_id: string;
      stat_name: string;
      title: string;
      item_count: number;
      first_created: string;
      last_updated: string;
    }>
  > {
    const statsList = await this.getStatsList();
    return statsList.map((stat) => ({
      ...stat,
      first_created: stat.last_updated, // 現在はlast_updatedと同じ値を使用
    }));
  }

  /**
   * データ件数取得（高レベルAPI）
   */
  async getSavedDataCount(): Promise<number> {
    const summary = await this.getMetaInfoSummary();
    return summary.totalEntries;
  }

  /**
   * 統計表IDで保存済みデータを取得（高レベルAPI）
   */
  async getSavedMetadataByStatsId(
    statsDataId: string
  ): Promise<EstatMetaCategoryData[]> {
    const result = await this.searchMetaInfo(statsDataId, {
      searchType: "stats_id",
    });
    return result.entries;
  }

  /**
   * カテゴリで保存済みデータを取得（高レベルAPI）
   */
  async getSavedMetadataByCategory(
    category: string
  ): Promise<EstatMetaCategoryData[]> {
    const result = await this.searchMetaInfo(category, {
      searchType: "category",
    });
    return result.entries;
  }
}
