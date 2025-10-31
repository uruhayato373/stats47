import "server-only";

/**
 * e-Statメタ情報関連のデータベースアクセス関数
 *
 * このモジュールは、estat_metainfoテーブルへのデータベース操作を
 * 提供する純粋関数の集合です。
 *
 * 主な機能:
 * - 保存済みメタ情報の一覧取得
 * - メタ情報の検索
 * - メタ情報のCRUD操作（将来の拡張用）
 *
 * 関数命名規約:
 * - list: 配列全体を返す
 * - find: データベース検索
 * - create: 新規作成
 * - update: 更新
 * - delete: 削除
 */

import type { AreaType } from "@/features/area";

import { getD1 } from "../db/d1";

import type {
  EstatMetaInfo,
  EstatMetaInfoListOptions,
  SaveEstatMetaInfoInput,
} from "../types";

/**
 * 保存済みメタ情報の一覧を取得
 *
 * @param options - 取得オプション（limit, offset, orderBy, orderDirection）
 * @returns 保存済みメタ情報の配列
 */
export async function listSavedMetaInfo(
  options: EstatMetaInfoListOptions = {}
): Promise<EstatMetaInfo[]> {
  const db = getD1();

  const {
    limit = 20,
    offset = 0,
    orderBy = "updated_at",
    orderDirection = "DESC",
  } = options;

  // SQLインジェクション対策: orderByとorderDirectionの値を検証
  const validOrderByColumns = ["updated_at", "stat_name", "title"] as const;
  const validOrderDirections = ["ASC", "DESC"] as const;

  const orderByColumn =
    validOrderByColumns.includes(orderBy as typeof validOrderByColumns[number])
      ? orderBy
      : "updated_at";

  const orderDir = validOrderDirections.includes(
    orderDirection as typeof validOrderDirections[number]
  )
    ? orderDirection
    : "DESC";

  const stmt = db.prepare(
    `SELECT 
      stats_data_id,
      stat_name,
      title,
      area_type,
      cycle,
      survey_date,
      description,
      last_fetched_at,
      created_at,
      updated_at
    FROM estat_metainfo 
    ORDER BY ${orderByColumn} ${orderDir}
    LIMIT ? OFFSET ?`
  );

  const result = await stmt.bind(limit, offset).all();

  // D1のall()は{results: [], success: boolean}形式を返す場合がある
  const rows =
    result && typeof result === "object" && "results" in result
      ? result.results
      : Array.isArray(result)
      ? result
      : [];

  // EstatMetaInfo形式に変換
  return rows.map((row: Record<string, unknown>) => ({
    stats_data_id: String(row.stats_data_id || ""),
    stat_name: String(row.stat_name || ""),
    title: String(row.title || ""),
    area_type:
      (row.area_type as AreaType) || "national",
    cycle: row.cycle ? String(row.cycle) : undefined,
    survey_date: row.survey_date ? String(row.survey_date) : undefined,
    description: row.description ? String(row.description) : undefined,
    last_fetched_at: String(row.last_fetched_at || ""),
    created_at: String(row.created_at || ""),
    updated_at: String(row.updated_at || ""),
  }));
}

/**
 * メタ情報を保存または更新
 *
 * @param input - 保存するメタ情報の入力データ
 * @returns 保存成功フラグ
 */
export async function saveMetaInfo(
  input: SaveEstatMetaInfoInput
): Promise<boolean> {
  const db = getD1();

  const now = new Date().toISOString();

  // 既存レコードの確認
  const existingStmt = db.prepare(
    `SELECT created_at FROM estat_metainfo WHERE stats_data_id = ?`
  );
  const existing = await existingStmt.bind(input.stats_data_id).first();

  const createdAt = existing
    ? (existing as Record<string, unknown>).created_at
    : now;

  // INSERT OR REPLACEを使用して、既存の場合は更新、新規の場合は作成
  const stmt = db.prepare(
    `INSERT INTO estat_metainfo (
      stats_data_id,
      stat_name,
      title,
      area_type,
      cycle,
      survey_date,
      description,
      last_fetched_at,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(stats_data_id) DO UPDATE SET
      stat_name = excluded.stat_name,
      title = excluded.title,
      area_type = excluded.area_type,
      cycle = excluded.cycle,
      survey_date = excluded.survey_date,
      description = excluded.description,
      last_fetched_at = excluded.last_fetched_at,
      updated_at = excluded.updated_at`
  );

  const result = await stmt
    .bind(
      input.stats_data_id,
      input.stat_name,
      input.title,
      input.area_type,
      input.cycle || null,
      input.survey_date || null,
      input.description || null,
      now,
      createdAt,
      now
    )
    .run();

  return result.success !== false;
}

