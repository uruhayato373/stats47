#!/usr/bin/env tsx
/**
 * mesh1000r6（1kmメッシュ将来推計人口R6）カスタム抽出スクリプト
 *
 * 全国一括 zip が二重構造なので通常パイプラインが使えない:
 *   outer.zip
 *     └── 1km_mesh_2024_GEOJSON/
 *           ├── 1km_mesh_2024_01_GEOJSON.zip
 *           │     └── 1km_mesh_2024_01_GEOJSON/1km_mesh_2024_01.geojson
 *           ├── 1km_mesh_2024_02_GEOJSON.zip
 *           ...
 *
 * 使い方:
 *   npx tsx packages/gis/src/mlit-ksj/scripts/extract-mesh1000r6.ts
 *   npx tsx packages/gis/src/mlit-ksj/scripts/extract-mesh1000r6.ts --pref 13
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import unzipper from "unzipper";
import { convertGeoJsonToTopoJson, saveTopoJson } from "../converter";
import { buildMlitKsjLocalPath } from "../r2-path";

const DATA_ID = "mesh1000r6";
const VERSION = "24";
const OUTER_ZIP = `/tmp/mlit-ksj-${DATA_ID}-${VERSION}.zip`;
const SIMPLIFY_MESH = { quantize: 1e4, simplifyQuantile: 0.02 };

function findProjectRoot(): string {
  let dir = __dirname;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "package.json"))) {
      const pkg = JSON.parse(
        fs.readFileSync(path.join(dir, "package.json"), "utf-8")
      );
      if (pkg.workspaces || pkg.name === "stats47") return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error("Could not find project root");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

async function extractPrefecture(
  outerDir: unzipper.CentralDirectory,
  prefCode: string,
  projectRoot: string
): Promise<{ sizeBytes: number; featureCount: number }> {
  const innerZipName = `1km_mesh_2024_GEOJSON/1km_mesh_2024_${prefCode}_GEOJSON.zip`;
  const geojsonName = `1km_mesh_2024_${prefCode}_GEOJSON/1km_mesh_2024_${prefCode}.geojson`;

  // 外側 zip から内側 zip をバッファに読み込む
  const innerEntry = outerDir.files.find((f) => f.path === innerZipName);
  if (!innerEntry) {
    throw new Error(`Inner zip not found in outer zip: ${innerZipName}`);
  }

  console.log(
    `  [${prefCode}] 内側 zip 読み込み中: ${innerZipName}`
  );
  const innerZipBuffer = await innerEntry.buffer();
  console.log(`  [${prefCode}] 内側 zip サイズ: ${formatBytes(innerZipBuffer.length)}`);

  // 内側 zip を開く
  const innerDir = await unzipper.Open.buffer(innerZipBuffer);

  // GeoJSON エントリを探す
  const geojsonEntry = innerDir.files.find((f) => f.path === geojsonName);
  if (!geojsonEntry) {
    // フォールバック: .geojson 拡張子なら何でも
    const fallback = innerDir.files.find((f) => f.path.endsWith(".geojson"));
    if (!fallback) {
      const available = innerDir.files.map((f) => f.path).join(", ");
      throw new Error(
        `GeoJSON not found in inner zip. Available: ${available}`
      );
    }
    console.warn(`  [${prefCode}] フォールバック GeoJSON: ${fallback.path}`);
    return extractAndConvert(fallback, prefCode, projectRoot);
  }

  return extractAndConvert(geojsonEntry, prefCode, projectRoot);
}

async function extractAndConvert(
  geojsonEntry: unzipper.File,
  prefCode: string,
  projectRoot: string
): Promise<{ sizeBytes: number; featureCount: number }> {
  // GeoJSON をバッファに読み込みテンプファイルに書き出す
  console.log(
    `  [${prefCode}] GeoJSON 読み込み中: ${geojsonEntry.path}`
  );
  const geojsonBuffer = await geojsonEntry.buffer();
  console.log(`  [${prefCode}] GeoJSON サイズ: ${formatBytes(geojsonBuffer.length)}`);

  const tmpGeoJson = path.join(
    os.tmpdir(),
    `mesh1000r6_${prefCode}_${Date.now()}.geojson`
  );
  fs.writeFileSync(tmpGeoJson, geojsonBuffer);

  try {
    const { topology, featureCount } = convertGeoJsonToTopoJson(
      tmpGeoJson,
      DATA_ID,
      SIMPLIFY_MESH
    );

    const outputPath = buildMlitKsjLocalPath(projectRoot, {
      dataId: DATA_ID,
      version: VERSION,
      prefCode,
    });

    const sizeBytes = saveTopoJson(topology, outputPath);
    console.log(`  [${prefCode}] 完了: ${featureCount} features`);

    return { sizeBytes, featureCount };
  } finally {
    fs.unlinkSync(tmpGeoJson);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const prefIdx = args.indexOf("--pref");
  const singlePref = prefIdx >= 0 ? args[prefIdx + 1] : undefined;

  if (!fs.existsSync(OUTER_ZIP)) {
    console.error(`外側 zip が見つかりません: ${OUTER_ZIP}`);
    console.error(
      `先に以下を実行してください:\n  npx tsx packages/gis/src/mlit-ksj/scripts/run-pipeline.ts mesh1000r6 --skip-download`
    );
    console.error(
      `または手動ダウンロード:\n  curl -L -o ${OUTER_ZIP} https://nlftp.mlit.go.jp/ksj/gml/data/m1kr6/m1kr6-24/1km_mesh_2024_GEOJSON.zip`
    );
    process.exit(1);
  }

  const projectRoot = findProjectRoot();
  console.log(`\n=== mesh1000r6 カスタム抽出 ===`);
  console.log(`  外側 zip: ${OUTER_ZIP}`);
  console.log(`  出力先: ${projectRoot}/.local/r2/gis/mlit-ksj/${DATA_ID}/${VERSION}/`);

  console.log(`\n  外側 zip を開いています...`);
  const outerDir = await unzipper.Open.file(OUTER_ZIP);
  console.log(`  エントリ数: ${outerDir.files.length}`);

  const prefs = singlePref
    ? [singlePref.padStart(2, "0")]
    : Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, "0"));

  const results: Array<{
    prefCode: string;
    sizeBytes: number;
    featureCount: number;
  }> = [];
  const errors: Array<{ prefCode: string; error: string }> = [];

  for (const prefCode of prefs) {
    try {
      const { sizeBytes, featureCount } = await extractPrefecture(
        outerDir,
        prefCode,
        projectRoot
      );
      results.push({ prefCode, sizeBytes, featureCount });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [${prefCode}] エラー: ${msg}`);
      errors.push({ prefCode, error: msg });
    }
  }

  // _meta.json を保存
  if (results.length > 0) {
    const metaDir = path.dirname(
      buildMlitKsjLocalPath(projectRoot, {
        dataId: DATA_ID,
        version: VERSION,
        prefCode: "01",
      })
    );
    const meta = {
      dataId: DATA_ID,
      name: "1kmメッシュ将来推計人口(R6)",
      nameEn: "Future Population 1km Mesh (R6)",
      version: VERSION,
      license: "cc-by-4.0",
      geometryType: "mesh",
      source: `https://nlftp.mlit.go.jp/ksj/gml/data/m1kr6/m1kr6-24/`,
      files: results.map((r) => ({
        filename: `${r.prefCode}.topojson`,
        sizeBytes: r.sizeBytes,
        featureCount: r.featureCount,
      })),
      convertedAt: new Date().toISOString(),
      attribution: "国土交通省国土数値情報ダウンロードサイト",
    };
    fs.writeFileSync(
      path.join(metaDir, "_meta.json"),
      JSON.stringify(meta, null, 2),
      "utf-8"
    );
    console.log(`\n  メタデータ保存: ${path.join(metaDir, "_meta.json")}`);
  }

  console.log(`\n=== 完了 ===`);
  console.log(`  成功: ${results.length}/${prefs.length}`);
  if (errors.length > 0) {
    console.log(`  失敗: ${errors.length}`);
    for (const e of errors) {
      console.log(`    ${e.prefCode}: ${e.error}`);
    }
  }
  const totalSize = results.reduce((s, r) => s + r.sizeBytes, 0);
  console.log(`  合計サイズ: ${formatBytes(totalSize)}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
