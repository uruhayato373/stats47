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

import { runKsjPipeline } from "../pipeline";
import {
  listDatasets,
  listDatasetsByCategory,
  getDatasetDef,
} from "../registry";
import type { KsjPipelineResult } from "../types";

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
  console.log("\n登録済みデータセット:\n");
  console.log(
    "  " +
      "ID".padEnd(12) +
      "名前".padEnd(16) +
      "型".padEnd(10) +
      "範囲".padEnd(14) +
      "ライセンス"
  );
  console.log("  " + "-".repeat(70));
  for (const def of listDatasets()) {
    console.log(
      `  ${def.dataId.padEnd(12)} ${def.name.padEnd(14)} ${def.geometryType.padEnd(10)} ${def.coverage.padEnd(14)} ${def.license}`
    );
  }
  console.log(`\n  合計: ${listDatasets().length} データセット`);
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
  const datasets = listDatasetsByCategory(category);
  if (datasets.length === 0) {
    console.error(`カテゴリ "${category}" のデータセットがありません。`);
    process.exit(1);
  }

  // 全国データセットのみ自動実行（県別は --pref 指定が必要なため）
  const nationalDatasets = datasets.filter((d) => d.coverage === "national");
  console.log(
    `\nカテゴリ "${category}": ${datasets.length} データセット (うち全国: ${nationalDatasets.length})\n`
  );

  const results: KsjPipelineResult[] = [];
  const errors: Array<{ dataId: string; error: string }> = [];

  for (const def of nationalDatasets) {
    try {
      const result = await runKsjPipeline({ dataId: def.dataId });
      results.push(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [SKIP] ${def.dataId} (${def.name}): ${msg}\n`);
      errors.push({ dataId: def.dataId, error: msg });
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
  const def = getDatasetDef(dataId);
  if (def.coverage !== "prefecture") {
    console.error(
      `${dataId} は全国データセットです。--all-prefs は県別データのみ対応。`
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

  const def = getDatasetDef(dataId);
  if (def.coverage === "prefecture" && !prefCode) {
    console.error(
      `エラー: ${dataId} (${def.name}) は県別データセットです。--pref <code> または --all-prefs を指定してください。`
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
