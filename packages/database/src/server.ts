// ============================================================================
// 共通 (Client-safe) エクスポートの再エクスポート
// ============================================================================
export * from "./index";

// ============================================================================
// サーバー専用
// ============================================================================
import { getStaticDatabase } from "./core";
import { ComparisonRepository } from "./repositories/comparison-repository";
import { RankingPageCardRepository } from "./repositories/ranking-page-card-repository";

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

// Repositories
export { ComparisonRepository } from "./repositories/comparison-repository";
export { RankingPageCardRepository } from "./repositories/ranking-page-card-repository";

let _comparisonRepositoryInstance: ComparisonRepository | null = null;

/**
 * ComparisonRepository のインスタンスを取得（シングルトン）
 */
export function getComparisonRepository(): ComparisonRepository {
  if (!_comparisonRepositoryInstance) {
    const db = getStaticDatabase();
    _comparisonRepositoryInstance = new ComparisonRepository(db);
  }
  return _comparisonRepositoryInstance;
}

let _rankingPageCardRepositoryInstance: RankingPageCardRepository | null = null;

/**
 * RankingPageCardRepository のインスタンスを取得（シングルトン）
 */
export function getRankingPageCardRepository(): RankingPageCardRepository {
  if (!_rankingPageCardRepositoryInstance) {
    const db = getStaticDatabase();
    _rankingPageCardRepositoryInstance = new RankingPageCardRepository(db);
  }
  return _rankingPageCardRepositoryInstance;
}
