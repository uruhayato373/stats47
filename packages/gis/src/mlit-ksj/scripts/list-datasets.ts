#!/usr/bin/env tsx
/**
 * gis_datasets テーブル（ローカル D1）を整形してコンソール出力する。
 *
 * 旧 /gis ダッシュボードページ（noindex 内部ツール、2026-05 削除）の代替。
 * pipeline 実行結果（status / r2_version / file_count / total_size_bytes）を
 * 一覧で確認するための CLI。
 *
 * Usage:
 *   npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts
 *   npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --status=imported
 *   npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --status=available
 *   npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --downloaded   # alias: --status=imported
 *   npx tsx packages/gis/src/mlit-ksj/scripts/list-datasets.ts --category=transport
 */

import * as fs from "node:fs";
import Database from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../../database/src/config/local-db-paths";

type Status = "available" | "registered" | "imported" | "deprecated";
const VALID_STATUSES: Status[] = [
  "available",
  "registered",
  "imported",
  "deprecated",
];

interface Row {
  data_id: string;
  name: string;
  category: string;
  geometry_type: string;
  coverage: string;
  status: Status;
  r2_version: string | null;
  file_count: number | null;
  total_size_bytes: number | null;
  last_imported_at: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  land: "国土",
  policy: "政策",
  facility: "施設",
  transport: "交通",
  statistics: "統計",
};

const STATUS_MARKS: Record<Status, string> = {
  available: "▫",
  registered: "○",
  imported: "✓",
  deprecated: "✗",
};

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

function visibleWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    w += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  }
  return w;
}

function padRight(s: string, width: number): string {
  const pad = width - visibleWidth(s);
  return pad > 0 ? s + " ".repeat(pad) : s;
}

function parseArgs(args: string[]): {
  statusFilter: Status | null;
  categoryFilter: string | null;
} {
  let statusFilter: Status | null = null;
  let categoryFilter: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--downloaded") {
      statusFilter = "imported"; // alias (旧名互換)
      continue;
    }

    // --status=value または --status value
    const statusMatch = /^--status(?:=(.+))?$/.exec(arg);
    if (statusMatch) {
      const value = statusMatch[1] ?? args[++i];
      if (!VALID_STATUSES.includes(value as Status)) {
        console.error(
          `--status は ${VALID_STATUSES.join("|")} のいずれかを指定してください (got: ${value})`,
        );
        process.exit(1);
      }
      statusFilter = value as Status;
      continue;
    }

    const categoryMatch = /^--category(?:=(.+))?$/.exec(arg);
    if (categoryMatch) {
      categoryFilter = categoryMatch[1] ?? args[++i];
      continue;
    }
  }

  return { statusFilter, categoryFilter };
}

function main(): void {
  const { statusFilter, categoryFilter } = parseArgs(process.argv.slice(2));

  const dbPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (!fs.existsSync(dbPath)) {
    console.error(`ローカル D1 SQLite が見つかりません: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true });
  const allRows = db
    .prepare(
      `SELECT data_id, name, category, geometry_type, coverage, status,
              r2_version, file_count, total_size_bytes, last_imported_at
       FROM gis_datasets
       ORDER BY status, category, data_id`,
    )
    .all() as Row[];
  db.close();

  // status 集計 (フィルタ前の全体)
  const statusCounts: Record<Status, number> = {
    available: 0,
    registered: 0,
    imported: 0,
    deprecated: 0,
  };
  for (const r of allRows) statusCounts[r.status]++;

  console.log("");
  console.log(
    `  状態: available ${statusCounts.available} / registered ${statusCounts.registered} / imported ${statusCounts.imported} / deprecated ${statusCounts.deprecated} (計 ${allRows.length})`,
  );

  // フィルタ適用
  let rows = allRows;
  if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
  if (categoryFilter) rows = rows.filter((r) => r.category === categoryFilter);

  if (rows.length === 0) {
    console.log("");
    console.log(`  該当データセットなし (filter: status=${statusFilter ?? "*"} category=${categoryFilter ?? "*"})`);
    console.log("");
    return;
  }

  const header = [
    "状態",
    "ID",
    "名前",
    "カテゴリ",
    "型",
    "バージョン",
    "ファイル",
    "サイズ",
  ];
  const widths = [4, 10, 28, 10, 8, 12, 8, 10];

  console.log("");
  console.log("  " + header.map((h, i) => padRight(h, widths[i])).join(" "));
  console.log("  " + widths.map((w) => "─".repeat(w)).join(" "));

  for (const r of rows) {
    const cells = [
      STATUS_MARKS[r.status],
      r.data_id,
      r.name,
      CATEGORY_LABELS[r.category] ?? r.category,
      r.geometry_type,
      r.r2_version ?? "—",
      r.file_count !== null ? String(r.file_count) : "—",
      formatBytes(r.total_size_bytes),
    ];
    console.log("  " + cells.map((c, i) => padRight(c, widths[i])).join(" "));
  }

  const totalBytes = rows.reduce(
    (sum, r) => sum + (r.total_size_bytes ?? 0),
    0,
  );
  console.log("");
  console.log(`  表示: ${rows.length} 件 / 合計 ${formatBytes(totalBytes)}`);
  console.log("");
}

main();
