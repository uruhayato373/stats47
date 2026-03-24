/**
 * MLIT KSJ zip ダウンロード・GeoJSON 抽出
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import unzipper from "unzipper";

import * as shapefile from "shapefile";
import iconv from "iconv-lite";

import type { KsjDatasetDef } from "./types";

/**
 * ダウンロード URL を構築
 */
export function buildDownloadUrl(
  def: KsjDatasetDef,
  version: string,
  prefCode?: string
): string {
  let url = def.downloadUrlPattern.replace(/\{VERSION\}/g, version);
  if (prefCode) {
    url = url.replace(/\{PREF\}/g, prefCode);
  }
  return url;
}

/**
 * zip をダウンロードして /tmp/ に保存
 */
export async function downloadZip(
  url: string,
  dataId: string,
  version: string
): Promise<string> {
  const zipPath = `/tmp/mlit-ksj-${dataId}-${version}.zip`;

  if (fs.existsSync(zipPath)) {
    const stat = fs.statSync(zipPath);
    if (stat.size > 0) {
      console.log(`  既存 zip を再利用: ${zipPath} (${formatBytes(stat.size)})`);
      return zipPath;
    }
  }

  console.log(`  ダウンロード中: ${url}`);
  const response = await fetch(url, {
    headers: {
      "User-Agent": "stats47-gis-pipeline/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Download failed: ${response.status} ${response.statusText} for ${url}`
    );
  }

  const body = response.body;
  if (!body) {
    throw new Error("Response body is null");
  }

  const writeStream = fs.createWriteStream(zipPath);
  await pipeline(Readable.fromWeb(body as never), writeStream);

  const stat = fs.statSync(zipPath);
  console.log(`  保存完了: ${zipPath} (${formatBytes(stat.size)})`);

  return zipPath;
}

/**
 * zip から GeoJSON ファイルを抽出
 *
 * UTF-8/ ディレクトリ内の .geojson ファイルを優先。
 * なければ直下の .geojson を探す。
 */
export async function extractGeoJson(
  zipPath: string,
  geojsonDirInZip: string
): Promise<string[]> {
  const extractDir = zipPath.replace(/\.zip$/, "");
  if (!fs.existsSync(extractDir)) {
    fs.mkdirSync(extractDir, { recursive: true });
  }

  const geojsonFiles: string[] = [];

  const directory = await unzipper.Open.file(zipPath);

  for (const entry of directory.files) {
    const entryPath = entry.path;

    // .geojson ファイルのみ対象
    if (!entryPath.endsWith(".geojson")) continue;

    // UTF-8 ディレクトリ内を優先
    const isInTargetDir =
      geojsonDirInZip === "" || entryPath.includes(geojsonDirInZip);
    // Shift-JIS ディレクトリは除外
    const isShiftJis =
      entryPath.includes("Shift-JIS/") || entryPath.includes("ShiftJIS/");

    if (!isInTargetDir && geojsonDirInZip !== "") continue;
    if (isShiftJis) continue;

    const outputPath = path.join(extractDir, path.basename(entryPath));
    const content = await entry.buffer();
    fs.writeFileSync(outputPath, content);
    geojsonFiles.push(outputPath);
    console.log(
      `  抽出: ${path.basename(entryPath)} (${formatBytes(content.length)})`
    );
  }

  if (geojsonFiles.length === 0) {
    // GeoJSON がない場合 → Shapefile からの変換を試みる
    console.log(`  GeoJSON 未検出。Shapefile からの変換を試みます...`);
    const shpFiles = await extractAndConvertShapefile(zipPath, extractDir);
    if (shpFiles.length === 0) {
      throw new Error(
        `GeoJSON/Shapefile not found in zip: ${zipPath}`
      );
    }
    return shpFiles;
  }

  return geojsonFiles;
}

/**
 * 一時ファイルをクリーンアップ
 */
export function cleanupTempFiles(zipPath: string): void {
  const extractDir = zipPath.replace(/\.zip$/, "");
  if (fs.existsSync(extractDir)) {
    fs.rmSync(extractDir, { recursive: true, force: true });
  }
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
}

/**
 * zip から Shapefile を抽出し、Node.js の shapefile ライブラリで GeoJSON に変換
 */
async function extractAndConvertShapefile(
  zipPath: string,
  extractDir: string
): Promise<string[]> {
  const directory = await unzipper.Open.file(zipPath);

  // .shp / .dbf / .prj を全て抽出
  const shpEntries = new Map<string, Map<string, unzipper.File>>();
  for (const entry of directory.files) {
    const ext = path.extname(entry.path).toLowerCase();
    if ([".shp", ".dbf", ".shx", ".prj", ".cpg"].includes(ext)) {
      const base = path.basename(entry.path, ext);
      if (!shpEntries.has(base)) shpEntries.set(base, new Map());
      shpEntries.get(base)!.set(ext, entry);
    }
  }

  const geojsonFiles: string[] = [];

  for (const [baseName, files] of shpEntries) {
    const shpEntry = files.get(".shp");
    const dbfEntry = files.get(".dbf");
    if (!shpEntry || !dbfEntry) continue;

    // ファイルを /tmp に書き出す
    const shpPath = path.join(extractDir, `${baseName}.shp`);
    const dbfPath = path.join(extractDir, `${baseName}.dbf`);
    fs.writeFileSync(shpPath, await shpEntry.buffer());
    fs.writeFileSync(dbfPath, await dbfEntry.buffer());

    // .prj があれば書き出す
    const prjEntry = files.get(".prj");
    if (prjEntry) {
      fs.writeFileSync(
        path.join(extractDir, `${baseName}.prj`),
        await prjEntry.buffer()
      );
    }

    // .cpg で文字エンコーディングを確認
    let encoding = "UTF-8";
    const cpgEntry = files.get(".cpg");
    if (cpgEntry) {
      const cpgContent = (await cpgEntry.buffer()).toString().trim();
      if (cpgContent.toLowerCase().includes("shift") || cpgContent === "932") {
        encoding = "Shift_JIS";
      }
    }

    // shapefile ライブラリで GeoJSON に変換
    console.log(
      `  Shapefile→GeoJSON: ${baseName} (encoding: ${encoding})`
    );
    const features: Array<{
      type: "Feature";
      geometry: unknown;
      properties: Record<string, unknown> | null;
    }> = [];

    const dbfBuffer = fs.readFileSync(dbfPath);
    const shpBuffer = fs.readFileSync(shpPath);

    const source = await shapefile.open(
      shpBuffer,
      encoding === "Shift_JIS" ? undefined : dbfBuffer,
      { encoding: encoding === "Shift_JIS" ? undefined : "utf-8" }
    );

    let result = await source.read();
    while (!result.done) {
      features.push(result.value as never);
      result = await source.read();
    }

    // Shift_JIS の場合は dbf を iconv でデコード
    if (encoding === "Shift_JIS") {
      const source2 = await shapefile.open(shpBuffer, dbfBuffer);
      const features2: typeof features = [];
      let r2 = await source2.read();
      while (!r2.done) {
        features2.push(r2.value as never);
        r2 = await source2.read();
      }
      features.length = 0;
      features.push(...features2);
    }

    const geojson = {
      type: "FeatureCollection" as const,
      features,
    };

    const outputPath = path.join(extractDir, `${baseName}.geojson`);
    fs.writeFileSync(outputPath, JSON.stringify(geojson), "utf-8");
    geojsonFiles.push(outputPath);

    const stat = fs.statSync(outputPath);
    console.log(
      `  変換完了: ${baseName}.geojson (${formatBytes(stat.size)}, ${features.length} features)`
    );
  }

  return geojsonFiles;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
