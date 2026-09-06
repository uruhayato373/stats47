/**
 * 全国学力・学習状況調査 (国立教育政策研究所 NIER) の都道府県別 factsheet xlsx から
 * 「小学校 国語・算数 / 中学校 国語・数学 の平均正答率の単純平均」を作り
 * app/stats/<key>/values.json (ローカル staging) に書く手動取り込みスクリプト。
 *
 *   npx tsx packages/data-configs/scripts/ingest-nier-achievement.ts --year 25 [--dry-run] [--refresh]   # 25 = 2025年度 (西暦下2桁)
 *
 * - 一次資料: https://www.nier.go.jp/<yy>chousakekkahoukoku/factsheet/<NN>_<romaji>/<NN>p_<yy>q.xlsx (小学校) と
 *   <NN>m_<yy>qs.xlsx (中学校)。各 xlsx の科目シートの「全体」行に (対象問題数, 都道府県の平均正答率, 全国の平均正答率) が並ぶ。
 * - 検算: 全 94 ファイルの「全国（公立）」列は同じ値でなければならない (ファイル間で一致しなければ fail)。
 * - 理科は 3 年に 1 度しか無いので指標には含めない (年次比較を壊さないため)。
 * - 過去年度 (令和6以前) は NIER 側が国立国会図書館 WARP へリダイレクトするため、本スクリプトは live の年度だけを対象にする。
 *
 * R2 への反映は別工程 (diff-push-r2 --prefix app/stats)。ここでは .local/r2 に書くだけ。
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PREFECTURES } from "../src/area-axis.js";
import { buildRecipe } from "../src/recipe.js";
import { METRICS_REGISTRY } from "../src/registry.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const JSZip = require("jszip") as typeof import("jszip");

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const METRIC_KEY = "academic-achievement-test-average-rate";
const SLUGS: Record<string, string> = {
  "01": "hokkaido", "02": "aomori", "03": "iwate", "04": "miyagi", "05": "akita", "06": "yamagata",
  "07": "fukushima", "08": "ibaraki", "09": "tochigi", "10": "gunma", "11": "saitama", "12": "chiba",
  "13": "tokyo", "14": "kanagawa", "15": "niigata", "16": "toyama", "17": "ishikawa", "18": "fukui",
  "19": "yamanashi", "20": "nagano", "21": "gifu", "22": "shizuoka", "23": "aichi", "24": "mie",
  "25": "shiga", "26": "kyoto", "27": "osaka", "28": "hyougo", "29": "nara", "30": "wakayama",
  "31": "tottori", "32": "shimane", "33": "okayama", "34": "hiroshima", "35": "yamaguchi",
  "36": "tokushima", "37": "kagawa", "38": "ehime", "39": "kouchi", "40": "fukuoka", "41": "saga",
  "42": "nagasaki", "43": "kumamoto", "44": "ohita", "45": "miyazaki", "46": "kagoshima", "47": "okinawa",
};
const SUBJECTS = [
  { school: "p", suffix: "q", sheet: "国語", label: "小学校 国語" },
  { school: "p", suffix: "q", sheet: "算数", label: "小学校 算数" },
  { school: "m", suffix: "qs", sheet: "国語", label: "中学校 国語" },
  { school: "m", suffix: "qs", sheet: "数学", label: "中学校 数学" },
] as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const yy = arg("year");
if (!yy || !/^\d{2}$/.test(yy)) {
  console.error("usage: --year <西暦下2桁 (例 25 = 2025年度)> [--dry-run] [--refresh]");
  process.exit(1);
}
const calendarYear = 2000 + Number(yy); // URL の <yy> は西暦下2桁 (25 = 2025年度 = 令和7年度)
const dryRun = flag("dry-run");
const refresh = flag("refresh");
const CACHE = resolve(REPO_ROOT, `.local/nier/${yy}`);
const R2_LOCAL = resolve(REPO_ROOT, ".local/r2");

function decodeXml(s: string): string {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
}

/** xlsx の指定シートを行→(列→値) に展開する最小パーサ (数式の cached value と共有文字列だけを読む) */
async function readSheetRows(buf: Buffer, sheetName: string): Promise<Map<number, Map<string, string>>> {
  const zip = await JSZip.loadAsync(buf);
  const sharedXml = (await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "";
  const shared: string[] = [];
  for (const m of sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    shared.push(decodeXml(Array.from(m[1].matchAll(/<t[^>]*>([^<]*)<\/t>/g)).map((t) => t[1]).join("")));
  }
  const wb = await zip.file("xl/workbook.xml")!.async("string");
  const rels = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");
  const sheet = Array.from(wb.matchAll(/<sheet [^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g)).find((m) => decodeXml(m[1]) === sheetName);
  if (!sheet) throw new Error(`sheet not found: ${sheetName} (available: ${Array.from(wb.matchAll(/name="([^"]+)"/g)).map((m) => m[1]).join(",")})`);
  const rel = Array.from(rels.matchAll(/<Relationship [^>]*Id="([^"]+)"[^>]*Target="([^"]+)"/g)).find((m) => m[1] === sheet[2]);
  if (!rel) throw new Error(`rel not found for ${sheetName}`);
  const target = rel[2].startsWith("/") ? rel[2].slice(1) : `xl/${rel[2]}`;
  const xml = await zip.file(target)!.async("string");
  const rows = new Map<number, Map<string, string>>();
  for (const c of xml.matchAll(/<c r="([A-Z]+)(\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const [, col, rowStr, attrs, inner = ""] = c;
    const v = inner.match(/<v>([^<]*)<\/v>/)?.[1];
    let value: string | undefined;
    if (/t="s"/.test(attrs)) value = v === undefined ? undefined : shared[Number(v)];
    else if (/t="inlineStr"/.test(attrs)) value = decodeXml(Array.from(inner.matchAll(/<t[^>]*>([^<]*)<\/t>/g)).map((t) => t[1]).join(""));
    else value = v;
    if (value === undefined || value === "") continue;
    const row = Number(rowStr);
    if (!rows.has(row)) rows.set(row, new Map());
    rows.get(row)!.set(col, value);
  }
  return rows;
}

function colIndex(col: string): number {
  return col.split("").reduce((a, ch) => a * 26 + (ch.charCodeAt(0) - 64), 0);
}

/** 「全体」行の (都道府県値, 全国値) を返す。並びは 対象問題数 → 都道府県 → 全国 */
function extractOverall(rows: Map<number, Map<string, string>>): { pref: number; national: number } {
  for (const cells of rows.values()) {
    const ordered = Array.from(cells.entries()).sort((a, b) => colIndex(a[0]) - colIndex(b[0]));
    const idx = ordered.findIndex(([, v]) => v.replace(/[\s　]/g, "") === "全体");
    if (idx < 0) continue;
    const nums = ordered.slice(idx + 1).map(([, v]) => Number(v)).filter((n) => Number.isFinite(n));
    if (nums.length < 3) throw new Error(`「全体」行の数値が不足: ${ordered.map(([, v]) => v).join(" | ")}`);
    return { pref: nums[1], national: nums[2] };
  }
  throw new Error("「全体」行が見つからない");
}

async function download(url: string, dest: string): Promise<Buffer> {
  if (!refresh && existsSync(dest)) return readFileSync(dest);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, buf);
  return buf;
}

async function main() {
  const config = METRICS_REGISTRY[METRIC_KEY];
  if (!config) throw new Error(`metric config not found: ${METRIC_KEY}`);
  const nationalBySubject = new Map<string, Set<number>>();
  const rows: Array<{ areaCode: string; areaName: string; yearCode: string; yearName: string; value: number | null; unit: string; rank: number | null; subjects: number[] }> = [];
  for (const pref of PREFECTURES) {
    const nn = pref.code.slice(0, 2);
    const slug = `${nn}_${SLUGS[nn]}`;
    const subjectValues: number[] = [];
    for (const s of SUBJECTS) {
      const file = `${nn}${s.school}_${yy}${s.suffix}.xlsx`;
      const url = `https://www.nier.go.jp/${yy}chousakekkahoukoku/factsheet/${slug}/${file}`;
      const buf = await download(url, resolve(CACHE, slug, file));
      const { pref: v, national } = extractOverall(await readSheetRows(buf, s.sheet));
      subjectValues.push(v);
      if (!nationalBySubject.has(s.label)) nationalBySubject.set(s.label, new Set());
      nationalBySubject.get(s.label)!.add(national);
    }
    const mean = Math.round((subjectValues.reduce((a, b) => a + b, 0) / subjectValues.length) * 100) / 100;
    rows.push({ areaCode: pref.code, areaName: pref.name, yearCode: String(calendarYear), yearName: `${calendarYear}年度`, value: mean, unit: config.unit, rank: null, subjects: subjectValues });
    console.log(`${pref.name}\t${subjectValues.join("\t")}\t→ ${mean}`);
  }
  // 検算: 全国値は全ファイルで一致しなければならない
  for (const [label, set] of nationalBySubject) {
    if (set.size !== 1) throw new Error(`全国値がファイル間で不一致: ${label} = ${Array.from(set).join(",")}`);
  }
  const nationalMean = Array.from(nationalBySubject.values()).map((s) => Array.from(s)[0]).reduce((a, b) => a + b, 0) / nationalBySubject.size;
  console.log(`全国（公立）: ${Array.from(nationalBySubject.entries()).map(([k, v]) => `${k}=${Array.from(v)[0]}`).join(", ")} → 単純平均 ${nationalMean.toFixed(2)}`);
  if (rows.length !== 47) throw new Error(`47 県そろわない: ${rows.length}`);
  // rank: value 降順・同値同順位 (page-data-batch の assignRanks と同じ規則)
  const ranked = [...rows].sort((a, b) => (b.value as number) - (a.value as number));
  let prevValue: number | null = null; let prevRank = 0;
  ranked.forEach((r, i) => { if (prevValue !== null && r.value === prevValue) r.rank = prevRank; else { r.rank = i + 1; prevRank = i + 1; prevValue = r.value; } });
  const payload = {
    metricKey: METRIC_KEY,
    entityKind: "prefecture" as const,
    rows: rows.map(({ subjects: _s, ...r }) => r),
    meta: {
      rowCount: rows.length,
      yearRange: [String(calendarYear), String(calendarYear)] as [string, string],
      areaCount: new Set(rows.map((r) => r.areaCode)).size,
      generatedAt: new Date().toISOString(),
      recipe: buildRecipe(config),
    },
  };
  const top = ranked.slice(0, 3).map((r) => `${r.areaName} ${r.value}`).join(" / ");
  const bottom = ranked.slice(-3).map((r) => `${r.areaName} ${r.value}`).join(" / ");
  console.log(`上位: ${top}\n下位: ${bottom}`);
  if (dryRun) { console.log("[dry-run] 書き込みなし"); return; }
  const outPath = resolve(R2_LOCAL, `app/stats/${METRIC_KEY}/values.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(payload));
  console.log(`wrote ${outPath} (${rows.length} rows)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
