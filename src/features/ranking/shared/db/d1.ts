// Cloudflare D1対応 DB Providerユーティリティ
export type D1Database = any; // cloudflare/workers-types で型定義できる場合は利用可

/**
 * ローカルSQLiteデータベースへのアクセスを提供するD1互換アダプタ
 * 
 * better-sqlite3を使用してローカルの.wrangler/state/v3/d1/*.sqliteファイルにアクセスします
 */
function createLocalD1Adapter(): D1Database | null {
  // サーバーサイドでのみ実行
  if (typeof window !== "undefined") {
    return null;
  }

  try {
    // better-sqlite3を動的にインポート（サーバーサイドのみ）
    const Database = require("better-sqlite3");
    const fs = require("fs");
    const path = require("path");

    // ローカルD1データベースのパスを検索
    const possiblePaths = [
      process.env.LOCAL_D1_PATH,
      ".wrangler/state/v3/d1/miniflare-D1DatabaseObject",
      ".wrangler/state/v3/d1",
    ].filter(Boolean);

    let dbPath: string | null = null;

    // 再帰的にファイルを検索する関数
    const findSqliteFile = (dir: string): string | null => {
      if (!fs.existsSync(dir)) return null;

      // ディレクトリ自体が.sqliteファイルの場合
      if (dir.endsWith(".sqlite") && fs.statSync(dir).isFile()) {
        return dir;
      }

      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isFile() && entry.name.endsWith(".sqlite")) {
            return fullPath;
          }
          
          if (entry.isDirectory()) {
            const found = findSqliteFile(fullPath);
            if (found) return found;
          }
        }
      } catch (error) {
        // 読み取りエラーは無視
      }
      
      return null;
    };

    for (const basePath of possiblePaths) {
      const found = findSqliteFile(basePath);
      if (found) {
        dbPath = found;
        break;
      }
    }

    if (!dbPath || !fs.existsSync(dbPath)) {
      return null;
    }

    const db = new Database(dbPath, { readonly: false });

    // D1互換のインターフェースを実装
    return {
      prepare: (sql: string) => {
        const createStmt = (...boundArgs: any[]) => {
          const stmt = db.prepare(sql);
          return {
            all: async () => {
              try {
                const results = boundArgs.length > 0 ? stmt.all(...boundArgs) : stmt.all();
                return { results, success: true };
              } catch (error) {
                return { results: [], success: false, error };
              }
            },
            first: async () => {
              try {
                const result = boundArgs.length > 0 ? stmt.get(...boundArgs) : stmt.get();
                return result || null;
              } catch (error) {
                return null;
              }
            },
            run: async () => {
              try {
                const result = boundArgs.length > 0 ? stmt.run(...boundArgs) : stmt.run();
                return {
                  success: true,
                  meta: {
                    changes: result.changes,
                    last_insert_rowid: result.lastInsertRowid,
                  },
                };
              } catch (error) {
                return { success: false, error };
              }
            },
            bind: (...args: any[]) => {
              return createStmt(...args);
            },
          };
        };
        
        return createStmt();
      },
      exec: (sql: string) => {
        db.exec(sql);
      },
    } as D1Database;
  } catch (error) {
    return null;
  }
}

/**
 * Cloudflare D1データベースにアクセスするための関数
 *
 * バインディング名: STATS47_DB（wrangler.tomlで定義）
 * 
 * アクセス方法の優先順位:
 * 1. globalThis.STATS47_DB（Cloudflare Pages/Workers環境）
 * 2. process.env.STATS47_DB（環境変数経由）
 * 3. ローカルSQLiteアダプタ（開発環境、better-sqlite3使用）
 * 4. globalThis.DB（フォールバック、互換性のため）
 * 
 * ローカル開発時の注意:
 * - 開発環境では、ローカルの.wrangler/state/v3/d1/*.sqliteファイルに直接アクセスします
 * - `npx wrangler dev`を別ターミナルで実行すると、SQLiteファイルが作成されます
 * - または`npm run db:init:local`を実行してデータベースを初期化できます
 */
export const getD1 = (): D1Database => {
  // 優先1: STATS47_DBバインディング（Cloudflare Pages/Workers環境）
  if (typeof globalThis !== "undefined" && (globalThis as any).STATS47_DB) {
    return (globalThis as any).STATS47_DB;
  }

  // 優先2: 環境変数経由
  if (
    typeof process !== "undefined" &&
    "env" in process &&
    (process.env as any).STATS47_DB
  ) {
    return (process.env as any).STATS47_DB;
  }

  // 優先3: ローカルSQLiteアダプタ（開発環境）
  const localAdapter = createLocalD1Adapter();
  if (localAdapter) {
    return localAdapter;
  }

  // 優先4: 互換性のため（古い実装との互換性）
  if (typeof globalThis !== "undefined" && (globalThis as any).DB) {
    return (globalThis as any).DB;
  }

  // エラー: バインディングが見つからない場合
  const errorMessage = [
    "Cloudflare D1 Databaseバインディング（STATS47_DB）が見つかりません。",
    "",
    "対処方法:",
    "1. ローカル開発時:",
    "   - `npm run db:init:local` でデータベースを初期化してください",
    "   - または `npx wrangler dev` を別ターミナルで実行してください",
    "   - ローカルSQLiteファイル（.wrangler/state/v3/d1/*.sqlite）が存在するか確認してください",
    "2. Cloudflare Pages環境: wrangler.tomlのバインディング設定を確認してください",
    "3. 環境変数: process.env.STATS47_DB が設定されているか確認してください",
  ].join("\n");

  throw new Error(errorMessage);
};

