import { buildEnvironmentConfig } from "@/lib/environment";
import * as fs from "fs";
import * as path from "path";

/**
 * 開発環境用のローカルD1データベースクライアント
 * Cloudflare WranglerのローカルD1を使用
 */
export const createLocalD1Database = async () => {
  const config = buildEnvironmentConfig();

  // 開発環境ではローカルD1を使用
  if (config.environment === "development") {
    // ローカルD1のパスを取得
    const localD1Path =
      process.env.LOCAL_D1_PATH ||
      ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/b3c084603f7be30f18c6a887d294217e3e6b2010e83e9d09910eae3515a26884.sqlite";

    // ディレクトリの存在確認
    const dbDir = path.dirname(localD1Path);
    if (!fs.existsSync(dbDir)) {
      throw new Error(
        `Local D1 database directory does not exist: ${dbDir}\n\n` +
          `Please run the following command to initialize the local database:\n` +
          `  npm run db:init:local\n\n` +
          `Or reset the local database:\n` +
          `  npm run db:reset:local`
      );
    }

    // ファイルの存在確認
    if (!fs.existsSync(localD1Path)) {
      throw new Error(
        `Local D1 database file does not exist: ${localD1Path}\n\n` +
          `Please run the following command to initialize the local database:\n` +
          `  npm run db:init:local`
      );
    }

    // SQLite3を使用してローカルD1に接続
    const Database = require("better-sqlite3");
    const db = new Database(localD1Path, { readonly: false });

    return {
      prepare: (sql: string) => {
        const stmt = db.prepare(sql);
        return {
          bind: (...params: unknown[]) => ({
            run: async () => {
              try {
                const result = stmt.run(...params);
                return { success: true, meta: { duration: 1 } };
              } catch (error) {
                throw new Error(`Local D1 Error: ${error}`);
              }
            },
            all: async () => {
              try {
                const results = stmt.all(...params);
                return { success: true, results, meta: { duration: 1 } };
              } catch (error) {
                throw new Error(`Local D1 Error: ${error}`);
              }
            },
            first: async () => {
              try {
                const result = stmt.get(...params);
                return result || null;
              } catch (error) {
                throw new Error(`Local D1 Error: ${error}`);
              }
            },
          }),
          run: async () => {
            try {
              const result = stmt.run();
              return { success: true, meta: { duration: 1 } };
            } catch (error) {
              throw new Error(`Local D1 Error: ${error}`);
            }
          },
          all: async () => {
            try {
              const results = stmt.all();
              return { success: true, results, meta: { duration: 1 } };
            } catch (error) {
              throw new Error(`Local D1 Error: ${error}`);
            }
          },
          first: async () => {
            try {
              const result = stmt.get();
              return result || null;
            } catch (error) {
              throw new Error(`Local D1 Error: ${error}`);
            }
          },
        };
      },
    };
  }

  // 本番環境では既存のREST APIクライアントを使用
  return await import("./remote").then((m) => m.createRemoteD1Database());
};
