/**
 * リモート D1 → ローカル D1 差分同期スクリプト
 *
 * `wrangler d1 export` が 400MB+ の SQL ダンプを生成し OOM でクラッシュする問題を回避するため、
 * テーブル単位でページネーション付き SELECT → ローカル INSERT で同期する。
 *
 * Usage:
 *   npm run pull:d1 --workspace=packages/database                          # 全テーブル同期
 *   npm run pull:d1 --workspace=packages/database -- --dry-run             # 比較のみ
 *   npm run pull:d1 --workspace=packages/database -- --table ranking_data  # 特定テーブルのみ
 *   npm run pull:d1 --workspace=packages/database -- --batch-size 1000     # バッチサイズ変更
 */

import { execSync } from "child_process";
import path from "path";
import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";

// ── 定数 ──────────────────────────────────────────────

const WEB_APP_DIR = path.resolve(__dirname, "../../../apps/web");
const REMOTE_DB_NAME = "stats47_static";
const REMOTE_ENV = "production";
const MAX_BUFFER = 50 * 1024 * 1024; // 50MB

/** テーブル別デフォルトバッチサイズ（JSON が巨大なテーブルは小さくする） */
const TABLE_BATCH_SIZES: Record<string, number> = {
  correlation_analysis: 500,
  ranking_ai_content: 100,
};
const DEFAULT_BATCH_SIZE = 5000;

/** 同期対象外のシステムテーブルパターン */
const SYSTEM_TABLE_PATTERNS = [
  /^sqlite_/,
  /^_cf_/,
  /^__drizzle/,
  /^d1_/,
];

// ── 型 ──────────────────────────────────────────────

interface Args {
  table?: string;
  dryRun: boolean;
  batchSize?: number;
  offset?: number;
}

interface TableInfo {
  name: string;
  remoteCount: number;
  localCount: number;
}

interface SyncResult {
  table: string;
  success: boolean;
  remoteCount: number;
  localCount: number;
  error?: string;
}

// ── CLI引数パース ──────────────────────────────────────

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = { dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--table":
        result.table = args[++i];
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--batch-size":
        result.batchSize = parseInt(args[++i], 10);
        if (isNaN(result.batchSize) || result.batchSize <= 0) {
          console.error("--batch-size must be a positive integer");
          process.exit(1);
        }
        break;
      case "--offset":
        result.offset = parseInt(args[++i], 10);
        if (isNaN(result.offset) || result.offset < 0) {
          console.error("--offset must be a non-negative integer");
          process.exit(1);
        }
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        console.error(
          "Usage: tsx scripts/pull-remote-d1.ts [--table <name>] [--dry-run] [--batch-size <n>] [--offset <n>]"
        );
        process.exit(1);
    }
  }

  return result;
}

