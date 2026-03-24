#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";
import type { Prefecture } from "../data/prefectures";
import { PREFECTURES } from "../data/prefectures";

interface GESProject {
  [key: string]: unknown;
}

const APP_ROOT = path.join(__dirname, "..");
const PROJECT_ROOT = path.join(APP_ROOT, "..", "..");
const TEMPLATES_DIR = path.join(APP_ROOT, "templates");
const OUTPUT_BASE_DIR = path.join(PROJECT_ROOT, ".local", "r2", "ges");

const TEMPLATE_LAT = 34.691269;  // 兵庫県 (prefectures.ts と一致)
const TEMPLATE_LNG = 135.183025; // 兵庫県 (prefectures.ts と一致)

function toRelativeLng(lng: number): number {
  return (lng + 180) / 360;
}

function toRelativeLat(lat: number): number {
  return (lat + 90) / 180;
}

/**
 * プロジェクト全体のオブジェクトツリーを再帰的に走査し、緯度・経度の値を更新する。
 */
function updateCoordinates(
  obj: any,
  diffLng: number,
  diffLat: number
): void {
  if (!obj || typeof obj !== "object") return;

  if (Array.isArray(obj)) {
    obj.forEach((item) => updateCoordinates(item, diffLng, diffLat));
    return;
  }

  // このオブジェクト自体が座標の定義（longitude, latitude 等）かチェック
  if (obj.type === "longitude" || obj.type === "longitudePOI") {
    if (obj.value && typeof obj.value.relative === "number") {
      obj.value.relative += diffLng;
    }
    if (Array.isArray(obj.keyframes)) {
      obj.keyframes.forEach((kf: any) => {
        if (typeof kf.value === "number") kf.value += diffLng;
      });
    }
  } else if (obj.type === "latitude" || obj.type === "latitudePOI") {
    if (obj.value && typeof obj.value.relative === "number") {
      obj.value.relative += diffLat;
    }
    if (Array.isArray(obj.keyframes)) {
      obj.keyframes.forEach((kf: any) => {
        if (typeof kf.value === "number") kf.value += diffLat;
      });
    }
  }

  // 子要素を再帰的に走査
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      updateCoordinates(obj[key], diffLng, diffLat);
    }
  }
}

function parseArgs(): { limit?: number; aspect: "1080-1920" | "1920-1080" } {
  const limitIdx = process.argv.indexOf("--limit");
  const limit = (limitIdx !== -1 && process.argv[limitIdx + 1])
    ? parseInt(process.argv[limitIdx + 1], 10)
    : undefined;

  const aspectIdx = process.argv.indexOf("--aspect");
  const aspect = (aspectIdx !== -1 && process.argv[aspectIdx + 1] === "1920-1080")
    ? "1920-1080"
    : "1080-1920";

  return { limit: Number.isNaN(limit) ? undefined : limit, aspect };
}

async function generateProjects(): Promise<void> {
  const { limit, aspect } = parseArgs();
  const prefs: Prefecture[] = limit
    ? PREFECTURES.slice(0, limit)
    : PREFECTURES;

  const templatePath = path.join(TEMPLATES_DIR, `${aspect}.esp`);
  const outputDir = path.join(OUTPUT_BASE_DIR, aspect);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`テンプレートが見つかりません: ${templatePath}`);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const template: GESProject = JSON.parse(templateContent);

  const templateRelLng = toRelativeLng(TEMPLATE_LNG);
  const templateRelLat = toRelativeLat(TEMPLATE_LAT);

  console.log(`🚀 Google Earth Studio プロジェクトファイル生成開始 [${aspect.toUpperCase()}]`);
  console.log(`📂 出力先: ${outputDir}`);
  console.log(`📋 対象: ${prefs.length} 都道府県${limit ? ` (--limit ${limit})` : ""}\n`);

  for (const pref of prefs) {
    const project: GESProject = JSON.parse(JSON.stringify(template));

    const targetRelLng = toRelativeLng(pref.lng);
    const targetRelLat = toRelativeLat(pref.lat);
    const diffLng = targetRelLng - templateRelLng;
    const diffLat = targetRelLat - templateRelLat;

    updateCoordinates(project, diffLng, diffLat);

    const metadata = project.metadata as { name?: string } | undefined;
    if (metadata) metadata.name = `${pref.name}_${pref.capital}_旋回動画_${aspect}`;
    
    const settings = project.settings as { name?: string } | undefined;
    if (settings) settings.name = `${pref.name}_${pref.capital}_旋回動画_${aspect}`;

    // JIS 5桁コード命名 (例: 01000.esp)
    const jisCode = `${pref.code}000`;
    const filename = `${jisCode}.esp`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(project, null, 2), "utf8");

    console.log(`✅ [${pref.code}] ${pref.name} → ${filename}`);
  }

  console.log(`\n🎉 完了！ ${aspect} 用に ${prefs.length} 個のプロジェクトファイルを生成しました。`);
  console.log(`📁 出力ディレクトリ: ${path.resolve(outputDir)}`);
}

generateProjects().catch((error) => {
  console.error("❌ エラーが発生しました:", error);
  process.exit(1);
});
