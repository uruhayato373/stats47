#!/usr/bin/env tsx
/**
 * 港湾用 Google Earth Studio プロジェクトファイル生成スクリプト
 *
 * ports テーブルの緯度経度を使い、港湾ごとの旋回動画用 .esp ファイルを生成する。
 *
 * Usage:
 *   npx tsx scripts/generate-port-projects.ts
 *   npx tsx scripts/generate-port-projects.ts --grade 国際戦略港湾,国際拠点港湾
 *   npx tsx scripts/generate-port-projects.ts --port-code 14002
 *   npx tsx scripts/generate-port-projects.ts --limit 5
 *   npx tsx scripts/generate-port-projects.ts --aspect 1080-1920
 */
import * as fs from "fs";
import * as path from "path";

interface Port {
  port_code: string;
  port_name: string;
  prefecture_name: string;
  port_grade: string | null;
  latitude: number;
  longitude: number;
}

interface PortRow {
  port_code: string;
  port_name: string;
  prefecture_name: string;
  port_grade: string | null;
  latitude: number | null;
  longitude: number | null;
}

// SQL の ORDER BY CASE port_grade … と同等の優先度 (未該当は 4)。
const GRADE_PRIORITY: Record<string, number> = {
  国際戦略港湾: 1,
  国際拠点港湾: 2,
  重要港湾: 3,
};

const APP_ROOT = path.join(__dirname, "..");
const PROJECT_ROOT = path.join(APP_ROOT, "..", "..");
const TEMPLATES_DIR = path.join(APP_ROOT, "templates");
const OUTPUT_BASE_DIR = path.join(PROJECT_ROOT, ".local", "r2", "ges", "ports");

// 完全DBレス (docs/01_技術設計/12_完全DBレス設計.md): ports master は git TS の静的
// Reference。D1 ではなく同梱 JSON (D1 ports テーブル 699 件と同一・port_code 順) を読む。
const PORTS_JSON = path.join(__dirname, "data", "ports.json");

// テンプレート基準座標（神戸港 — 港湾用テンプレートがない場合は既存の兵庫県テンプレートを使用）
const TEMPLATE_LAT = 34.691269;
const TEMPLATE_LNG = 135.183025;

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

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      updateCoordinates(obj[key], diffLng, diffLat);
    }
  }
}

function parseArgs(): {
  limit?: number;
  aspect: "1080-1920" | "1920-1080";
  grades: string[];
  portCode?: string;
} {
  const limitIdx = process.argv.indexOf("--limit");
  const limit =
    limitIdx !== -1 && process.argv[limitIdx + 1]
      ? parseInt(process.argv[limitIdx + 1], 10)
      : undefined;

  const aspectIdx = process.argv.indexOf("--aspect");
  const aspect =
    aspectIdx !== -1 && process.argv[aspectIdx + 1] === "1080-1920"
      ? "1080-1920"
      : "1920-1080";

  const gradeIdx = process.argv.indexOf("--grade");
  const grades =
    gradeIdx !== -1 && process.argv[gradeIdx + 1]
      ? process.argv[gradeIdx + 1].split(",")
      : ["\u56FD\u969B\u6226\u7565\u6E2F\u6E7E", "\u56FD\u969B\u62E0\u70B9\u6E2F\u6E7E"];

  const portCodeIdx = process.argv.indexOf("--port-code");
  const portCode =
    portCodeIdx !== -1 && process.argv[portCodeIdx + 1]
      ? process.argv[portCodeIdx + 1]
      : undefined;

  return {
    limit: Number.isNaN(limit) ? undefined : limit,
    aspect,
    grades,
    portCode,
  };
}

