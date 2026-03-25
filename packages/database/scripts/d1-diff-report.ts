/**
 * D1 差分レポート — ローカルとリモートのキーベース差分を表示
 *
 * 大量テーブル（ranking_data, correlation_analysis）はキー単位で差分検知し、
 * 少量テーブルは行数比較のみ行う。
 *
 * Usage:
 *   npm run diff:d1 --workspace=packages/database                   # 全テーブル差分レポート
 *   npm run diff:d1 --workspace=packages/database -- --execute      # 差分を同期（push方向）
 *   npm run diff:d1 --workspace=packages/database -- --direction pull  # pull方向で同期
 *   npm run diff:d1 --workspace=packages/database -- --table ranking_data  # 特定テーブルのみ
 */

import { execSync } from "child_process";
import path from "path";
import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "../src/config/local-db-paths";
import {
  buildInsertChunks,
  executeRemoteBulkSQL,
  executeRemoteSQL,
} from "./d1-rest-api";

// ── 定数 ──────────────────────────────────────────────

const WEB_APP_DIR = path.resolve(__dirname, "../../../apps/web");
const REMOTE_DB_NAME = "stats47_static";
const REMOTE_ENV = "production";
const MAX_BUFFER = 50 * 1024 * 1024;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

/** キー単位で差分検知するテーブルとそのキー定義 */
const KEY_DIFF_TABLES: Record<
  string,
  {
    keyQuery: string;
    keyColumn: string;
    deleteWhere: (key: string) => string;
    /** キーごとの MAX(updated_at) を返すクエリ。結果は { key, ts } */
    timestampQuery?: string;
  }
> = {
  ranking_data: {
    keyQuery: "SELECT DISTINCT category_code AS key FROM ranking_data",
    keyColumn: "category_code",
    deleteWhere: (key) => `DELETE FROM ranking_data WHERE category_code = '${key.replace(/'/g, "''")}'`,
    timestampQuery:
      "SELECT category_code AS key, MAX(updated_at) AS ts FROM ranking_data GROUP BY category_code",
  },
  ranking_items: {
    keyQuery: "SELECT ranking_key AS key FROM ranking_items",
    keyColumn: "ranking_key",
    deleteWhere: (key) => `DELETE FROM ranking_items WHERE ranking_key = '${key.replace(/'/g, "''")}'`,
    timestampQuery:
      "SELECT ranking_key AS key, updated_at AS ts FROM ranking_items",
  },
  correlation_analysis: {
    keyQuery:
      "SELECT DISTINCT ranking_key_x || '|' || ranking_key_y AS key FROM correlation_analysis",
    keyColumn: "key_pair",
    deleteWhere: (key) => {
      const [kx, ky] = key.split("|");
      return `DELETE FROM correlation_analysis WHERE ranking_key_x = '${kx.replace(/'/g, "''")}' AND ranking_key_y = '${ky.replace(/'/g, "''")}'`;
    },
    // correlation_analysis は大量キー（58k+）のためタイムスタンプ比較はスキップ
  },
  ranking_ai_content: {
    keyQuery: "SELECT ranking_key || '|' || area_type AS key FROM ranking_ai_content",
    keyColumn: "ranking_key_area",
    deleteWhere: (key) => {
      const [rk, at] = key.split("|");
      return `DELETE FROM ranking_ai_content WHERE ranking_key = '${rk.replace(/'/g, "''")}' AND area_type = '${at.replace(/'/g, "''")}'`;
    },
    timestampQuery:
      "SELECT ranking_key || '|' || area_type AS key, updated_at AS ts FROM ranking_ai_content",
  },
  port_statistics: {
    keyQuery: "SELECT DISTINCT metric_key AS key FROM port_statistics",
    keyColumn: "metric_key",
    deleteWhere: (key) =>
      `DELETE FROM port_statistics WHERE metric_key = '${key.replace(/'/g, "''")}'`,
    timestampQuery:
      "SELECT metric_key AS key, MAX(updated_at) AS ts FROM port_statistics GROUP BY metric_key",
  },
};

