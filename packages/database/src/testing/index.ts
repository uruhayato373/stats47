/**
 * データベースモック
 *
 * テスト環境で使用する共通のデータベースモックを提供します。
 */

import { vi } from "vitest";

import type {
  D1Database,
  D1ExecResult,
  D1PreparedStatement,
  D1Result,
} from "@cloudflare/workers-types";

/**
 * モックD1PreparedStatement
 */
class MockD1PreparedStatement {
  sql: string;
  bind(...values: unknown[]): D1PreparedStatement {
    return this as D1PreparedStatement;
  }
  first<T = unknown>(): Promise<T | null> {
    return Promise.resolve(null);
  }
  run<T = Record<string, unknown>>(): Promise<D1Result<T>> {
    return Promise.resolve({
      results: [] as T[],
      success: true,
      meta: {
        changes: 0,
        last_insert_rowid: 0,
        duration: 0,
        rows_read: 0,
        rows_written: 0,
        size_after: 0,
        last_row_id: 0,
        changed_db: false,
      },
    } as D1Result<T>);
  }
  all<T = unknown>(): Promise<D1Result<T>> {
    return Promise.resolve({
      results: [] as T[],
      success: true,
      meta: {
        changes: 0,
        last_insert_rowid: 0,
        duration: 0,
        rows_read: 0,
        rows_written: 0,
        size_after: 0,
        last_row_id: 0,
        changed_db: false,
      },
    } as D1Result<T>);
  }
  raw<T = unknown[]>(
    options?: { columnNames?: boolean }
  ): Promise<T[] | [string[], ...T[]]> {
    if (options?.columnNames) {
      return Promise.resolve([[], ...([] as T[])]) as unknown as Promise<[string[], ...T[]]>;
    }
    return Promise.resolve([] as T[]) as unknown as Promise<T[]>;
  }
  constructor(sql: string) {
    this.sql = sql;
  }
}

/**
 * モックD1Database
 */
class MockD1Database {
  prepare(query: string): D1PreparedStatement {
    return new MockD1PreparedStatement(query) as unknown as D1PreparedStatement;
  }
  exec(query: string): Promise<D1ExecResult> {
    return Promise.resolve({
      count: 0,
      duration: 0,
    });
  }
  batch<T = unknown>(
    statements: D1PreparedStatement[]
  ): Promise<D1Result<T>[]> {
    return Promise.resolve([]);
  }
  dump(): Promise<ArrayBuffer> {
    return Promise.resolve(new ArrayBuffer(0));
  }
  withSession(): D1Database & { getBookmark(): string } {
    // モック実装: D1DatabaseSessionの最小実装
    return {
      ...this,
      getBookmark: () => "",
    } as D1Database & { getBookmark(): string };
  }
}

/**
 * デフォルトのモックD1Databaseインスタンス
 */
const mockD1Database = new MockD1Database();

/**
 * getD1Databaseのモック実装
 */
export const getD1Database = vi.fn(() => mockD1Database);

/**
 * getD1DatabaseAsyncのモック実装
 */
export const getD1DatabaseAsync = vi.fn(() => Promise.resolve(mockD1Database));

/**
 * createD1のモック実装（後方互換性のため）
 */
export const createD1 = vi.fn(() => mockD1Database);

/**
 * getCloudflareEnvのモック実装
 */
export const getCloudflareEnv = vi.fn(() => ({}));

/**
 * runQueryのモック実装
 */
export const runQuery = vi.fn(() => Promise.resolve({ results: [], success: true }));

/**
 * checkD1Availableのモック実装
 */
export const checkD1Available = vi.fn(() => true);

/**
 * D1Database型のエクスポート
 */
export type { D1Database } from "@cloudflare/workers-types";

/**
 * テスト用スキーマ適用（Drizzle マイグレーション）
 */
export {
  applyD1Schema,
  applySqliteSchema,
  getMigrationStatements,
} from "./apply-schema";
