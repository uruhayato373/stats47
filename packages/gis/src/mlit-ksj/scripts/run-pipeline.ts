#!/usr/bin/env tsx
/**
 * KSJ データパイプライン CLI
 *
 * 使い方:
 *   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts N02
 *   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts P04 --pref 13
 *   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --category transport
 *   npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts --list
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";

import { runKsjPipeline } from "../pipeline";
import type { KsjPipelineResult } from "../types";

const LOCAL_D1_PATH =
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";

interface DatasetMeta {
  data_id: string;
  name: string;
  category: string;
  coverage: string;
}

/** D1 から category 別の登録済み (status='registered'|'imported') データセットを取得 */
function fetchDatasetsByCategory(category: string): DatasetMeta[] {
  const projectRoot = findProjectRoot();
  const dbPath = path.join(projectRoot, LOCAL_D1_PATH);
  const db = new Database(dbPath, { readonly: true });
  const rows = db
    .prepare(
      `SELECT data_id, name, category, coverage
       FROM gis_datasets
       WHERE category = ? AND status IN ('registered', 'imported')
       ORDER BY data_id`,
    )
    .all(category) as DatasetMeta[];
  db.close();
  return rows;
}

/** D1 から指定 dataId のメタを取得 */
function fetchDatasetMeta(dataId: string): DatasetMeta | null {
  const projectRoot = findProjectRoot();
  const dbPath = path.join(projectRoot, LOCAL_D1_PATH);
  const db = new Database(dbPath, { readonly: true });
  const row = db
    .prepare(
      `SELECT data_id, name, category, coverage FROM gis_datasets WHERE data_id = ?`,
    )
    .get(dataId) as DatasetMeta | undefined;
  db.close();
  return row ?? null;
}

function printHelp() {
  console.log(`
KSJ データパイプライン

使い方:
  run-pipeline.ts <DATA_ID> [options]

オプション:
  --pref <code>       都道府県コード（県別データの場合）
  --all-prefs         県別データの全47都道府県を一括取得
  --version <v>       バージョン指定（デフォルト: latestVersion）
  --skip-download     既存 zip を再利用
  --category <cat>    カテゴリ内の全国データセットを一括取得
  --list              登録済みデータセット一覧

例:
  run-pipeline.ts N02                    # 鉄道（全国）
  run-pipeline.ts P04 --pref 13          # 医療機関（東京）
  run-pipeline.ts P04 --all-prefs        # 医療機関（全47都道府県）
  run-pipeline.ts --category transport   # 交通カテゴリの全国データ一括
  run-pipeline.ts --list                 # データセット一覧
`);
}

