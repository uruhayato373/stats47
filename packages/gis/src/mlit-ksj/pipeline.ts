/**
 * KSJ データパイプライン
 *
 * ダウンロード → 解凍 → 変換 → R2 保存を一括実行。
 *
 * Phase 2 of GIS dataset management refactor (plan: stateless-stargazing-teapot):
 * 純メタデータ (name / category / geometryType 等) は D1 gis_datasets から取得し、
 * コード固有設定 (downloadUrlPattern / propertyMap / simplifyOptions) は
 * registry.ts (KsjCodeConfig) から取得してマージする。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";

import type {
  KsjCodeConfig,
  KsjCoverage,
  KsjGeometryType,
  KsjPipelineOptions,
  KsjPipelineResult,
  KsjResolvedDataset,
  KsjSimplifyOptions,
} from "./types";
import { getCodeConfig } from "./registry";
import {
  buildDownloadUrl,
  downloadZip,
  extractGeoJson,
  cleanupTempFiles,
} from "./downloader";
import { convertGeoJsonToTopoJson, saveTopoJson } from "./converter";
import { buildMlitKsjLocalPath, buildMlitKsjR2Path } from "./r2-path";

// CLAUDE.md で固定されたローカル D1 パス。better-sqlite3 で他の path を開くと
// 空ファイルが自動生成されるため絶対に変えない。register-ksj-rankings.ts と同じ値。
const LOCAL_D1_PATH =
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";

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

interface GisDatasetRow {
  data_id: string;
  name: string;
  name_en: string;
  category: string;
  geometry_type: string;
  coverage: string;
  license: string;
  latest_version: string | null;
  status: string;
  attribution: string | null;
}

/**
 * D1 と registry を結合して実行時データセット定義を構築する。
 */