/** 少量テーブル（行数比較のみ、フル同期で対応） */
const SMALL_TABLES = [
  "articles",
  "affiliate_ads",
  "categories",
  "subcategories",
  "data_sources",
  "surveys",
  "ranking_page_cards",
  "ranking_tags",
  "comparison_components",
  "estat_metainfo",
  "estat_stats_tables",
  "area_profile_rankings",
  "ports",
  "fishing_ports",
  "port_trade_detail",
];

const SYSTEM_TABLE_PATTERNS = [/^sqlite_/, /^_cf_/, /^__drizzle/, /^d1_/];

// ── 型 ──────────────────────────────────────────────

interface Args {
  table?: string;
  execute: boolean;
  direction: "push" | "pull";
}

interface KeyDiff {
  table: string;
  localOnly: string[];
  remoteOnly: string[];
  common: number;
  /** 共通キーのうち、ローカルの updated_at がリモートより新しいキー */
  localNewer: string[];
  /** 共通キーのうち、リモートの updated_at がローカルより新しいキー */
  remoteNewer: string[];
}

interface CountDiff {
  table: string;
  local: number;
  remote: number;
  /** ローカルの MAX(updated_at) */
  localMaxTs?: string;
  /** リモートの MAX(updated_at) */
  remoteMaxTs?: string;
}

// ── CLI引数パース ──────────────────────────────────────

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const result: Args = { execute: false, direction: "push" };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--table":
        result.table = args[++i];
        break;
      case "--execute":
        result.execute = true;
        break;
      case "--direction":
        result.direction = args[++i] as "push" | "pull";
        if (result.direction !== "push" && result.direction !== "pull") {
          console.error("--direction must be 'push' or 'pull'");
          process.exit(1);
        }
        break;
      default:
        console.error(`Unknown argument: ${args[i]}`);
        process.exit(1);
    }
  }

  return result;
}

// ── wrangler リモートクエリ ──────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeRemoteQuery(sql: string): Promise<Record<string, unknown>[]> {
  const escaped = sql.replace(/"/g, '\\"');
  const cmd = `npx wrangler d1 execute ${REMOTE_DB_NAME} --remote --env ${REMOTE_ENV} --json --command="${escaped}"`;

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
      const execErr = err as { message?: string; stdout?: string };
      if (attempt < MAX_RETRIES) {
        console.warn(`    [RETRY ${attempt}/${MAX_RETRIES}]`);
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw err;
    }

    const jsonStart = stdout.indexOf("[");
    if (jsonStart === -1) throw new Error(`JSON parse failed: ${stdout.slice(0, 200)}`);

    const parsed = JSON.parse(stdout.slice(jsonStart));
    if (Array.isArray(parsed) && parsed[0]?.results) {
      return parsed[0].results as Record<string, unknown>[];
    }
    return [];
  }

  throw new Error(`${MAX_RETRIES} retries exhausted`);
}

