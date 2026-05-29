// ============================================================================
// 共通 (Client-safe) エクスポートの再エクスポート
// ============================================================================
export * from "./index";

// ============================================================================
// サーバー専用
// ============================================================================
export {
    checkD1Available, clearAllDbCache, clearCachedStaticDb, getCachedStaticDb, getCloudflareEnv,
    getStaticDatabase,
    runQuery, type D1Database
} from "./core";

// 完全DBレス (Phase F): getDrizzle / createDrizzleClient (D1 Drizzle クライアント) は
// 全 caller が R2 リーダ化されたため削除。schema 型 + core (seed/integration test 用接続) は残置。
export * from "./schema";
export type { ColumnInfo, TableInfo } from "./types/stats";
export { getSchemaTableInfo } from "./utils/schema-introspection";
export { getAreaNameMap } from "./utils/area-master";
