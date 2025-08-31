import { EstatMetaCategoryData } from "@/types/estat";

export class EstatMetadataDatabaseService {
  constructor(private db: D1Database) {}

  // 変換されたデータを一括保存
  async saveTransformedData(dataList: EstatMetaCategoryData[]): Promise<void> {
    if (dataList.length === 0) return;

    // バッチ処理（D1の制限を考慮）
    const batchSize = 100;

    for (let i = 0; i < dataList.length; i += batchSize) {
      const batch = dataList.slice(i, i + batchSize);
      await this.processBatch(batch);
    }
  }

  // バッチ処理
  private async processBatch(dataList: EstatMetaCategoryData[]): Promise<void> {
    // Cloudflare D1の正しいAPIを使用
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO estat_metadata 
      (stats_data_id, stat_name, title, cat01, item_name, unit, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    try {
      // 各データを個別に挿入（D1の制限を考慮）
      for (const data of dataList) {
        await stmt
          .bind(
            data.stats_data_id,
            data.stat_name,
            data.title,
            data.cat01,
            data.item_name,
            data.unit
          )
          .run();
      }
    } catch (error) {
      console.error("バッチ処理エラー:", error);
      throw error;
    }
  }

  // 統計表IDで検索
  async findByStatsId(statsDataId: string): Promise<EstatMetaCategoryData[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metadata 
      WHERE stats_data_id = ? 
      ORDER BY cat01, item_name
    `
      )
      .bind(statsDataId)
      .all();

    return result.results as EstatMetaCategoryData[];
  }

  // 統計名で検索
  async findByStatName(statName: string): Promise<EstatMetaCategoryData[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metadata 
      WHERE stat_name LIKE ? 
      ORDER BY title, cat01
    `
      )
      .bind(`%${statName}%`)
      .all();

    return result.results as EstatMetaCategoryData[];
  }

  // カテゴリで検索
  async findByCategory(category: string): Promise<EstatMetaCategoryData[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metadata 
      WHERE cat01 = ? 
      ORDER BY stat_name, title
    `
      )
      .bind(category)
      .all();

    return result.results as EstatMetaCategoryData[];
  }

  // 全文検索
  async search(query: string): Promise<EstatMetaCategoryData[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metadata 
      WHERE stat_name LIKE ? OR title LIKE ? OR item_name LIKE ?
      ORDER BY stat_name, title
    `
      )
      .bind(`%${query}%`, `%${query}%`, `%${query}%`)
      .all();

    return result.results as EstatMetaCategoryData[];
  }

  // 統計表一覧取得
  async getStatList(): Promise<any[]> {
    const result = await this.db
      .prepare(
        `
      SELECT DISTINCT 
        stats_data_id, 
        stat_name, 
        title, 
        COUNT(*) as item_count,
        MAX(updated_at) as last_updated
      FROM estat_metadata 
      GROUP BY stats_data_id, stat_name, title
      ORDER BY last_updated DESC
    `
      )
      .all();

    return result.results;
  }

  // データ件数取得
  async getCount(): Promise<number> {
    const result = await this.db
      .prepare(`SELECT COUNT(*) as count FROM estat_metadata`)
      .first();

    return result ? (result as any).count : 0;
  }

  // カテゴリ別件数取得
  async getCategoryCounts(): Promise<{ category: string; count: number }[]> {
    const result = await this.db
      .prepare(
        `
      SELECT cat01 as category, COUNT(*) as count 
      FROM estat_metadata 
      GROUP BY cat01 
      ORDER BY count DESC
    `
      )
      .all();

    return result.results as { category: string; count: number }[];
  }

  // 最新の更新日時取得
  async getLastUpdated(): Promise<string | null> {
    const result = await this.db
      .prepare(`SELECT MAX(updated_at) as last_updated FROM estat_metadata`)
      .first();

    return result ? (result as any).last_updated : null;
  }
}
