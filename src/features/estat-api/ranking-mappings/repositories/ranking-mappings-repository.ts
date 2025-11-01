import "server-only";

/**
 * e-Statランキングマッピング関連のデータベースアクセス関数
 *
 * このモジュールは、estat_ranking_mappingsテーブルへのデータベース操作を
 * 提供する純粋関数の集合です。
 *
 * 主な機能:
 * - ランキングマッピングの一覧取得
 * - isRankingフラグによるフィルタ
 * - ランキングマッピングのCRUD操作
 * - バルクアップサート（CSVインポート用）
 *
 * 関数命名規約:
 * - list: 配列全体を返す
 * - find: データベース検索
 * - create: 新規作成
 * - update: 更新
 * - delete: 削除
 * - bulkUpsert: バルクアップサート
 */

import { getD1 } from "../../db/d1";

import type {
  EstatRankingMapping,
  EstatRankingMappingInput,
} from "../types";

/**
 * データベース行をEstatRankingMappingに変換
 */
function convertRowToEstatRankingMapping(
  row: Record<string, unknown>
): EstatRankingMapping {
  return {
    id: Number(row.id || 0),
    stats_data_id: String(row.stats_data_id || ""),
    cat01: String(row.cat01 || ""),
    item_name: String(row.item_name || ""),
    item_code: String(row.item_code || ""),
    unit: row.unit ? String(row.unit) : null,
    dividing_value: row.dividing_value ? String(row.dividing_value) : null,
    new_unit: row.new_unit ? String(row.new_unit) : null,
    ascending: Boolean(row.ascending),
    is_ranking: Boolean(row.is_ranking),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  };
}

/**
 * ランキングマッピングの一覧を取得
 *
 * @param options - 取得オプション
 * @returns ランキングマッピングの配列
 */