function printList() {
  // D1 gis_datasets を真実源とする。registry.ts 単独表示が必要な場合は別途
  // --list-registry オプションを追加する想定 (Phase 2 以降)。
  const projectRoot = findProjectRoot();
  const dbPath = path.join(projectRoot, LOCAL_D1_PATH);
  if (!fs.existsSync(dbPath)) {
    console.error(`ローカル D1 SQLite が見つかりません: ${dbPath}`);
    process.exit(1);
  }

  interface Row {
    data_id: string;
    name: string;
    geometry_type: string;
    coverage: string;
    license: string;
    status: string;
    r2_version: string | null;
  }

  const db = new Database(dbPath, { readonly: true });
  const rows = db
    .prepare(
      `SELECT data_id, name, geometry_type, coverage, license, status, r2_version
       FROM gis_datasets
       ORDER BY status, category, data_id`,
    )
    .all() as Row[];
  db.close();

  const statusCounts: Record<string, number> = {
    available: 0,
    registered: 0,
    imported: 0,
    deprecated: 0,
  };
  for (const r of rows) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;

  console.log("\nKSJ データセット一覧 (D1: gis_datasets):\n");
  console.log(
    `  状態: available ${statusCounts.available} / registered ${statusCounts.registered} / imported ${statusCounts.imported} / deprecated ${statusCounts.deprecated} (計 ${rows.length})\n`,
  );
  console.log(
    "  " +
      "状態".padEnd(10) +
      "ID".padEnd(12) +
      "名前".padEnd(16) +
      "型".padEnd(10) +
      "範囲".padEnd(14) +
      "Ver".padEnd(12) +
      "ライセンス",
  );
  console.log("  " + "-".repeat(90));
  for (const r of rows) {
    console.log(
      `  ${r.status.padEnd(10)} ${r.data_id.padEnd(12)} ${r.name.padEnd(14)} ${r.geometry_type.padEnd(10)} ${r.coverage.padEnd(14)} ${(r.r2_version ?? "—").padEnd(12)} ${r.license}`,
    );
  }
  console.log("");
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

function printResult(result: KsjPipelineResult) {
  console.log("=== 結果 ===");
  console.log(`  データID: ${result.dataId}`);
  console.log(`  バージョン: ${result.version}`);
  console.log(`  出力ファイル数: ${result.outputFiles.length}`);
  for (const f of result.outputFiles) {
    console.log(
      `    ${f.path} (${(f.sizeBytes / 1024 / 1024).toFixed(2)}MB, ${f.featureCount} features)`
    );
  }
  console.log(`  所要時間: ${(result.totalDurationMs / 1000).toFixed(1)}秒`);
}

async function runCategory(category: string) {
  const datasets = fetchDatasetsByCategory(category);
  if (datasets.length === 0) {
    console.error(`カテゴリ "${category}" の登録済みデータセットがありません。`);
    process.exit(1);
  }

  // 全国データセットのみ自動実行（県別は --pref 指定が必要なため）
  const nationalDatasets = datasets.filter((d) => d.coverage === "national");
  console.log(
    `\nカテゴリ "${category}": ${datasets.length} データセット (うち全国: ${nationalDatasets.length})\n`,
  );

  const results: KsjPipelineResult[] = [];
  const errors: Array<{ dataId: string; error: string }> = [];

  for (const def of nationalDatasets) {
    try {
      const result = await runKsjPipeline({ dataId: def.data_id });
      results.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [SKIP] ${def.data_id} (${def.name}): ${msg}\n`);
      errors.push({ dataId: def.data_id, error: msg });
    }
  }

  console.log("\n=== カテゴリ一括結果 ===");
  console.log(`  成功: ${results.length}/${nationalDatasets.length}`);
  if (errors.length > 0) {
    console.log(`  失敗: ${errors.length}`);
    for (const e of errors) {
      console.log(`    ${e.dataId}: ${e.error}`);
    }
  }
  const totalFiles = results.reduce(
    (sum, r) => sum + r.outputFiles.length,
    0
  );
  const totalSize = results.reduce(
    (sum, r) =>
      sum + r.outputFiles.reduce((s, f) => s + f.sizeBytes, 0),
    0
  );
  console.log(`  合計ファイル: ${totalFiles}`);
  console.log(`  合計サイズ: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
}

async function runAllPrefs(dataId: string, skipDownload: boolean) {
  const def = fetchDatasetMeta(dataId);
  if (!def) {
    console.error(
      `D1 gis_datasets に ${dataId} がありません。seed-from-registry.ts を実行してください。`,
    );
    process.exit(1);
  }
  if (def.coverage !== "prefecture" && def.coverage !== "mesh") {
    console.error(
      `${dataId} は全国データセットです。--all-prefs は県別・メッシュデータのみ対応。`,
    );
    process.exit(1);
  }

  console.log(`\n全47都道府県取得: ${dataId} (${def.name})\n`);

  const results: KsjPipelineResult[] = [];
  const errors: Array<{ prefCode: string; error: string }> = [];

  for (let i = 1; i <= 47; i++) {
    const prefCode = String(i).padStart(2, "0");
    try {
      const result = await runKsjPipeline({
        dataId,
        prefCode,
        skipDownload,
      });
      results.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [SKIP] ${prefCode}: ${msg}\n`);
      errors.push({ prefCode, error: msg });
    }
  }

  console.log("\n=== 全県取得結果 ===");
  console.log(`  成功: ${results.length}/47`);
  if (errors.length > 0) {
    console.log(`  失敗: ${errors.length}`);
    for (const e of errors) {
      console.log(`    ${e.prefCode}: ${e.error}`);
    }
  }
  const totalSize = results.reduce(
    (sum, r) =>
      sum + r.outputFiles.reduce((s, f) => s + f.sizeBytes, 0),
    0
  );
  console.log(`  合計サイズ: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("--help")) {
    printHelp();
    return;
  }

  if (args.includes("--list")) {
    printList();
    return;
  }

  const catIdx = args.indexOf("--category");
  if (catIdx >= 0) {
    await runCategory(args[catIdx + 1]);
    return;
  }

  const dataId = args[0];
  const prefIdx = args.indexOf("--pref");
  const prefCode = prefIdx >= 0 ? args[prefIdx + 1] : undefined;
  const versionIdx = args.indexOf("--version");
  const version = versionIdx >= 0 ? args[versionIdx + 1] : undefined;
  const skipDownload = args.includes("--skip-download");
  const allPrefs = args.includes("--all-prefs");

  if (allPrefs) {
    await runAllPrefs(dataId, skipDownload);
    return;
  }

  const def = fetchDatasetMeta(dataId);
  if (!def) {
    console.error(
      `D1 gis_datasets に ${dataId} がありません。seed-from-registry.ts を実行してください。`,
    );
    process.exit(1);
  }
  if (def.coverage === "prefecture" && !prefCode) {
    console.error(
      `エラー: ${dataId} (${def.name}) は県別データセットです。--pref <code> または --all-prefs を指定してください。`,
    );
    process.exit(1);
  }

  const result = await runKsjPipeline({
    dataId,
    version,
    prefCode,
    skipDownload,
  });

  printResult(result);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