function resolveDataset(
  dataId: string,
  projectRoot: string,
): KsjResolvedDataset {
  const dbPath = path.join(projectRoot, LOCAL_D1_PATH);
  if (!fs.existsSync(dbPath)) {
    throw new Error(
      `ローカル D1 SQLite が見つかりません: ${dbPath}\n` +
        "Phase 1 migration (0047) を適用してください。",
    );
  }

  const db = new Database(dbPath, { readonly: true });
  const row = db
    .prepare(
      `SELECT data_id, name, name_en, category, geometry_type, coverage, license,
              latest_version, status, attribution
       FROM gis_datasets WHERE data_id = ?`,
    )
    .get(dataId) as GisDatasetRow | undefined;
  db.close();

  if (!row) {
    throw new Error(
      `D1 gis_datasets に data_id='${dataId}' がありません。` +
        " seed-from-registry.ts を実行するか、新規データセットの場合は registry.ts に追加してください。",
    );
  }

  if (row.status === "available") {
    throw new Error(
      `data_id='${dataId}' は status='available' (KSJ カタログにあるが stats47 未登録)。\n` +
        " registry.ts に KsjCodeConfig を追加し、" +
        ` 'UPDATE gis_datasets SET status=\\'registered\\' WHERE data_id=\\'${dataId}\\'' を実行してください。`,
    );
  }
  if (row.status === "deprecated") {
    throw new Error(
      `data_id='${dataId}' は status='deprecated' (利用停止)。再有効化する場合は status を変更してください。`,
    );
  }
  if (!row.latest_version) {
    throw new Error(
      `D1 gis_datasets.latest_version が空: ${dataId}。seed-from-registry.ts を実行してください。`,
    );
  }

  const code = getCodeConfig(dataId);
  if (!code) {
    throw new Error(
      `registry.ts に code config がありません: ${dataId}。downloadUrlPattern 等を追加してください。`,
    );
  }

  return {
    dataId: row.data_id,
    name: row.name,
    nameEn: row.name_en,
    category: row.category as KsjResolvedDataset["category"],
    geometryType: row.geometry_type as KsjGeometryType,
    coverage: row.coverage as KsjCoverage,
    license: row.license,
    latestVersion: row.latest_version,
    downloadUrlPattern: code.downloadUrlPattern,
    geojsonDirInZip: code.geojsonDirInZip,
    propertyMap: code.propertyMap,
    simplifyOptions: code.simplifyOptions ?? defaultSimplifyOptions(row.geometry_type as KsjGeometryType),
    attribution: row.attribution ?? ATTRIBUTION,
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
  const def = resolveDataset(options.dataId, projectRoot);
  const version = options.version ?? def.latestVersion;

  console.log(`\n=== KSJ Pipeline: ${def.dataId} (${def.name}) ===`);
  console.log(`  バージョン: ${version}`);
  console.log(`  ジオメトリ: ${def.geometryType}`);
  console.log(`  カバー範囲: ${def.coverage}`);

  // 1. ダウンロード
  const url = buildDownloadUrl(def, version, options.prefCode);
  let zipPath: string;
  if (options.skipDownload) {
    zipPath = `/tmp/mlit-ksj-${def.dataId}-${version}.zip`;
    if (!fs.existsSync(zipPath)) {
      throw new Error(`skipDownload specified but zip not found: ${zipPath}`);
    }
    console.log(`  スキップ: ダウンロード（既存 zip 使用）`);
  } else {
    zipPath = await downloadZip(url, def.dataId, version);
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
      ? path.join(options.outputDir, outputFilename ?? "national.topojson")
      : buildMlitKsjLocalPath(projectRoot, {
          dataId: def.dataId,
          version,
          prefCode: options.prefCode,
          filename: outputFilename,
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
  const metaPath = path.join(metaDir, "_meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
  console.log(`  メタデータ: ${metaPath}`);

  // 5. D1 gis_datasets を UPDATE (status='imported' + 統計値)
  updateGisDatasetState({
    projectRoot,
    dataId: def.dataId,
    version,
    convertedAt: meta.convertedAt,
    fileCount: outputFiles.length,
    totalSizeBytes: outputFiles.reduce((sum, f) => sum + f.sizeBytes, 0),
    prefCode: options.prefCode,
  });

  // 6. クリーンアップ
  cleanupTempFiles(zipPath);
  console.log(`  クリーンアップ完了`);

  const totalDurationMs = Date.now() - startTime;
  console.log(`  完了: ${(totalDurationMs / 1000).toFixed(1)}秒\n`);

  return {
    dataId: def.dataId,
    version,
    outputFiles,
    totalDurationMs,
  };
}

function updateGisDatasetState(input: {
  projectRoot: string;
  dataId: string;
  version: string;
  convertedAt: string;
  fileCount: number;
  totalSizeBytes: number;
  prefCode?: string;
}): void {
  const dbPath = path.join(input.projectRoot, LOCAL_D1_PATH);
  if (!fs.existsSync(dbPath)) {
    console.warn(`  ⚠ D1 not found, skipping gis_datasets UPDATE: ${dbPath}`);
    return;
  }

  const sampleR2Path = buildMlitKsjR2Path({
    dataId: input.dataId,
    version: input.version,
    prefCode: input.prefCode,
    filename: "_marker",
  });
  const r2Prefix = sampleR2Path.slice(0, sampleR2Path.lastIndexOf("/") + 1);

  try {
    const db = new Database(dbPath);
    const stmt = db.prepare(`
      UPDATE gis_datasets
      SET status = 'imported',
          last_imported_at = unixepoch(),
          r2_version = ?,
          file_count = ?,
          total_size_bytes = ?,
          converted_at = ?,
          r2_prefix = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE data_id = ?
    `);
    const result = stmt.run(
      input.version,
      input.fileCount,
      input.totalSizeBytes,
      input.convertedAt,
      r2Prefix,
      input.dataId,
    );
    db.close();
    if (result.changes === 0) {
      console.warn(
        `  ⚠ gis_datasets に data_id='${input.dataId}' が存在しない (UPDATE 0 件)`,
      );
    } else {
      console.log(
        `  ✓ D1 gis_datasets UPDATE: ${input.dataId} status=imported, files=${input.fileCount}, ${formatBytes(input.totalSizeBytes)}`,
      );
    }
  } catch (err) {
    console.error(
      `  ⚠ D1 UPDATE 失敗 (pipeline は成功扱いで継続): ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}
