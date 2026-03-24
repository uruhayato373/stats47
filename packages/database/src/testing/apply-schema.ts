/**
 * テスト用スキーマ適用ヘルパー
 *
 * Drizzle が生成したマイグレーション SQL を読み込み、D1 または better-sqlite3 に適用する。
 * schemas/static.sql の代わりに drizzle/*.sql を Single Source of Truth として使用する。
 */

import fsImport from "node:fs";
import pathImport from "node:path";

const fs = (fsImport as { default?: typeof fsImport }).default ?? fsImport;
const path = (pathImport as { default?: typeof pathImport }).default ?? pathImport;

const DRIZZLE_DIR = path.resolve(__dirname, "../../drizzle");

/** マイグレーションファイルを番号順に読み、SQL 文の配列に展開する */
function getMigrationStatements(): string[] {
  const entries = fs.readdirSync(DRIZZLE_DIR, { withFileTypes: true });
  const sqlFiles = entries
    .filter((e) => e.isFile() && e.name.endsWith(".sql"))
    .map((e) => e.name)
    .sort();

  const statements: string[] = [];
  for (const file of sqlFiles) {
    const content = fs.readFileSync(
      path.join(DRIZZLE_DIR, file),
      "utf-8"
    );
    const chunks = content.split(/--> statement-breakpoint\s*/);
    for (const chunk of chunks) {
      const sql = chunk.trim();
      if (sql.length > 0) {
        statements.push(sql);
      }
    }
  }
  return statements;
}

export type D1DatabaseLike = {
  prepare(sql: string): { run(): Promise<{ success: boolean }> };
};

/**
 * D1 データベースに Drizzle マイグレーションを適用する。
 * Cloudflare Vitest 環境の env.STATS47_STATIC_DB に渡す想定。
 */
export async function applyD1Schema(db: D1DatabaseLike): Promise<void> {
  const statements = getMigrationStatements();
  for (const statement of statements) {
    try {
      await db.prepare(statement).run();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        !msg.includes("already exists") &&
        !msg.includes("unique constraint") &&
        !msg.includes("duplicate column name") &&
        !msg.includes("no such column")
      ) {
        throw e;
      }
    }
  }
}

export type SqliteDatabaseLike = {
  exec(sql: string): void;
};

/**
 * better-sqlite3 に Drizzle マイグレーションを適用する。
 * packages/category などの Node テストで SQLite を直接使う場合に使用。
 */
export function applySqliteSchema(db: SqliteDatabaseLike): void {
  const statements = getMigrationStatements();
  for (const statement of statements) {
    try {
      db.exec(statement);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (
        !msg.includes("already exists") &&
        !msg.includes("unique constraint") &&
        !msg.includes("duplicate column name") &&
        !msg.includes("no such column")
      ) {
        throw e;
      }
    }
  }
}

export { getMigrationStatements };