// ── wrangler リモートクエリ実行 ──────────────────────────

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeRemoteQuery(sql: string): Promise<Record<string, unknown>[]> {
  const cmd = [
    "npx wrangler d1 execute",
    REMOTE_DB_NAME,
    "--remote",
    `--env ${REMOTE_ENV}`,
    "--json",
    `--command="${sql.replace(/"/g, '\\"')}"`,
  ].join(" ");

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let stdout: string;
    try {
      stdout = execSync(cmd, {
        cwd: WEB_APP_DIR,
        maxBuffer: MAX_BUFFER,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err: unknown) {
      const execErr = err as { message?: string; stdout?: string; stderr?: string; status?: number };
      const message = execErr.message ?? String(err);
      const stderr = execErr.stderr ?? "";
      const stdout = execErr.stdout ?? "";

      // stdout に JSON エラーが含まれる場合（wrangler が exit code 1 でも JSON を返すケース）
      if (stdout) {
        const jsonStart = stdout.indexOf("[");
        if (jsonStart !== -1) {
          try {
            const parsed = JSON.parse(stdout.slice(jsonStart));
            if (Array.isArray(parsed) && parsed[0]?.error) {
              const errText = parsed[0].error.text || JSON.stringify(parsed[0].error);
              if (attempt < MAX_RETRIES && (errText.includes("fetch failed") || errText.includes("503") || errText.includes("malformed"))) {
                console.warn(`    [RETRY ${attempt}/${MAX_RETRIES}] API error: ${errText}`);
                await sleep(RETRY_DELAY_MS * attempt);
                continue;
              }
            }
          } catch {
            // JSON パース失敗は無視
          }
        }
      }

      if (
        message.includes("not logged in") ||
        message.includes("Authentication") ||
        message.includes("authorization")
      ) {
        console.error("\n[ERROR] Cloudflare 認証エラー。`wrangler login` を実行してください。");
        process.exit(1);
      }
      // ネットワーク系エラーは常にリトライ（認証エラー以外）
      if (attempt < MAX_RETRIES) {
        console.warn(`    [RETRY ${attempt}/${MAX_RETRIES}] ${message.slice(0, 120)}...`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw err;
    }

    // stdout に非 JSON 行（警告等）が混ざるため、最初の `[` を検索してパース
    const jsonStart = stdout.indexOf("[");
    if (jsonStart === -1) {
      throw new Error(`wrangler JSON 出力をパースできません: ${stdout.slice(0, 200)}`);
    }

    const parsed = JSON.parse(stdout.slice(jsonStart));

    // wrangler d1 execute --json がエラーを返した場合
    if (Array.isArray(parsed) && parsed[0]?.error) {
      const errText = parsed[0].error.text || JSON.stringify(parsed[0].error);
      if (attempt < MAX_RETRIES && (errText.includes("fetch failed") || errText.includes("503"))) {
        console.warn(`    [RETRY ${attempt}/${MAX_RETRIES}] API error: ${errText}`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw new Error(`wrangler API error: ${errText}`);
    }

    // wrangler d1 execute --json は [{ results: [...] }] 形式
    if (Array.isArray(parsed) && parsed[0]?.results) {
      return parsed[0].results as Record<string, unknown>[];
    }
    return [];
  }

  throw new Error(`${MAX_RETRIES} 回リトライしましたが失敗しました: ${sql.slice(0, 80)}`);
}

// ── テーブル一覧取得 ──────────────────────────────────

function isSystemTable(name: string): boolean {
  return SYSTEM_TABLE_PATTERNS.some((p) => p.test(name));
}

async function getRemoteTables(): Promise<string[]> {
  const rows = await executeRemoteQuery(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
  );
  return rows.map((r) => r.name as string).filter((n) => !isSystemTable(n));
}

function getLocalTables(db: Database.Database): string[] {
  const rows = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all() as { name: string }[];
  return rows.map((r) => r.name).filter((n) => !isSystemTable(n));
}

// ── 行数取得 ──────────────────────────────────────────

async function getRemoteCount(table: string): Promise<number> {
  const rows = await executeRemoteQuery(`SELECT COUNT(*) as cnt FROM "${table}"`);
  return (rows[0]?.cnt as number) ?? 0;
}

function getLocalCount(db: Database.Database, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) as cnt FROM "${table}"`).get() as
    | { cnt: number }
    | undefined;
  return row?.cnt ?? 0;
}

// ── ページネーション付きリモート SELECT ──────────────────

async function fetchRemotePage(
  table: string,
  limit: number,
  offset: number
): Promise<Record<string, unknown>[]> {
  return executeRemoteQuery(
    `SELECT * FROM "${table}" LIMIT ${limit} OFFSET ${offset}`
  );
}

// ── テーブル同期 ──────────────────────────────────────

async function syncTable(
  db: Database.Database,
  table: string,
  remoteCount: number,
  batchSize: number,
  startOffset: number = 0
): Promise<void> {
  const resuming = startOffset > 0;
  console.log(`\n  Syncing "${table}" (${remoteCount} rows, batch=${batchSize}${resuming ? `, resume from offset=${startOffset}` : ""})...`);

  db.exec("PRAGMA foreign_keys = OFF");
  if (!resuming) {
    db.exec(`DELETE FROM "${table}"`);
  }

  let inserted = startOffset;
  let preparedStmt: Database.Statement | null = null;
  let columnNames: string[] = [];

  // バッチ単位で INSERT するヘルパー（同期）
  const insertBatch = db.transaction((rows: Record<string, unknown>[]) => {
    if (!preparedStmt) {
      columnNames = Object.keys(rows[0]);
      const placeholders = columnNames.map(() => "?").join(", ");
      const quotedCols = columnNames.map((c) => `"${c}"`).join(", ");
      preparedStmt = db.prepare(
        `INSERT INTO "${table}" (${quotedCols}) VALUES (${placeholders})`
      );
    }

    for (const row of rows) {
      const values = columnNames.map((col) => {
        const v = row[col];
        if (v !== null && typeof v === "object") return JSON.stringify(v);
        return v as string | number | null;
      });
      preparedStmt.run(...values);
    }
  });

  // フェッチ → 即 INSERT を繰り返す
  while (inserted < remoteCount) {
    const rows = await fetchRemotePage(table, batchSize, inserted);
    if (rows.length === 0) break;

    insertBatch(rows);
    inserted += rows.length;
    process.stdout.write(`    ${inserted}/${remoteCount}\r`);
  }

  console.log(`    ${inserted}/${remoteCount} rows inserted`);

  // 行数一致を検証（resume 時は >= で許容）
  const localCount = getLocalCount(db, table);
  if (resuming) {
    console.log(`    Local count: ${localCount} (resumed from ${startOffset})`);
  } else if (localCount !== remoteCount) {
    throw new Error(
      `行数不一致: remote=${remoteCount}, local=${localCount}`
    );
  } else {
    console.log(`    Verified: ${localCount} rows`);
  }
}

// ── メイン ──────────────────────────────────────────

async function main() {
  const args = parseArgs();

  console.log("=== Remote D1 → Local D1 Sync ===\n");

  // ローカル DB 接続
  const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
  console.log(`Local DB: ${dbPath}`);
  const db = new Database(dbPath);

  try {
    // テーブル一覧取得
    console.log("\nFetching remote table list...");
    const remoteTables = args.table ? [args.table] : await getRemoteTables();
    const localTables = getLocalTables(db);
    const localTableSet = new Set(localTables);

    // 比較表示
    console.log("\n┌─────────────────────────────────┬──────────┬──────────┬──────────┐");
    console.log("│ Table                           │   Remote │    Local │     Diff │");
    console.log("├─────────────────────────────────┼──────────┼──────────┼──────────┤");

    const tableInfos: TableInfo[] = [];

    for (const table of remoteTables) {
      let remoteCount: number;
      try {
        remoteCount = await getRemoteCount(table);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `│ ${table.padEnd(31)} │  [ERROR] │          │          │ ${message.slice(0, 40)}`
        );
        continue;
      }
      const localCount = localTableSet.has(table)
        ? getLocalCount(db, table)
        : -1;

      tableInfos.push({ name: table, remoteCount, localCount });

      const localStr =
        localCount === -1 ? "   (N/A)" : String(localCount).padStart(8);
      const diff =
        localCount === -1
          ? "     N/A"
          : String(remoteCount - localCount).padStart(8);
      const marker =
        localCount === -1
          ? " [SKIP]"
          : remoteCount !== localCount
            ? " *"
            : "";

      console.log(
        `│ ${table.padEnd(31)} │ ${String(remoteCount).padStart(8)} │ ${localStr} │ ${diff} │${marker}`
      );
    }

    console.log("└─────────────────────────────────┴──────────┴──────────┴──────────┘");

    if (args.dryRun) {
      console.log("\n--dry-run: 比較表示のみ。実行は --dry-run を外してください。");
      return;
    }

    // 同期実行
    const results: SyncResult[] = [];

    for (const info of tableInfos) {
      if (!localTableSet.has(info.name)) {
        console.log(
          `\n  [SKIP] "${info.name}" はローカルに存在しません`
        );
        results.push({
          table: info.name,
          success: false,
          remoteCount: info.remoteCount,
          localCount: -1,
          error: "テーブルがローカルに存在しない",
        });
        continue;
      }

      const batchSize =
        args.batchSize ??
        TABLE_BATCH_SIZES[info.name] ??
        DEFAULT_BATCH_SIZE;

      const startOffset = args.offset ?? 0;

      try {
        await syncTable(db, info.name, info.remoteCount, batchSize, startOffset);
        results.push({
          table: info.name,
          success: true,
          remoteCount: info.remoteCount,
          localCount: info.remoteCount,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const currentLocal = getLocalCount(db, info.name);
        console.error(`    [ERROR] ${message}`);
        if (currentLocal > 0 && currentLocal < info.remoteCount) {
          console.error(`    [HINT] 途中まで ${currentLocal} 行挿入済み。再開コマンド:`);
          console.error(`    npm run pull:d1 --workspace=packages/database -- --table ${info.name} --batch-size ${batchSize} --offset ${currentLocal}`);
        }
        results.push({
          table: info.name,
          success: false,
          remoteCount: info.remoteCount,
          localCount: currentLocal,
          error: message,
        });
      }
    }

    // サマリーレポート
    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log("\n=== Summary ===");
    console.log(`  Succeeded: ${succeeded.length}`);
    console.log(`  Failed:    ${failed.length}`);

    if (failed.length > 0) {
      console.log("\n  Failed tables:");
      for (const r of failed) {
        console.log(`    - ${r.table}: ${r.error}`);
      }
    }

    if (failed.length > 0) {
      process.exit(1);
    }
  } finally {
    db.close();
  }
}

main();