function fetchPorts(grades: string[], portCode?: string, limit?: number): Port[] {
  const all = JSON.parse(fs.readFileSync(PORTS_JSON, "utf8")) as PortRow[];
  const hasCoords = (p: PortRow): boolean =>
    p.latitude != null && p.longitude != null;

  // port_code 指定時は単一港 (lat/lng 必須)。
  if (portCode) {
    return all.filter(
      (p) => p.port_code === portCode && hasCoords(p),
    ) as Port[];
  }

  // grade 指定: port_grade IN (grades) かつ lat/lng 非 null。
  const gradeSet = new Set(grades);
  const filtered = all.filter(
    (p) => p.port_grade != null && gradeSet.has(p.port_grade) && hasCoords(p),
  );

  // ORDER BY grade 優先度, port_code (SQLite BINARY 照合 = バイト順)。
  filtered.sort((a, b) => {
    const pa = GRADE_PRIORITY[a.port_grade ?? ""] ?? 4;
    const pb = GRADE_PRIORITY[b.port_grade ?? ""] ?? 4;
    if (pa !== pb) return pa - pb;
    return a.port_code < b.port_code ? -1 : a.port_code > b.port_code ? 1 : 0;
  });

  const limited = limit ? filtered.slice(0, limit) : filtered;
  return limited as Port[];
}

async function generatePortProjects(): Promise<void> {
  const { limit, aspect, grades, portCode } = parseArgs();
  const ports = fetchPorts(grades, portCode, limit);

  if (ports.length === 0) {
    console.error("対象の港が見つかりません。--grade または --port-code を確認してください。");
    process.exit(1);
  }

  // テンプレート: 港湾専用があればそちらを優先、なければ兵庫県（神戸）の既存テンプレートを使用
  const portTemplatePath = path.join(TEMPLATES_DIR, "ports", `${aspect}.esp`);
  const defaultTemplatePath = path.join(TEMPLATES_DIR, aspect, "28000.esp");
  const templatePath = fs.existsSync(portTemplatePath)
    ? portTemplatePath
    : defaultTemplatePath;

  if (!fs.existsSync(templatePath)) {
    throw new Error(`テンプレートが見つかりません: ${templatePath}`);
  }

  const outputDir = path.join(OUTPUT_BASE_DIR, aspect);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const template = JSON.parse(templateContent);

  const templateRelLng = toRelativeLng(TEMPLATE_LNG);
  const templateRelLat = toRelativeLat(TEMPLATE_LAT);

  const usingPortTemplate = templatePath === portTemplatePath;
  console.log(
    `Google Earth Studio 港湾プロジェクト生成開始 [${aspect.toUpperCase()}]`
  );
  console.log(`テンプレート: ${usingPortTemplate ? "港湾専用" : "都道府県用（暫定）"}`);
  console.log(`出力先: ${outputDir}`);
  console.log(`対象: ${ports.length} 港 (${grades.join(", ")})`);
  if (portCode) console.log(`指定港: ${portCode}`);
  if (limit) console.log(`制限: ${limit} 件`);
  console.log("");

  for (const port of ports) {
    const project = JSON.parse(JSON.stringify(template));

    const targetRelLng = toRelativeLng(port.longitude);
    const targetRelLat = toRelativeLat(port.latitude);
    const diffLng = targetRelLng - templateRelLng;
    const diffLat = targetRelLat - templateRelLat;

    updateCoordinates(project, diffLng, diffLat);

    // メタデータ更新（GES UI 上の表示名）
    const projectName = `${port.port_name}港_${port.prefecture_name}_旋回動画_${aspect}`;
    const metadata = project.metadata as { name?: string } | undefined;
    if (metadata) metadata.name = projectName;
    const settings = project.settings as { name?: string } | undefined;
    if (settings) settings.name = projectName;

    const filename = `${port.port_code}.esp`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(project, null, 2), "utf8");

    console.log(
      `[${port.port_code}] ${port.port_name}港（${port.prefecture_name}）${port.port_grade ?? ""} → ${filename}`
    );
  }

  console.log(
    `\n完了: ${aspect} 用に ${ports.length} 個のプロジェクトファイルを生成しました。`
  );
  console.log(`出力ディレクトリ: ${path.resolve(outputDir)}`);
}

generatePortProjects().catch((error) => {
  console.error("エラーが発生しました:", error);
  process.exit(1);
});
