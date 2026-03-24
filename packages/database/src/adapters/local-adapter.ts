import type { D1Database } from "@cloudflare/workers-types";
import { logger } from "@stats47/logger";
import { type D1Adapter, type D1PreparedStatementAdapter, asD1Database } from "../types";

/**
 * ローカルSQLiteファイルからD1互換アダプタを作成
 */
export function createLocalAdapter(dbPath: string): D1Database {
  // 遅延require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3");
  
  if (dbPath) {
    logger.info({ dbPath }, "[D1 Local Adapter] DBを開いています");
  }

  const db = new Database(dbPath, { readonly: false });

  const adapter: D1Adapter = {
    prepare: (sql: string): D1PreparedStatementAdapter => {
      const createStmt = (
        ...boundArgs: unknown[]
      ): D1PreparedStatementAdapter => {
        try {
          const stmt = db.prepare(sql);
          
          // D1PreparedStatement emulation
          const stmtAdapter: any = {
          // batch() 用の同期実行メソッド（better-sqlite3 は同期 API のため、
          // db.transaction() 内部では同期的に実行する必要がある）
          _syncRun: () => {
            const result = boundArgs.length > 0 ? stmt.run(...boundArgs) : stmt.run();
            return {
              success: true,
              results: [],
              meta: { changes: Number(result.changes), last_insert_rowid: Number(result.lastInsertRowid) },
            };
          },
          _syncAll: () => {
            const results = boundArgs.length > 0 ? stmt.all(...boundArgs) : stmt.all();
            return { results, success: true, meta: {} };
          },

          bind: (...args: unknown[]) => createStmt(...args),

          all: async () => {
            try {
              // console.log(`[D1 Local Adapter] all()を実行中: ${sql}`);
              const results = boundArgs.length > 0 ? stmt.all(...boundArgs) : stmt.all();
              return { results, success: true, meta: {} };
            } catch (error) {
              logger.error(
                {
                  err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
                  sql,
                  boundArgs
                },
                "[D1 Local Adapter] SQLエラー (all)"
              );
              throw error;
            }
          },

          first: async (colName?: string) => {
            try {
              const result = boundArgs.length > 0 ? stmt.get(...boundArgs) : stmt.get();
              if (!result) return null;
              if (colName && typeof result === 'object') {
                return (result as any)[colName];
              }
              return result;
            } catch (error) {
              logger.error({ error, sql }, "SQL Error (first)");
              return null; 
            }
          },

          run: async () => {
            try {
              const result = boundArgs.length > 0 ? stmt.run(...boundArgs) : stmt.run();
              return {
                success: true,
                meta: {
                  changes: Number(result.changes),
                  last_insert_rowid: Number(result.lastInsertRowid),
                },
                results: []
              };
            } catch (error) {
               logger.error({ error, sql }, "SQL Error (run)");
               throw error;
            }
          },
          
          raw: async () => {
             try {
               // better-sqlite3: raw(true) で配列モードを有効化
               // stmt.raw(true) は Statement を返し、.all() で配列の配列として結果を取得
               const rawStmt = stmt.raw(true);
               const results = boundArgs.length > 0
                 ? rawStmt.all(...boundArgs)
                 : rawStmt.all();
               return results as any[];
             } catch (error) {
               logger.error(
                 {
                   err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
                   sql,
                   boundArgs
                 },
                 "[D1 Local Adapter] SQLエラー (raw)"
               );
               throw error;
             }
          }
          };
          return stmtAdapter;
        } catch (error) {
          logger.error(
            {
              err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
              sql
            },
            "[D1 Local Adapter] Prepare Error"
          );
          throw error;
        }
      };
      return createStmt();
    },
    
    dump: async () => {
      throw new Error("dump() not implemented in local adapter");
    },
    
    batch: async (statements) => {
        const results: any[] = [];
        const runBatch = db.transaction((stmts: any[]) => {
            for (const stmt of stmts) {
                if (stmt._syncRun) {
                    results.push(stmt._syncRun());
                } else if (stmt._syncAll) {
                    results.push(stmt._syncAll());
                } else {
                    throw new Error("batch(): 渡された statement にローカル実行メソッドがありません");
                }
            }
        });
        runBatch(statements);
        return results;
    },

    exec: async (sql: string) => {
      db.exec(sql);
      return { count: 0, duration: 0 }; // Mock return
    },
  };

  return asD1Database(adapter);
}
