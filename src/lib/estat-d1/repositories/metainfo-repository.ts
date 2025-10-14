import {
  EstatMetaCategoryData,
  TransformedMetadataEntry,
  MetadataSummary,
  MetadataSearchResult,
} from "../../estat-api/types";

/**
 * e-STAT メタ情報リポジトリ
 * D1データベースへのCRUD操作を担当
 */
export class EstatMetaInfoRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * 変換されたデータをデータベースに保存
   */
  async saveTransformedData(
    dataList: TransformedMetadataEntry[]
  ): Promise<void> {
    console.log(
      `🔵 Repository: saveTransformedData 開始 - ${dataList.length}件`
    );
    const startTime = Date.now();

    if (dataList.length === 0) {
      console.log("✅ Repository: saveTransformedData 完了 - データなし");
      return;
    }

    // 最適化されたバッチサイズ
    const batchSize = 20;
    const chunks = [];
    for (let i = 0; i < dataList.length; i += batchSize) {
      chunks.push(dataList.slice(i, i + batchSize));
    }
    console.log(
      `🔵 Repository: ${chunks.length}個のチャンクに分割 (${batchSize}件/チャンク)`
    );

    // 並列処理（最大3チャンク同時）
    const concurrencyLimit = 3;
    let processedCount = 0;

    for (let i = 0; i < chunks.length; i += concurrencyLimit) {
      const batchGroup = chunks.slice(i, i + concurrencyLimit);
      const batchStartTime = Date.now();

      console.log(
        `🔵 Repository: チャンクグループ処理開始 (${i + 1}-${Math.min(
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
            `✅ Repository: チャンク${chunkIndex}/${chunks.length} 保存完了 (${
              Date.now() - chunkStartTime
            }ms)`
          );
          processedCount += chunk.length;
        })
      );

      console.log(
        `✅ Repository: チャンクグループ完了 (${
          Date.now() - batchStartTime
        }ms) - 進捗: ${processedCount}/${dataList.length}件`
      );
    }

    const totalTime = Date.now() - startTime;
    const avgTimePerRecord = (totalTime / dataList.length).toFixed(2);
    console.log(
      `✅ Repository: saveTransformedData 完了 (合計: ${totalTime}ms, 平均: ${avgTimePerRecord}ms/件)`
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

    console.log("🔵 Repository: SQL Length:", query.length);
    console.log("🔵 Repository: SQL Preview:", query.substring(0, 200) + "...");

    try {
      await this.db.prepare(query).run();
    } catch (error) {
      console.error(
        `❌ Repository: バッチ保存エラー (${dataList.length}件):`,
        error
      );
      throw error;
    }
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
}