async function executeRemoteCommand(sql: string): Promise<void> {
  const escaped = sql.replace(/"/g, '\\"');
  const cmd = `npx wrangler d1 execute ${REMOTE_DB_NAME} --remote --env ${REMOTE_ENV} --command="${escaped}" -y`;
  execSync(cmd, {
    cwd: WEB_APP_DIR,
    maxBuffer: MAX_BUFFER,
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
}

// ── キー差分検知 ──────────────────────────────────────

async function getKeyDiff(
  db: Database.Database,
  table: string
): Promise<KeyDiff | null> {
  const config = KEY_DIFF_TABLES[table];
  if (!config) return null;

  // ローカルキー取得
  let localKeys: Set<string>;
  try {
    const rows = db.prepare(config.keyQuery).all() as { key: string }[];
    localKeys = new Set(rows.map((r) => r.key));
  } catch {
    localKeys = new Set();
  }

  // リモートキー取得
  let remoteKeys: Set<string>;
  try {
    const rows = await executeRemoteQuery(config.keyQuery);
    remoteKeys = new Set(rows.map((r) => r.key as string));
  } catch {
    remoteKeys = new Set();
  }

  const localOnly = [...localKeys].filter((k) => !remoteKeys.has(k)).sort();
  const remoteOnly = [...remoteKeys].filter((k) => !localKeys.has(k)).sort();
  const commonKeys = [...localKeys].filter((k) => remoteKeys.has(k));
  const common = commonKeys.length;

  // ── タイムスタンプ比較（共通キーの値レベル変更検知） ──
  let localNewer: string[] = [];
  let remoteNewer: string[] = [];

  if (config.timestampQuery && commonKeys.length > 0) {
    try {
      // ローカルのタイムスタンプ取得
      const localTsRows = db.prepare(config.timestampQuery).all() as { key: string; ts: string | null }[];
      const localTsMap = new Map(localTsRows.map((r) => [r.key, r.ts ?? ""]));

      // リモートのタイムスタンプ取得
      const remoteTsRows = await executeRemoteQuery(config.timestampQuery);
      const remoteTsMap = new Map(
        remoteTsRows.map((r) => [r.key as string, (r.ts as string) ?? ""])
      );

      for (const key of commonKeys) {
        const localTs = localTsMap.get(key) ?? "";
        const remoteTs = remoteTsMap.get(key) ?? "";
        if (localTs > remoteTs) {
          localNewer.push(key);
        } else if (remoteTs > localTs) {
          remoteNewer.push(key);
        }
      }

      localNewer.sort();
      remoteNewer.sort();
    } catch {
      // タイムスタンプ取得に失敗しても、キー差分レポートは返す
    }
  }

  return { table, localOnly, remoteOnly, common, localNewer, remoteNewer };
}

// ── 行数差分 ──────────────────────────────────────────

async function getCountDiff(
  db: Database.Database,
  table: string
): Promise<CountDiff | null> {
  let local: number;
  let localMaxTs: string | undefined;
  try {
    const row = db.prepare(`SELECT COUNT(*) as c FROM "${table}"`).get() as { c: number };
    local = row.c;
    // updated_at カラムが存在するか確認してから取得
    const cols = db.prepare(`PRAGMA table_info("${table}")`).all() as { name: string }[];
    const hasUpdatedAt = cols.some((c) => c.name === "updated_at");
    if (hasUpdatedAt) {
      const tsRow = db.prepare(`SELECT MAX(updated_at) as ts FROM "${table}"`).get() as { ts: string | null };
      localMaxTs = tsRow.ts ?? undefined;
    }
  } catch {
    return null;
  }

  let remote: number;
  let remoteMaxTs: string | undefined;
  try {
    const rows = await executeRemoteQuery(`SELECT COUNT(*) as c FROM "${table}"`);
    remote = (rows[0]?.c as number) ?? 0;
    // ローカルに updated_at があるならリモートも取得
    if (localMaxTs !== undefined) {
      try {
        const tsRows = await executeRemoteQuery(`SELECT MAX(updated_at) as ts FROM "${table}"`);
        remoteMaxTs = (tsRows[0]?.ts as string) ?? undefined;
      } catch {
        // ignore
      }
    }
  } catch {
    return null;
  }

  return { table, local, remote, localMaxTs, remoteMaxTs };
}

// ── push 実行（ローカル → リモート） ──────────────────

async function executePushKey(
  db: Database.Database,
  table: string,
  key: string
): Promise<void> {
  const config = KEY_DIFF_TABLES[table];
  if (!config) return;

  // リモートから既存データを削除（REST API）
  await executeRemoteSQL(`PRAGMA foreign_keys=OFF; ${config.deleteWhere(key)}`);

  // ローカルからデータをエクスポート
  let whereClause: string;
  if (table === "ranking_data") {
    whereClause = `category_code = '${key.replace(/'/g, "''")}'`;
  } else if (table === "ranking_items") {
    whereClause = `ranking_key = '${key.replace(/'/g, "''")}'`;
  } else if (table === "correlation_analysis") {
    const [kx, ky] = key.split("|");
    whereClause = `ranking_key_x = '${kx.replace(/'/g, "''")}' AND ranking_key_y = '${ky.replace(/'/g, "''")}'`;
  } else if (table === "ranking_ai_content") {
    const [rk, at] = key.split("|");
    whereClause = `ranking_key = '${rk.replace(/'/g, "''")}' AND area_type = '${at.replace(/'/g, "''")}'`;
  } else if (table === "port_statistics") {
    whereClause = `metric_key = '${key.replace(/'/g, "''")}'`;
  } else {
    return;
  }

  const rows = db.prepare(`SELECT * FROM "${table}" WHERE ${whereClause}`).all() as Record<string, unknown>[];
  if (rows.length === 0) return;

  const cols = Object.keys(rows[0]);
  const CHUNK_SIZE = 500;
  const chunks = buildInsertChunks(rows, table, cols, CHUNK_SIZE);
  const { ok, failed } = await executeRemoteBulkSQL(chunks, 5);

  console.log(`    Pushed ${rows.length} rows for key: ${key}${failed > 0 ? ` (${failed} chunks failed)` : ""}`);
}

async function executeDeleteRemoteKey(table: string, key: string): Promise<void> {
  const config = KEY_DIFF_TABLES[table];
  if (!config) return;

  await executeRemoteSQL(`PRAGMA foreign_keys=OFF; ${config.deleteWhere(key)}`);
  console.log(`    Deleted remote key: ${key}`);
}

// ── pull 実行（リモート → ローカル） ──────────────────

async function executePullKey(
  db: Database.Database,
  table: string,
  key: string
): Promise<void> {
  const config = KEY_DIFF_TABLES[table];
  if (!config) return;

  // ローカルから既存データを削除
  let whereClause: string;
  if (table === "ranking_data") {
    whereClause = `category_code = '${key.replace(/'/g, "''")}'`;
  } else if (table === "ranking_items") {
    whereClause = `ranking_key = '${key.replace(/'/g, "''")}'`;
  } else if (table === "correlation_analysis") {
    const [kx, ky] = key.split("|");
    whereClause = `ranking_key_x = '${kx.replace(/'/g, "''")}' AND ranking_key_y = '${ky.replace(/'/g, "''")}'`;
  } else if (table === "ranking_ai_content") {
    const [rk, at] = key.split("|");
    whereClause = `ranking_key = '${rk.replace(/'/g, "''")}' AND area_type = '${at.replace(/'/g, "''")}'`;
  } else {
    return;
  }

  db.exec(`DELETE FROM "${table}" WHERE ${whereClause}`);

  // リモートからデータを取得
  const rows = await executeRemoteQuery(
    `SELECT * FROM "${table}" WHERE ${whereClause}`
  );
  if (rows.length === 0) return;

  // ローカルに INSERT
  const cols = Object.keys(rows[0]);
  const placeholders = cols.map(() => "?").join(", ");
  const stmt = db.prepare(
    `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`
  );

  const insertBatch = db.transaction((dataRows: Record<string, unknown>[]) => {
    for (const row of dataRows) {
      const values = cols.map((c) => {
        const v = row[c];
        if (v !== null && typeof v === "object") return JSON.stringify(v);
        return v as string | number | null;
      });
      stmt.run(...values);
    }
  });

  insertBatch(rows);
  console.log(`    Pulled ${rows.length} rows for key: ${key}`);
}

async function executeDeleteLocalKey(
  db: Database.Database,
  table: string,
  key: string
): Promise<void> {
  const config = KEY_DIFF_TABLES[table];
  if (!config) return;

  let whereClause: string;
  if (table === "ranking_data") {
    whereClause = `category_code = '${key.replace(/'/g, "''")}'`;
  } else if (table === "ranking_items") {
    whereClause = `ranking_key = '${key.replace(/'/g, "''")}'`;
  } else if (table === "correlation_analysis") {
    const [kx, ky] = key.split("|");
    whereClause = `ranking_key_x = '${kx.replace(/'/g, "''")}' AND ranking_key_y = '${ky.replace(/'/g, "''")}'`;
  } else if (table === "ranking_ai_content") {
    const [rk, at] = key.split("|");
    whereClause = `ranking_key = '${rk.replace(/'/g, "''")}' AND area_type = '${at.replace(/'/g, "''")}'`;
  } else {
    return;
  }

  db.exec(`DELETE FROM "${table}" WHERE ${whereClause}`);
  console.log(`    Deleted local key: ${key}`);
}

// ── フル同期（少量テーブル） ──────────────────────────

async function fullSyncPush(
  db: Database.Database,
  table: string
): Promise<void> {
  // リモート DELETE（REST API）
  await executeRemoteSQL(`PRAGMA foreign_keys=OFF; DELETE FROM "${table}"`);

  // ローカルからエクスポート
  const rows = db.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[];
  if (rows.length === 0) {
    console.log(`    Pushed 0 rows (empty table)`);
    return;
  }

  const cols = Object.keys(rows[0]);
  const chunks = buildInsertChunks(rows, table, cols, 500);
  const { ok, failed } = await executeRemoteBulkSQL(chunks, 5, (c, f, t) => {
    if (rows.length > 5000 && (c + f) % 20 === 0) {
      console.log(`    ${table}: ${c + f}/${t} chunks...`);
    }
  });

  console.log(`    Pushed ${rows.length} rows (full sync)${failed > 0 ? ` — ${failed} chunks failed` : ""}`);
}

// ── メイン ──────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const dirLabel = args.direction === "push" ? "ローカル → リモート" : "リモート → ローカル";

  console.log(`=== D1 差分レポート (${dirLabel}) ===\n`);

  const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
  console.log(`Local DB: ${dbPath}\n`);
  const db = new Database(dbPath);

  try {
    // 対象テーブルを決定
    const keyTables = args.table
      ? Object.keys(KEY_DIFF_TABLES).filter((t) => t === args.table)
      : Object.keys(KEY_DIFF_TABLES);
    const smallTbls = args.table
      ? SMALL_TABLES.filter((t) => t === args.table)
      : SMALL_TABLES;

    // ── キーベース差分 ──
    const keyDiffs: KeyDiff[] = [];
    for (const table of keyTables) {
      process.stdout.write(`Scanning ${table}...`);
      const diff = await getKeyDiff(db, table);
      if (diff) {
        keyDiffs.push(diff);
        const hasKeyChanges = diff.localOnly.length > 0 || diff.remoteOnly.length > 0;
        const hasValueChanges = diff.localNewer.length > 0 || diff.remoteNewer.length > 0;
        if (hasKeyChanges && hasValueChanges) {
          console.log(` diff found (keys + values)`);
        } else if (hasKeyChanges) {
          console.log(` diff found`);
        } else if (hasValueChanges) {
          console.log(` values changed (${diff.localNewer.length} local newer, ${diff.remoteNewer.length} remote newer)`);
        } else {
          console.log(` in sync`);
        }
      } else {
        console.log(" skipped");
      }
    }

    // ── 少量テーブル行数比較 ──
    const countDiffs: CountDiff[] = [];
    for (const table of smallTbls) {
      const diff = await getCountDiff(db, table);
      if (diff) countDiffs.push(diff);
    }

    // ── レポート表示 ──
    console.log("\n── キーベース差分 ──\n");

    let totalInsert = 0;
    let totalDelete = 0;

    for (const diff of keyDiffs) {
      const hasChanges =
        diff.localOnly.length > 0 ||
        diff.remoteOnly.length > 0 ||
        diff.localNewer.length > 0 ||
        diff.remoteNewer.length > 0;
      if (!hasChanges) {
        console.log(`${diff.table}: ✓ 同期済み (${diff.common} keys)`);
        continue;
      }

      console.log(`${diff.table}:`);
      console.log(`  共通: ${diff.common} keys`);

      if (diff.localOnly.length > 0) {
        console.log(`  ローカルのみ (${diff.localOnly.length} keys):`);
        const show = diff.localOnly.slice(0, 10);
        show.forEach((k) => console.log(`    + ${k}`));
        if (diff.localOnly.length > 10) console.log(`    ... 他 ${diff.localOnly.length - 10} keys`);
        if (args.direction === "push") totalInsert += diff.localOnly.length;
        else totalDelete += diff.localOnly.length;
      }

      if (diff.remoteOnly.length > 0) {
        console.log(`  リモートのみ (${diff.remoteOnly.length} keys):`);
        const show = diff.remoteOnly.slice(0, 10);
        show.forEach((k) => console.log(`    - ${k}`));
        if (diff.remoteOnly.length > 10) console.log(`    ... 他 ${diff.remoteOnly.length - 10} keys`);
        if (args.direction === "push") totalDelete += diff.remoteOnly.length;
        else totalInsert += diff.remoteOnly.length;
      }

      if (diff.localNewer.length > 0) {
        console.log(`  ローカルが新しい (${diff.localNewer.length} keys):`);
        const show = diff.localNewer.slice(0, 10);
        show.forEach((k) => console.log(`    ~ ${k}`));
        if (diff.localNewer.length > 10) console.log(`    ... 他 ${diff.localNewer.length - 10} keys`);
      }

      if (diff.remoteNewer.length > 0) {
        console.log(`  リモートが新しい (${diff.remoteNewer.length} keys):`);
        const show = diff.remoteNewer.slice(0, 10);
        show.forEach((k) => console.log(`    ~ ${k}`));
        if (diff.remoteNewer.length > 10) console.log(`    ... 他 ${diff.remoteNewer.length - 10} keys`);
      }

      console.log();
    }

    console.log("── 少量テーブル（行数比較） ──\n");

    const smallDiffTables: CountDiff[] = [];
    for (const diff of countDiffs) {
      const countDiffers = diff.local !== diff.remote;
      const tsDiffers =
        diff.localMaxTs !== undefined &&
        diff.remoteMaxTs !== undefined &&
        diff.localMaxTs !== diff.remoteMaxTs;
      const hasAnyDiff = countDiffers || tsDiffers;
      const markers: string[] = [];
      if (countDiffers) markers.push("count");
      if (tsDiffers) {
        const dir = (diff.localMaxTs ?? "") > (diff.remoteMaxTs ?? "") ? "local newer" : "remote newer";
        markers.push(dir);
      }
      const suffix = markers.length > 0 ? ` * (${markers.join(", ")})` : "";
      console.log(`${diff.table}: local=${diff.local}, remote=${diff.remote}${suffix}`);
      if (hasAnyDiff) smallDiffTables.push(diff);
    }

    // ── サマリー ──
    const hasKeyChanges = keyDiffs.some(
      (d) =>
        d.localOnly.length > 0 ||
        d.remoteOnly.length > 0 ||
        d.localNewer.length > 0 ||
        d.remoteNewer.length > 0
    );
    const hasCountChanges = smallDiffTables.length > 0;

    if (!hasKeyChanges && !hasCountChanges) {
      console.log("\n✓ すべて同期済みです。");
      return;
    }

    console.log(`\n── アクション (${dirLabel}) ──\n`);

    if (args.direction === "push") {
      for (const diff of keyDiffs) {
        if (diff.localOnly.length > 0)
          console.log(`  INSERT → リモート: ${diff.table} × ${diff.localOnly.length} keys`);
        if (diff.remoteOnly.length > 0)
          console.log(`  DELETE ← リモート: ${diff.table} × ${diff.remoteOnly.length} keys`);
        if (diff.localNewer.length > 0)
          console.log(`  UPDATE → リモート: ${diff.table} × ${diff.localNewer.length} keys (ローカルが新しい)`);
        if (diff.remoteNewer.length > 0)
          console.log(`  SKIP (リモートが新しい): ${diff.table} × ${diff.remoteNewer.length} keys`);
      }
      for (const diff of smallDiffTables) {
        console.log(`  FULL SYNC → リモート: ${diff.table} (${diff.local} rows)`);
      }
    } else {
      for (const diff of keyDiffs) {
        if (diff.remoteOnly.length > 0)
          console.log(`  INSERT → ローカル: ${diff.table} × ${diff.remoteOnly.length} keys`);
        if (diff.localOnly.length > 0)
          console.log(`  DELETE ← ローカル: ${diff.table} × ${diff.localOnly.length} keys`);
        if (diff.remoteNewer.length > 0)
          console.log(`  UPDATE → ローカル: ${diff.table} × ${diff.remoteNewer.length} keys (リモートが新しい)`);
        if (diff.localNewer.length > 0)
          console.log(`  SKIP (ローカルが新しい): ${diff.table} × ${diff.localNewer.length} keys`);
      }
      for (const diff of smallDiffTables) {
        console.log(`  FULL SYNC → ローカル: ${diff.table} (${diff.remote} rows)`);
      }
    }

    if (!args.execute) {
      console.log("\n差分レポートのみ。実行するには --execute を追加してください。");
      return;
    }

    // ── 実行 ──
    console.log("\n── 同期実行中 ──\n");

    for (const diff of keyDiffs) {
      if (args.direction === "push") {
        // ローカルのみ → リモートに INSERT
        for (const key of diff.localOnly) {
          await executePushKey(db, diff.table, key);
        }
        // リモートのみ → リモートから DELETE
        for (const key of diff.remoteOnly) {
          await executeDeleteRemoteKey(diff.table, key);
        }
        // ローカルが新しい → リモートを UPDATE（DELETE + INSERT）
        for (const key of diff.localNewer) {
          await executePushKey(db, diff.table, key);
        }
      } else {
        // リモートのみ → ローカルに INSERT
        for (const key of diff.remoteOnly) {
          await executePullKey(db, diff.table, key);
        }
        // ローカルのみ → ローカルから DELETE
        for (const key of diff.localOnly) {
          await executeDeleteLocalKey(db, diff.table, key);
        }
        // リモートが新しい → ローカルを UPDATE（DELETE + INSERT）
        for (const key of diff.remoteNewer) {
          await executePullKey(db, diff.table, key);
        }
      }
    }

    // 少量テーブルのフル同期
    for (const diff of smallDiffTables) {
      console.log(`  ${diff.table}: full sync...`);
      if (args.direction === "push") {
        await fullSyncPush(db, diff.table);
      } else {
        // pull: 既存の pull-remote-d1 ロジックを再利用するため、ここでは簡易実装
        db.exec(`DELETE FROM "${diff.table}"`);
        const rows = await executeRemoteQuery(`SELECT * FROM "${diff.table}"`);
        if (rows.length > 0) {
          const cols = Object.keys(rows[0]);
          const placeholders = cols.map(() => "?").join(", ");
          const stmt = db.prepare(
            `INSERT INTO "${diff.table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${placeholders})`
          );
          const insertAll = db.transaction((dataRows: Record<string, unknown>[]) => {
            for (const row of dataRows) {
              const values = cols.map((c) => {
                const v = row[c];
                if (v !== null && typeof v === "object") return JSON.stringify(v);
                return v as string | number | null;
              });
              stmt.run(...values);
            }
          });
          insertAll(rows);
        }
        console.log(`    Pulled ${rows.length} rows (full sync)`);
      }
    }

    console.log("\n✓ 同期完了");
  } finally {
    db.close();
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
