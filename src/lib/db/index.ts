import { createRemoteD1Database } from "./remote";
import { createLocalD1Database } from "./local";

/**
 * 環境に応じて適切なD1クライアントを作成
 * @param useRemote - 強制的にリモートD1を使用する場合はtrue
 */
export const createD1Database = async (useRemote = false) => {
  if (useRemote || process.env.NODE_ENV === "production") {
    return await createRemoteD1Database();
  } else {
    return await createLocalD1Database();
  }
};

// 後方互換性のため個別エクスポートも提供
export { createRemoteD1Database, createLocalD1Database };

/**
 * estat_metainfo_unique ビューからデータを取得
 * @param options - クエリオプション
 * @param options.limit - 取得する最大レコード数（デフォルト: 50）
 * @param options.orderBy - ソート順（デフォルト: "updated_at DESC"）
 * @param options.useRemote - リモートD1を使用するか（デフォルト: false）
 * @returns SavedEstatMetainfoItem[] - エラー時は空配列
 */
export async function fetchEstatMetainfoUnique(options?: {
  limit?: number;
  orderBy?: string;
  useRemote?: boolean;
}): Promise<any[]> {
  const {
    limit = 50,
    orderBy = "updated_at DESC",
    useRemote = false,
  } = options || {};

  try {
    const db = await createD1Database(useRemote);
    const result = await db
      .prepare(
        `SELECT * FROM estat_metainfo_unique ORDER BY ${orderBy} LIMIT ${limit}`
      )
      .all();
    return result.results;
  } catch (error) {
    console.error("Failed to fetch estat metainfo:", error);
    return [];
  }
}
