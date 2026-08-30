/**
 * KSJ データパイプライン
 *
 * ダウンロード → 解凍 → 変換 → R2 保存を一括実行。
 *
 * 純メタデータ (name / category / geometryType 等) は git TS datasets.ts から取得し、
 * コード固有設定 (downloadUrlPattern / propertyMap / simplifyOptions) は
 * registry.ts (KsjCodeConfig) から取得してマージする。
 *
 * 完全DBレス: メタの SSOT は git TS `datasets.ts`。pipeline は SQLite を必要としない。
 */

import * as fs from "node:fs";
import * as path from "node:path";

import type {
  KsjGeometryType,
  KsjPipelineOptions,
  KsjPipelineResult,
  KsjResolvedDataset,
  KsjSimplifyOptions,
} from "./types";
import { getCodeConfig } from "./registry";
import { GIS_DATASETS_BY_ID } from "./datasets";
import {
  buildDownloadUrl,
  downloadZip,
  extractGeoJson,
  cleanupTempFiles,
} from "./downloader";
import { convertGeoJsonToTopoJson, saveTopoJson } from "./converter";
import { buildMlitKsjLocalPath } from "./r2-path";

const ATTRIBUTION = "国土交通省国土数値情報ダウンロードサイト";

/**
 * geometryType ごとのデフォルト simplify パラメータ。
 * registry.ts の SIMPLIFY_POINT/LINE/POLYGON/MESH と同値。
 * KsjCodeConfig.simplifyOptions が省略された場合のフォールバック。
 */
function defaultSimplifyOptions(
  geomType: KsjGeometryType,
): KsjSimplifyOptions {
  switch (geomType) {
    case "point":
      return { quantize: 1e6, simplifyQuantile: 0 };
    case "line":
    case "polygon":
    case "mixed":
      return { quantize: 1e5, simplifyQuantile: 0.01 };
    case "mesh":
      return { quantize: 1e4, simplifyQuantile: 0.02 };
  }
}

/**
 * git TS のメタSSOTと registry を結合して実行時データセット定義を構築する。
 */
function resolveDataset(
  dataId: string,
): KsjResolvedDataset {
  const meta = GIS_DATASETS_BY_ID.get(dataId);
  if (!meta) {
    throw new Error(
      `datasets.ts に data_id='${dataId}' がありません。` +
        " 新規データセットは datasets.ts (メタ) + registry.ts (技術設定) に登録してください。",
    );
  }
  if (!meta.latestVersion) {
    throw new Error(
      `datasets.ts latestVersion が空: ${dataId}。公式配布ページで版を確認してください。`,
    );
  }

  const code = getCodeConfig(dataId);
  if (!code) {
    throw new Error(
      `registry.ts に code config がありません: ${dataId}。downloadUrlPattern 等を追加してください。`,
    );
  }
  if (!code.downloadUrlPattern) {
    throw new Error(
      `${dataId} は公式manifest取得型です。acquire-public-ksj.ts を使用してください。`,
    );
  }

  return {
    dataId: meta.dataId,
    name: meta.name,
    nameEn: "",
    category: meta.category,
    geometryType: meta.geometryType,
    coverage: meta.coverage,
    license: meta.license,
    latestVersion: meta.latestVersion,
    downloadUrlPattern: code.downloadUrlPattern,
    geojsonDirInZip: code.geojsonDirInZip,
    propertyMap: code.propertyMap,
    simplifyOptions: code.simplifyOptions ?? defaultSimplifyOptions(meta.geometryType),
    attribution: ATTRIBUTION,
  };
}

function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf-8"),
      );
      if (pkg.workspaces || pkg.name === "stats47") {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find project root");
}

export async function runKsjPipeline(
  options: KsjPipelineOptions,
): Promise<KsjPipelineResult> {
  const startTime = Date.now();

  const projectRoot = findProjectRoot();
  const def = resolveDataset(options.dataId);
  const version = options.version ?? def.latestVersion;

  console.log(`\n=== KSJ Pipeline: ${def.dataId} (${def.name}) ===`);
  console.log(`  バージョン: ${version}`);
  console.log(`  ジオメトリ: ${def.geometryType}`);
  console.log(`  カバー範囲: ${def.coverage}`);
  if (options.prefCode) console.log(`  都道府県: ${options.prefCode}`);
  if (options.meshCode) console.log(`  1次メッシュ: ${options.meshCode}`);

  // 1. ダウンロード
  const url = buildDownloadUrl(def, version, options.prefCode, options.meshCode);
  const scope = options.meshCode ?? options.prefCode;
  let zipPath: string;
  if (options.skipDownload) {
    zipPath = `/tmp/mlit-ksj-${def.dataId}-${version}${scope ? `-${scope}` : ""}.zip`;
    if (!fs.existsSync(zipPath)) {
      throw new Error(`skipDownload specified but zip not found: ${zipPath}`);
    }
    console.log(`  スキップ: ダウンロード（既存 zip 使用）`);
  } else {
    zipPath = await downloadZip(url, def.dataId, version, scope);
  }

  // 2. GeoJSON 抽出
  const geojsonFiles = await extractGeoJson(zipPath, def.geojsonDirInZip);

  // 3. 変換 & 保存
  const outputFiles: KsjPipelineResult["outputFiles"] = [];

  for (const geojsonPath of geojsonFiles) {
    const { topology, featureCount } = convertGeoJsonToTopoJson(
      geojsonPath,
      def.dataId,
      def.simplifyOptions,
    );

    let outputFilename: string | undefined;
    if (geojsonFiles.length > 1) {
      const baseName = path.basename(geojsonPath, ".geojson");
      outputFilename = `${baseName}.topojson`;
    }

    const outputPath = options.outputDir
      ? path.join(
          options.outputDir,
          outputFilename ?? (scope ? `${scope}.topojson` : "national.topojson"),
        )
      : buildMlitKsjLocalPath(projectRoot, {
          dataId: def.dataId,
          version,
          prefCode: options.prefCode,
          filename: outputFilename ?? (options.meshCode ? `${options.meshCode}.topojson` : undefined),
        });

    const sizeBytes = saveTopoJson(topology, outputPath);
    outputFiles.push({ path: outputPath, sizeBytes, featureCount });
  }

  // 4. _meta.json 保存
  const metaDir = path.dirname(outputFiles[0].path);
  const meta = {
    dataId: def.dataId,
    name: def.name,
    nameEn: def.nameEn,
    version,
    prefCode: options.prefCode ?? null,
    meshCode: options.meshCode ?? null,
    license: def.license,
    geometryType: def.geometryType,
    source: url,
    files: outputFiles.map((f) => ({
      filename: path.basename(f.path),
      sizeBytes: f.sizeBytes,
      featureCount: f.featureCount,
    })),
    convertedAt: new Date().toISOString(),
    attribution: def.attribution,
  };
  const metaPath = scope
    ? path.join(metaDir, "_meta", `${scope}.json`)
    : path.join(metaDir, "_meta.json");
  fs.mkdirSync(path.dirname(metaPath), { recursive: true });
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
  console.log(`  メタデータ: ${metaPath}`);

  // 5. クリーンアップ
  cleanupTempFiles(zipPath);
  console.log(`  クリーンアップ完了`);

  const totalDurationMs = Date.now() - startTime;
  console.log(`  完了: ${(totalDurationMs / 1000).toFixed(1)}秒\n`);

  return {
    dataId: def.dataId,
    version,
    prefCode: options.prefCode,
    meshCode: options.meshCode,
    outputFiles,
    totalDurationMs,
  };
}
