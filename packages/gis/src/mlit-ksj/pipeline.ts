/**
 * KSJ データパイプライン
 *
 * ダウンロード → 解凍 → 変換 → R2 保存を一括実行。
 */

import * as fs from "node:fs";
import * as path from "node:path";

import type { KsjPipelineOptions, KsjPipelineResult } from "./types";
import { getDatasetDef } from "./registry";
import {
  buildDownloadUrl,
  downloadZip,
  extractGeoJson,
  cleanupTempFiles,
} from "./downloader";
import { convertGeoJsonToTopoJson, saveTopoJson } from "./converter";
import { buildMlitKsjLocalPath } from "./r2-path";

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

  // 5. クリーンアップ
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
