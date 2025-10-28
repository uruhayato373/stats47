/**
 * モックデータプロバイダー
 *
 * 注意: 現在はdevelopment環境ではローカルD1を使用するため、
 * このモックプロバイダーは基本的に使用されません。
 * 完全なモックモードが必要な場合（例: CI/CDテスト）にのみ使用されます。
 */

import type { D1Database } from "@cloudflare/workers-types";

/**
 * モックデータプロバイダーのインターフェース
 * D1互換のインターフェースを実装
 */
export class MockDataProvider implements Partial<D1Database> {
  /**
   * D1互換のprepareメソッド
   * 実際のSQLは実行せず、空の結果を返す
   */
  prepare(sql: string): any {
    return {
      bind: (..._params: unknown[]) => ({
        first: async () => null,
        all: async () => ({
          success: true,
          results: [],
          meta: { duration: 1 },
        }),
        run: async () => ({ success: true, meta: { duration: 1 } }),
      }),
      first: async () => null,
      all: async () => ({ success: true, results: [], meta: { duration: 1 } }),
      run: async () => ({ success: true, meta: { duration: 1 } }),
    };
  }
}

/**
 * モックデータプロバイダーのインスタンス
 * 後方互換性のためにexport
 */
export const mockDataProvider = new MockDataProvider();
