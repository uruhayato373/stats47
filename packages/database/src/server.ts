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

export { createRemoteD1 } from "./adapters/remote-adapter";

export { createDrizzleClient, getDrizzle, type DrizzleClient } from "./drizzle";
export * from "./schema";
export type { ColumnInfo, TableInfo } from "./types/stats";
export { getSchemaTableInfo } from "./utils/schema-introspection";
export { getAreaNameMap } from "./utils/area-master";
