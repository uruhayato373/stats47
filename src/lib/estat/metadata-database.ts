import { EstatTransformedData } from "./data-transformer";

export class EstatMetadataDatabaseService {
  constructor(private db: D1Database) {}

  // 変換されたデータを一括保存
  async saveTransformedData(dataList: EstatTransformedData[]): Promise<void> {
    if (dataList.length === 0) return;

    // バッチ処理（D1の制限を考慮）
    const batchSize = 100;

    for (let i = 0; i < dataList.length; i += batchSize) {
      const batch = dataList.slice(i, i + batchSize);
      await this.processBatch(batch);
    }
  }

  // バッチ処理
  private async processBatch(dataList: EstatTransformedData[]): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO estat_metadata 
      (stats_data_id, stat_name, title, cat01, item_name, unit, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    // トランザクション開始
    await this.db.prepare("BEGIN TRANSACTION").run();

    try {
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

      await this.db.prepare("COMMIT").run();
    } catch (error) {
      await this.db.prepare("ROLLBACK").run();
      throw error;
    }
  }

  // 統計表IDで検索
  async findByStatsId(statsDataId: string): Promise<EstatTransformedData[]> {
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

    return result.results as EstatTransformedData[];
  }

  // 統計名で検索
  async findByStatName(statName: string): Promise<EstatTransformedData[]> {
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

    return result.results as EstatTransformedData[];
  }

  // カテゴリで検索
  async findByCategory(category: string): Promise<EstatTransformedData[]> {
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

    return result.results as EstatTransformedData[];
  }

  // 全文検索
  async search(query: string): Promise<EstatTransformedData[]> {
    const result = await this.db
      .prepare(
        `
      SELECT * FROM estat_metadata 
      WHERE stat_name LIKE ? 
         OR title LIKE ? 
         OR item_name LIKE ?
      ORDER BY stat_name, title
      LIMIT 100
    `
      )
      .bind(`%${query}%`, `%${query}%`, `%${query}%`)
      .all();

    return result.results as EstatTransformedData[];
  }

  // 統計表一覧（重複除去）
  async getStatList(): Promise<any[]> {
    const result = await this.db
      .prepare(
        `
      SELECT DISTINCT stats_data_id, stat_name, title
      FROM estat_metadata 
      ORDER BY stat_name, title
    `
      )
      .all();

    return result.results;
  }

  // カテゴリ一覧
  async getCategoryList(): Promise<any[]> {
    const result = await this.db
      .prepare(
        `
      SELECT DISTINCT cat01
      FROM estat_metadata 
      WHERE cat01 IS NOT NULL
      ORDER BY cat01
    `
      )
      .all();

    return result.results;
  }

  // データ件数取得
  async getCount(): Promise<number> {
    const result = await this.db
      .prepare(
        `
      SELECT COUNT(*) as count FROM estat_metadata
    `
      )
      .first();

    return result?.count || 0;
  }
}