export async function listRankingMappings(options?: {
  isRanking?: boolean;
  limit?: number;
  offset?: number;
}): Promise<EstatRankingMapping[]> {
  const db = getD1();
  const { isRanking, limit, offset } = options || {};

  let query = "SELECT * FROM estat_ranking_mappings";
  const conditions: string[] = [];
  const bindings: unknown[] = [];

  // isRankingフィルタ
  if (isRanking !== undefined) {
    conditions.push("is_ranking = ?");
    bindings.push(isRanking ? 1 : 0);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY stats_data_id, cat01, item_code";

  // リミットとオフセット
  if (limit !== undefined) {
    query += " LIMIT ?";
    bindings.push(limit);
    if (offset !== undefined) {
      query += " OFFSET ?";
      bindings.push(offset);
    }
  }

  try {
    const stmt = db.prepare(query);
    const result =
      bindings.length > 0
        ? await stmt.bind(...bindings).all()
        : await stmt.all();

    if (!result.success || !result.results) {
      console.error("[listRankingMappings] SQL実行エラー:", result);
      return [];
    }

    return result.results.map((row: Record<string, unknown>) =>
      convertRowToEstatRankingMapping(row)
    );
  } catch (error) {
    console.error("[listRankingMappings] 例外発生:", error);
    return [];
  }
}

/**
 * IDでランキングマッピングを取得
 *
 * @param id - マッピングID
 * @returns ランキングマッピング、またはnull
 */
export async function findRankingMappingById(
  id: number
): Promise<EstatRankingMapping | null> {
  const db = getD1();

  try {
    const stmt = db.prepare(
      "SELECT * FROM estat_ranking_mappings WHERE id = ?"
    );
    const row = await stmt.bind(id).first();

    if (!row) {
      return null;
    }

    return convertRowToEstatRankingMapping(row as Record<string, unknown>);
  } catch (error) {
    console.error("[findRankingMappingById] 例外発生:", error);
    return null;
  }
}

/**
 * isRanking=trueのランキングマッピングを取得
 *
 * @returns ランキング変換対象のマッピング配列
 */
export async function findRankingMappingsByIsRanking(): Promise<
  EstatRankingMapping[]
> {
  return listRankingMappings({ isRanking: true });
}

/**
 * ランキングマッピングを作成
 *
 * @param input - 作成するマッピングデータ
 * @returns 作成されたマッピング、またはnull
 */
export async function createRankingMapping(
  input: EstatRankingMappingInput
): Promise<EstatRankingMapping | null> {
  const db = getD1();
  const now = new Date().toISOString();

  try {
    const stmt = db.prepare(
      `INSERT INTO estat_ranking_mappings (
        stats_data_id, cat01, item_name, item_code,
        unit, dividing_value, new_unit, ascending, is_ranking,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *`
    );

    const row = await stmt
      .bind(
        input.stats_data_id,
        input.cat01,
        input.item_name,
        input.item_code,
        input.unit ?? null,
        input.dividing_value ?? null,
        input.new_unit ?? null,
        input.ascending ? 1 : 0,
        input.is_ranking ? 1 : 0,
        now,
        now
      )
      .first();

    if (!row) {
      return null;
    }

    return convertRowToEstatRankingMapping(row as Record<string, unknown>);
  } catch (error) {
    console.error("[createRankingMapping] 例外発生:", error);
    return null;
  }
}

/**
 * ランキングマッピングを更新
 *
 * @param id - マッピングID
 * @param data - 更新するデータ
 * @returns 更新成功フラグ
 */
export async function updateRankingMapping(
  id: number,
  data: Partial<EstatRankingMappingInput>
): Promise<boolean> {
  const db = getD1();
  const now = new Date().toISOString();

  const updates: string[] = [];
  const bindings: unknown[] = [];

  // 更新フィールドの構築
  if (data.stats_data_id !== undefined) {
    updates.push("stats_data_id = ?");
    bindings.push(data.stats_data_id);
  }
  if (data.cat01 !== undefined) {
    updates.push("cat01 = ?");
    bindings.push(data.cat01);
  }
  if (data.item_name !== undefined) {
    updates.push("item_name = ?");
    bindings.push(data.item_name);
  }
  if (data.item_code !== undefined) {
    updates.push("item_code = ?");
    bindings.push(data.item_code);
  }
  if (data.unit !== undefined) {
    updates.push("unit = ?");
    bindings.push(data.unit);
  }
  if (data.dividing_value !== undefined) {
    updates.push("dividing_value = ?");
    bindings.push(data.dividing_value);
  }
  if (data.new_unit !== undefined) {
    updates.push("new_unit = ?");
    bindings.push(data.new_unit);
  }
  if (data.ascending !== undefined) {
    updates.push("ascending = ?");
    bindings.push(data.ascending ? 1 : 0);
  }
  if (data.is_ranking !== undefined) {
    updates.push("is_ranking = ?");
    bindings.push(data.is_ranking ? 1 : 0);
  }

  if (updates.length === 0) {
    return false;
  }

  updates.push("updated_at = ?");
  bindings.push(now);
  bindings.push(id);

  try {
    const stmt = db.prepare(
      `UPDATE estat_ranking_mappings 
       SET ${updates.join(", ")} 
       WHERE id = ?`
    );

    const result = await stmt.bind(...bindings).run();

    return result.success === true;
  } catch (error) {
    console.error("[updateRankingMapping] 例外発生:", error);
    return false;
  }
}

/**
 * isRankingフラグを更新
 *
 * @param id - マッピングID
 * @param isRanking - ランキング変換対象フラグ
 * @returns 更新成功フラグ
 */
export async function updateIsRanking(
  id: number,
  isRanking: boolean
): Promise<boolean> {
  return updateRankingMapping(id, { is_ranking: isRanking });
}

/**
 * ランキングマッピングを削除
 *
 * @param id - マッピングID
 * @returns 削除成功フラグ
 */
export async function deleteRankingMapping(id: number): Promise<boolean> {
  const db = getD1();

  try {
    const stmt = db.prepare(
      "DELETE FROM estat_ranking_mappings WHERE id = ?"
    );
    const result = await stmt.bind(id).run();

    return result.success === true;
  } catch (error) {
    console.error("[deleteRankingMapping] 例外発生:", error);
    return false;
  }
}

/**
 * バルクアップサート（CSVインポート用）
 *
 * @param mappings - マッピングデータ配列
 * @returns 処理された件数
 */
export async function bulkUpsertRankingMappings(
  mappings: EstatRankingMappingInput[]
): Promise<number> {
  const db = getD1();
  const now = new Date().toISOString();

  if (mappings.length === 0) {
    return 0;
  }

  try {
    // バッチ処理で実行（最大100件ずつ）
    const batchSize = 100;
    let totalProcessed = 0;

    for (let i = 0; i < mappings.length; i += batchSize) {
      const batch = mappings.slice(i, i + batchSize);

      const stmt = db.prepare(
        `INSERT INTO estat_ranking_mappings (
          stats_data_id, cat01, item_name, item_code,
          unit, dividing_value, new_unit, ascending, is_ranking,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(stats_data_id, cat01, item_code) 
        DO UPDATE SET
          item_name = excluded.item_name,
          unit = excluded.unit,
          dividing_value = excluded.dividing_value,
          new_unit = excluded.new_unit,
          ascending = excluded.ascending,
          updated_at = excluded.updated_at
        -- is_rankingは既存の値を保持（CSVインポート時は更新しない）
        `
      );

      for (const mapping of batch) {
        const result = await stmt
          .bind(
            mapping.stats_data_id,
            mapping.cat01,
            mapping.item_name,
            mapping.item_code,
            mapping.unit ?? null,
            mapping.dividing_value ?? null,
            mapping.new_unit ?? null,
            mapping.ascending ? 1 : 0,
            mapping.is_ranking ? 1 : 0,
            now,
            now
          )
          .run();

        if (result.success) {
          totalProcessed++;
        }
      }
    }

    return totalProcessed;
  } catch (error) {
    console.error("[bulkUpsertRankingMappings] 例外発生:", error);
    return 0;
  }
}

