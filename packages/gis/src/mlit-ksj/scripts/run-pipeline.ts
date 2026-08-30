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
import { GIS_DATASETS, GIS_DATASETS_BY_ID } from "../datasets";
import { discoverMeshCodes } from "../mesh-discovery";
import type { KsjPipelineResult } from "../types";

interface DatasetMeta {
  dataId: string;
  name: string;
  category: string;
  coverage: string;
}

/** git TS SSOTからカテゴリ別データセットを取得 */
function fetchDatasetsByCategory(category: string): DatasetMeta[] {
  return GIS_DATASETS
    .filter((item) => item.category === category)
    .map(({ dataId, name, category: itemCategory, coverage }) => ({
      dataId,
      name,
      category: itemCategory,
      coverage,
    }));
}

/** git TS SSOTから指定dataIdのメタを取得 */
function fetchDatasetMeta(dataId: string): DatasetMeta | null {
  const item = GIS_DATASETS_BY_ID.get(dataId);
  return item
    ? { dataId: item.dataId, name: item.name, category: item.category, coverage: item.coverage }
    : null;
}

function printHelp() {
  console.log(`
KSJ データパイプライン

使い方:
  run-pipeline.ts <DATA_ID> [options]

オプション:
  --pref <code>       都道府県コード（県別データの場合）
  --all-prefs         県別データの全47都道府県を一括取得
  --mesh <code>       1次メッシュコード（メッシュ配布データの場合）
  --all-meshes        公式ページ掲載の全1次メッシュを一括取得
  --version <v>       バージョン指定（デフォルト: latestVersion）
  --skip-download     既存 zip を再利用
  --category <cat>    カテゴリ内の全国データセットを一括取得
  --list              登録済みデータセット一覧

例:
  run-pipeline.ts N02                    # 鉄道（全国）
  run-pipeline.ts P04 --pref 13          # 医療機関（東京）
  run-pipeline.ts P04 --all-prefs        # 医療機関（全47都道府県）
  run-pipeline.ts G04-a --all-meshes     # 標高・傾斜度（全1次メッシュ）
  run-pipeline.ts --category transport   # 交通カテゴリの全国データ一括
  run-pipeline.ts --list                 # データセット一覧
`);
}

function printList() {
  const rows = [...GIS_DATASETS].sort((a, b) => a.dataId.localeCompare(b.dataId));
  console.log("\nKSJ データセット一覧 (git TS: datasets.ts):\n");
  console.log(
    "  " +
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
      `  ${r.dataId.padEnd(12)} ${r.name.padEnd(14)} ${r.geometryType.padEnd(10)} ${r.coverage.padEnd(14)} ${(r.latestVersion ?? "—").padEnd(12)} ${r.license}`,
    );
  }
  console.log("");
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

async function runAllPrefs(dataId: string, version: string | undefined, skipDownload: boolean) {
  const def = fetchDatasetMeta(dataId);
  if (!def) {
    console.error(
      `datasets.ts に ${dataId} がありません。`,
    );
    process.exit(1);
  }
  if (def.coverage !== "prefecture") {
    console.error(
      `${dataId} は県別配布データではありません。メッシュ配布は --all-meshes を指定してください。`,
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
        version,
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

async function runAllMeshes(dataId: string, versionArg: string | undefined, skipDownload: boolean) {
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  if (!meta || meta.coverage !== "mesh" || !meta.latestVersion) {
    throw new Error(`${dataId} は登録済みメッシュ配布データではありません。`);
  }
  const version = versionArg ?? meta.latestVersion;
  if (!meta.sourcePageUrl) {
    throw new Error(`${dataId} に sourcePageUrl がありません。`);
  }
  const meshCodes = await discoverMeshCodes({
    dataId,
    version,
    sourcePageUrl: meta.sourcePageUrl,
  });
  console.log(`\n全1次メッシュ取得: ${dataId} (${meta.name}) ${meshCodes.length}区画\n`);
  const results: KsjPipelineResult[] = [];
  const errors: Array<{ meshCode: string; error: string }> = [];
  for (const meshCode of meshCodes) {
    try {
      results.push(await runKsjPipeline({ dataId, version, meshCode, skipDownload }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  [FAIL] ${meshCode}: ${message}\n`);
      errors.push({ meshCode, error: message });
    }
  }
  const totalSize = results.reduce(
    (sum, result) => sum + result.outputFiles.reduce((fileSum, file) => fileSum + file.sizeBytes, 0),
    0,
  );
  console.log(`\n=== 全1次メッシュ取得結果 ===`);
  console.log(`  成功: ${results.length}/${meshCodes.length}`);
  console.log(`  合計サイズ: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
  if (errors.length > 0) {
    throw new Error(`${dataId}: ${errors.length}区画の取得に失敗しました。`);
  }
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
  const meshIdx = args.indexOf("--mesh");
  const meshCode = meshIdx >= 0 ? args[meshIdx + 1] : undefined;
  const versionIdx = args.indexOf("--version");
  const version = versionIdx >= 0 ? args[versionIdx + 1] : undefined;
  const skipDownload = args.includes("--skip-download");
  const allPrefs = args.includes("--all-prefs");
  const allMeshes = args.includes("--all-meshes");

  if (allPrefs) {
    await runAllPrefs(dataId, version, skipDownload);
    return;
  }
  if (allMeshes) {
    await runAllMeshes(dataId, version, skipDownload);
    return;
  }

  const def = fetchDatasetMeta(dataId);
  if (!def) {
    console.error(
      `datasets.ts に ${dataId} がありません。`,
    );
    process.exit(1);
  }
  if (def.coverage === "prefecture" && !prefCode) {
    console.error(
      `エラー: ${dataId} (${def.name}) は県別データセットです。--pref <code> または --all-prefs を指定してください。`,
    );
    process.exit(1);
  }
  if (def.coverage === "mesh" && !meshCode) {
    console.error(
      `エラー: ${dataId} (${def.name}) は1次メッシュ配布です。--mesh <code> または --all-meshes を指定してください。`,
    );
    process.exit(1);
  }

  const result = await runKsjPipeline({
    dataId,
    version,
    prefCode,
    meshCode,
    skipDownload,
  });

  printResult(result);
}

main().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
