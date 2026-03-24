/**
 * Cloudflareコンテキスト管理
 *
 * Cloudflare D1データベースへのアクセスに必要なコンテキスト管理を提供します。
 * 環境判定、キャッシュ管理、コンテキスト取得を担当します。
 *
 * @module database/d1-context
 */

import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { logger } from "@stats47/logger";

import type { D1Database } from "@cloudflare/workers-types";

/**
 * グローバルキャッシュの型定義
 */
declare global {

  var _cached_static_db: D1Database | undefined;
}

// ============================================================================
// 環境判定関数
// ============================================================================

/**
 * Edge Runtimeで実行されているかどうかを判定
 */
export function isEdgeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === "edge";
}

/**
 * Cloudflare Workers環境かどうかを判定
 */
export function isCloudflareWorkers(): boolean {
  return process.env.CLOUDFLARE_WORKERS === "true";
}

/**
 * 開発環境かどうかを判定
 */
export function isDevelopmentEnv(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * サーバーサイドで実行されているかどうかを判定
 */
export function isServerSide(): boolean {
  return typeof window === "undefined";
}

// ============================================================================
// キャッシュ管理
// ============================================================================

/**
 * Static DBのキャッシュを取得
 */
export function getCachedStaticDb(): D1Database | undefined {
  return globalThis._cached_static_db;
}

/**
 * Static DBのキャッシュを設定
 */
export function setCachedStaticDb(db: D1Database): void {
  globalThis._cached_static_db = db;
}

/**
 * Static DBのキャッシュをクリア
 */
export function clearCachedStaticDb(): void {
  globalThis._cached_static_db = undefined;
}

/**
 * 全DBキャッシュをクリア
 */
export function clearAllDbCache(): void {
  globalThis._cached_static_db = undefined;
}

// ============================================================================
// Cloudflareコンテキスト取得
// ============================================================================

/**
 * Cloudflare環境からStatic DBを取得
 *
 * コンパイル時には実行されないように安全化されています。
 *
 * @returns D1Database or undefined
 */
export function getStaticDbFromContext(): D1Database | undefined {
  try {
    // コンパイル時には実行されないようにする
    if (typeof window !== "undefined" || process.env.NEXT_PHASE === "phase-production-build") {
      return undefined;
    }

    // 開発環境では常にローカルアダプタを使用
    // initOpenNextCloudflareForDev() が呼ばれていても、ローカルアダプタを優先
    // これにより、確実にローカルのSQLiteファイルを使用する
    if (process.env.NODE_ENV === "development") {
      return undefined;
    }

    const { env } = getCloudflareContext();
    if ((env as any).STATS47_STATIC_DB) {
      return (env as any).STATS47_STATIC_DB;
    }
  } catch (e) {
    // Cloudflareコンテキストが取得できない場合は無視（コンパイル時や開発環境では正常）
    // エラーをログに記録しない（開発環境では頻繁に発生するため）
  }

  // グローバルからのフォールバック
  if (typeof globalThis !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;
    if (g.STATS47_STATIC_DB) {
      return g.STATS47_STATIC_DB as D1Database;
    }
  }

  return undefined;
}

/**
 * Cloudflareコンテキスト全体を取得（高度な用途）
 */
export function getCloudflareEnv() {
  try {
    const context = getCloudflareContext();
    return context.env;
  } catch (error) {
    logger.error({ error }, "Failed to get Cloudflare context");
    throw error;
  }
}
