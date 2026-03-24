import "server-only";

import type { D1Database } from "@cloudflare/workers-types";
import { logger } from "@stats47/logger";
import { createDatabaseClient } from "../client";
import {
  getCachedStaticDb,
  getCloudflareEnv,
  getStaticDbFromContext,
  isDevelopmentEnv,
  isServerSide,
  setCachedStaticDb
} from "./d1-context";


// Re-export for backwards compatibility
export { getCloudflareEnv };
export type { D1Database };

// ============================================================================
// ローカルDBパス取得
// ============================================================================

/**
 * ローカルDBパスを取得（遅延読み込み）
 */
function getLocalDbPaths() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LOCAL_DB_PATHS } = require("../config/local-db-paths");
  return LOCAL_DB_PATHS;
}

// ============================================================================
// データベース取得関数 (アプリ固有のコンテキスト解決ロジック)
// ============================================================================

/**
 * Static Database (ランキングデータ等) を取得
 */
export function getStaticDatabase(): D1Database {
  logger.debug("[getStaticDatabase] 開始");
  // 1. キャッシュチェック
  const cached = getCachedStaticDb();
  if (cached) {
    logger.debug("[getStaticDatabase] キャッシュから取得");
    return cached;
  }

  // 2. Cloudflareコンテキストから取得
  const contextDb = getStaticDbFromContext();
  if (contextDb) {
    logger.info("[getStaticDatabase] Using D1 Binding from Context");
    setCachedStaticDb(contextDb);
    return contextDb;
  }

  // 3. ローカルアダプタパス (開発環境またはフォールバック用)
  const localPath = getLocalDbPaths().STATIC.getPath();
  logger.info({ localPath }, "[getStaticDatabase] Fallback to Local Adapter");

  // 4. クライアント作成
  // createDatabaseClientは binding があればそれを使い、なければ条件に応じてローカルアダプタを使う
  const db = createDatabaseClient({
    binding: contextDb, // undefined here, but standard pattern
    localDbPath: localPath,
    // アプリ固有の条件: 開発環境かつサーバーサイドならローカルアダプタを試行
    // (createDatabaseClient内部のデフォルト判定と同じだが明示的に渡すことも可能)
    useLocalAdapter: isDevelopmentEnv() && isServerSide()
  });

  // 結果をキャッシュ
  setCachedStaticDb(db);
  return db;
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

/**
 * D1データベースバインディングが利用可能かチェック
 */
export const checkD1Available = (): boolean => {
  try {
    getStaticDatabase();
    return true;
  } catch {
    return false;
  }
};

/**
 * SQLクエリを実行するユーティリティ関数
 * SQLクエリを実行するユーティリティ関数
 */
import { extractD1QueryError } from "../utils/error-handler";
import { err, ok, type Result } from "../utils/result";

export async function runQuery(
  sql: string,
  request: any, // NextRequest type was imported but unused in logic except undefined check
  ...params: unknown[]
): Promise<Result<unknown[], Error>> {
  try {
    const db = getStaticDatabase();
    const stmt = db.prepare(sql);
    const result =
      params && params.length > 0
        ? await stmt.bind(...params).all()
        : await stmt.all();

    if (result.success) {
      return ok(result.results || []);
    } else {
      const { error: errorObj } = extractD1QueryError(
        result.error,
        "SQLクエリ実行に失敗しました"
      );
      return err(errorObj);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "SQLクエリ実行中に予期しないエラーが発生しました";
    const errorObj = error instanceof Error ? error : new Error(errorMessage);
    return err(errorObj);
  }
}
