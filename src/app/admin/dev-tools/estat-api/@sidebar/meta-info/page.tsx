import { EstatMetaInfoSidebar } from "@/features/estat-api/meta-info/components";

import { getD1 } from "@/features/category/db/d1";

import type { EstatMetaInfo } from "@/features/estat-api/meta-info/types";

/**
 * MetaInfoSidebarSlot - e-Statメタ情報管理ページのサイドバー（サーバーコンポーネント）
 *
 * 責務:
 * - サーバーサイドで保存済みメタ情報を取得
 * - サイドバーを表示
 */
export default async function MetaInfoSidebarSlot() {
  let savedMetaInfoList: EstatMetaInfo[] = [];

  try {
    // D1データベースから保存済みメタ情報を取得
    const db = getD1();
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
      ORDER BY updated_at DESC 
      LIMIT 20`
    );
    const result = await stmt.all();

    // D1のall()は{results: [], success: boolean}形式を返す場合がある
    const rows = result && typeof result === "object" && "results" in result
      ? result.results
      : Array.isArray(result)
      ? result
      : [];

    savedMetaInfoList = rows.map((row: any) => ({
      stats_data_id: row.stats_data_id,
      stat_name: row.stat_name,
      title: row.title,
      area_type: row.area_type as "country" | "prefecture" | "municipality",
      cycle: row.cycle || undefined,
      survey_date: row.survey_date || undefined,
      description: row.description || undefined,
      last_fetched_at: row.last_fetched_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (err) {
    console.error("保存済みデータ取得エラー:", err);
    // エラーが発生してもサイドバーは表示する（空の配列で続行）
  }

  return (
    <div className="h-full">
      <EstatMetaInfoSidebar initialData={savedMetaInfoList} />
    </div>
  );
}

