#!/usr/bin/env tsx
/**
 * D1 gis_datasets から docs/01_技術設計/08_国土数値情報GISデータ.md の
 * 「登録済みデータセット」「ダウンロード済みデータ」「候補一覧」3 表を自動生成する。
 *
 * Phase 2 of GIS dataset management refactor (plan: stateless-stargazing-teapot).
 *
 * 自動生成セクションは <!-- AUTO-GENERATED:START --> / <!-- AUTO-GENERATED:END --> で
 * 囲まれた範囲のみ書き換える。それ以外の手動セクション
 * (パイプライン処理 / ジオメトリ型別の実装パターン / モジュール構成 /
 * 新しいデータセットの追加方法 / ライセンスと出典表示) は保持される。
 *
 * Usage:
 *   npx tsx packages/gis/src/mlit-ksj/scripts/generate-docs.ts
 *   npx tsx packages/gis/src/mlit-ksj/scripts/generate-docs.ts --dry-run
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";

const LOCAL_D1_PATH =
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";

const DOCS_PATH = "docs/01_技術設計/08_国土数値情報GISデータ.md";

const AUTO_START = "<!-- AUTO-GENERATED:START -->";
const AUTO_END = "<!-- AUTO-GENERATED:END -->";

const CATEGORY_LABELS: Record<string, string> = {
  land: "国土(水・土地)",
  policy: "政策区域",
  facility: "施設",
  transport: "交通",
  statistics: "統計",
};

const LICENSE_LABELS: Record<string, string> = {
  "cc-by-4.0": "CC BY 4.0",
  "cc-by-4.0-partial": "CC BY 4.0(一部制限)",
  "commercial-ok": "商用可",
  "non-commercial": "非商用",
  unknown: "未確認",
};

interface Row {
  data_id: string;
  name: string;
  category: string;
  geometry_type: string;
  coverage: string;
  license: string;
  status: string;
  r2_version: string | null;
  latest_version: string | null;
  file_count: number | null;
  total_size_bytes: number | null;
  stats47_category: string | null;
  is_ranking_target: number;
}

function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf-8"),
      );
      if (pkg.workspaces || pkg.name === "stats47") return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find project root");
}

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

function renderRegisteredTable(rows: Row[]): string {
  // 登録済み (status='registered'/'imported'、category 別にグループ化)
  const filtered = rows.filter(
    (r) => r.status === "registered" || r.status === "imported",
  );

  const lines: string[] = [];
  lines.push("### 登録済みデータセット (status='registered' / 'imported')");
  lines.push("");
  lines.push(`合計 ${filtered.length} 件。`);
  lines.push("");

  const byCategory = new Map<string, Row[]>();
  for (const r of filtered) {
    const arr = byCategory.get(r.category) ?? [];
    arr.push(r);
    byCategory.set(r.category, arr);
  }

  const orderedCategories = ["land", "policy", "facility", "transport", "statistics"];
  for (const cat of orderedCategories) {
    const items = byCategory.get(cat);
    if (!items) continue;
    lines.push(`#### ${CATEGORY_LABELS[cat] ?? cat}`);
    lines.push("");
    lines.push("| ID | データ名 | 型 | 範囲 | ライセンス | stats47カテゴリ | ranking |");
    lines.push("|---|---|---|---|---|---|---|");
    for (const r of items) {
      lines.push(
        `| ${r.data_id} | ${r.name} | ${r.geometry_type} | ${r.coverage} | ${LICENSE_LABELS[r.license] ?? r.license} | ${r.stats47_category ?? "—"} | ${r.is_ranking_target ? "✓" : ""} |`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function renderImportedTable(rows: Row[]): string {
  // ダウンロード済み (status='imported')
  const filtered = rows
    .filter((r) => r.status === "imported")
    .sort((a, b) => {
      const ba = a.total_size_bytes ?? 0;
      const bb = b.total_size_bytes ?? 0;
      return bb - ba;
    });

  const lines: string[] = [];
  lines.push("### ダウンロード済みデータ (status='imported')");
  lines.push("");
  lines.push(`合計 ${filtered.length} 件 / ${formatBytes(filtered.reduce((s, r) => s + (r.total_size_bytes ?? 0), 0))}`);
  lines.push("");
  lines.push("| ID | データ名 | バージョン | ファイル数 | サイズ |");
  lines.push("|---|---|---|---|---|");
  for (const r of filtered) {
    lines.push(
      `| ${r.data_id} | ${r.name} | ${r.r2_version ?? "—"} | ${r.file_count ?? "—"} | ${formatBytes(r.total_size_bytes)} |`,
    );
  }
  return lines.join("\n");
}

function renderAvailableTable(rows: Row[]): string {
  // 候補 (status='available')
  const filtered = rows.filter((r) => r.status === "available");

  const lines: string[] = [];
  lines.push("### 候補一覧 (status='available'、stats47 未登録)");
  lines.push("");
  if (filtered.length === 0) {
    lines.push("現在、KSJ カタログ seed (Phase 3) 未実行のため候補なし。");
    lines.push("");
    lines.push("`npx tsx packages/gis/src/mlit-ksj/scripts/seed-ksj-catalog.ts` で投入可能。");
    return lines.join("\n");
  }
  lines.push(`合計 ${filtered.length} 件。stats47 への取り込み候補。`);
  lines.push("");
  lines.push("| ID | データ名 | カテゴリ | ライセンス |");
  lines.push("|---|---|---|---|");
  for (const r of filtered) {
    lines.push(
      `| ${r.data_id} | ${r.name} | ${CATEGORY_LABELS[r.category] ?? r.category} | ${LICENSE_LABELS[r.license] ?? r.license} |`,
    );
  }
  return lines.join("\n");
}

function buildAutoSection(rows: Row[]): string {
  const summary: Record<string, number> = {
    available: 0,
    registered: 0,
    imported: 0,
    deprecated: 0,
  };
  for (const r of rows) summary[r.status] = (summary[r.status] ?? 0) + 1;
  const generatedAt = new Date().toISOString();

  const parts: string[] = [];
  parts.push(AUTO_START);
  parts.push("");
  parts.push(`<!-- generated: ${generatedAt} by scripts/generate-docs.ts -->`);
  parts.push("");
  parts.push("## データセット一覧 (D1: gis_datasets)");
  parts.push("");
  parts.push(
    `状態別件数: available ${summary.available} / registered ${summary.registered} / imported ${summary.imported} / deprecated ${summary.deprecated} (計 ${rows.length})`,
  );
  parts.push("");
  parts.push(renderRegisteredTable(rows));
  parts.push("");
  parts.push(renderImportedTable(rows));
  parts.push("");
  parts.push(renderAvailableTable(rows));
  parts.push("");
  parts.push(AUTO_END);

  return parts.join("\n");
}

function main(): void {
  const dryRun = process.argv.includes("--dry-run");
  const projectRoot = findProjectRoot();
  const dbPath = path.join(projectRoot, LOCAL_D1_PATH);
  if (!fs.existsSync(dbPath)) {
    console.error(`ローカル D1 SQLite が見つかりません: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true });
  const rows = db
    .prepare(
      `SELECT data_id, name, category, geometry_type, coverage, license, status,
              r2_version, latest_version, file_count, total_size_bytes,
              stats47_category, is_ranking_target
       FROM gis_datasets
       ORDER BY category, data_id`,
    )
    .all() as Row[];
  db.close();

  const autoSection = buildAutoSection(rows);

  const docsPath = path.join(projectRoot, DOCS_PATH);
  if (!fs.existsSync(docsPath)) {
    console.error(`docs ファイルが見つかりません: ${docsPath}`);
    process.exit(1);
  }
  const existing = fs.readFileSync(docsPath, "utf-8");

  let newContent: string;
  if (existing.includes(AUTO_START) && existing.includes(AUTO_END)) {
    // 既存マーカーがある場合: マーカー間を置換
    const startIdx = existing.indexOf(AUTO_START);
    const endIdx = existing.indexOf(AUTO_END) + AUTO_END.length;
    newContent =
      existing.slice(0, startIdx) + autoSection + existing.slice(endIdx);
  } else {
    // マーカーがない場合: 末尾に追記
    newContent = existing.trimEnd() + "\n\n" + autoSection + "\n";
  }

  if (dryRun) {
    console.log("(dry-run) 以下を書き出す予定:");
    console.log("---");
    console.log(autoSection.slice(0, 800));
    console.log("...");
    return;
  }

  fs.writeFileSync(docsPath, newContent, "utf-8");
  console.log(`✅ generated: ${docsPath}`);
  console.log(`   datasets: ${rows.length} 件`);
}

main();
