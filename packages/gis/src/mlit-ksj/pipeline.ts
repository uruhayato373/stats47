/**
 * KSJ データパイプライン
 *
 * ダウンロード → 解凍 → 変換 → R2 保存を一括実行。
 */

import * as fs from "node:fs";
import * as path from "node:path";
import Database from "better-sqlite3";

import type { KsjPipelineOptions, KsjPipelineResult } from "./types";
import { getDatasetDef } from "./registry";
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

/**
 * プロジェクトルートを検出
 */
function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf-8")
      );
      if (pkg.workspaces || pkg.name === "stats47") {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find project root");
}

/**
 * KSJ データパイプラインを実行
 */
export async function runKsjPipeline(
  options: KsjPipelineOptions
): Promise<KsjPipelineResult> {
  const startTime = Date.now();

  const def = getDatasetDef(options.dataId);
  const version = options.version ?? def.latestVersion;
  const projectRoot = findProjectRoot();

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
      def.simplifyOptions
    );

    // 出力パス決定
    let outputFilename: string | undefined;
    if (geojsonFiles.length > 1) {
      // 複数ファイルの場合、元のファイル名からプレフィックスを取って使う
      const baseName = path.basename(geojsonPath, ".geojson");
      outputFilename = `${baseName}.topojson`;
    }

    const outputPath =
      options.outputDir
        ? path.join(
            options.outputDir,
            outputFilename ?? "national.topojson"
          )
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
    attribution: "国土交通省国土数値情報ダウンロードサイト",
  };
  const metaPath = path.join(metaDir, "_meta.json");
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
  console.log(`  メタデータ: ${metaPath}`);

  // 5. D1 gis_datasets を UPDATE (status='imported' + 統計値)
  //    失敗してもパイプライン本体は成功扱い (R2 と D1 の乖離は週次整合性チェックで検出)
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

/**
 * gis_datasets テーブルを pipeline 成功状態に更新する。
 * D1 接続失敗・SQL エラーはログのみで pipeline 本体には影響させない。
 */
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

  // r2_prefix は filename を含まないディレクトリ部分のみ。
  // buildMlitKsjR2Path から filename を除去するため、適当な filename を与えて dirname を取る。
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
          is_downloaded = 1,
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
