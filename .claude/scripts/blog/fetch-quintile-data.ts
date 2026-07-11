#!/usr/bin/env -S npx tsx
/**
 * fetch-quintile-data.ts
 * 家計調査「年間収入五分位階級別（全国）」を e-Stat から取得し、ブログ記事用の
 * 五分位バー / 時系列折れ線 SVG を svg-builder で生成する（3点セット: json + source.json + svg）。
 *
 * 都道府県ランキングではなく「全国×年収5階級」の全国型記事用。数値は e-Stat 実値のみ（捏造禁止）。
 *
 * Usage:
 *   # 五分位バー（1品目・6本=平均+I〜V or 5本）
 *   npx tsx .claude/scripts/blog/fetch-quintile-data.ts --slug income-quintile-overview --name accommodation --item 090410001 [--year 2024] [--no-average]
 *   # 時系列折れ線（I/III/V の3系列 × 全年）
 *   npx tsx .claude/scripts/blog/fetch-quintile-data.ts --slug income-quintile-regressive --name tobacco --item 100140001 --mode line [--from 1985]
 *   # スキャン（全品目の V/I 比を一括算出 → /tmp/quintile-scan.json）
 *   npx tsx .claude/scripts/blog/fetch-quintile-data.ts --mode scan [--year 2024]
 *
 * 出力: docs/21_ブログ記事原稿/<slug>/data/<name>-quintile[.-timeseries].{json,source.json,svg}
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { generateBarChartSvg, generateLineSvg } from "../../../packages/svg-builder/src/charts/index.ts";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATS_DATA_ID_AMOUNT = "0003348240"; // 品目分類2020年改定・年間収入五分位・金額
const CAT02_TWO_PERSON = "03"; // 二人以上の世帯（2000年～）

function getAppId(): string {
  const env = fs.readFileSync(path.join(PROJECT_ROOT, "apps/web/.env.development"), "utf8");
  const m = env.match(/NEXT_PUBLIC_ESTAT_APP_ID=(\S+)/);
  if (!m) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID not found in apps/web/.env.development");
  return m[1];
}
const APP_ID = getAppId();

// 五分位ラベル（cat03 コード → 表示名）
const QUINTILE_LABELS: Record<string, string> = {
  "00": "平均",
  "01": "第Ⅰ階級（下位20%）",
  "02": "第Ⅱ階級",
  "03": "第Ⅲ階級（中位）",
  "04": "第Ⅳ階級",
  "05": "第Ⅴ階級（上位20%）",
};

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : def;
}
function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function estat(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ appId: APP_ID, ...params }).toString();
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${qs}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`e-Stat HTTP ${r.status}`);
  const j = await r.json();
  const v = j?.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.VALUE;
  if (!v) throw new Error("e-Stat: no VALUE — " + JSON.stringify(j?.GET_STATS_DATA?.RESULT || j).slice(0, 200));
  return Array.isArray(v) ? v : [v];
}

function writeTriple(slug: string, base: string, json: unknown, source: unknown, svg: string) {
  const dir = path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿", slug, "data");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${base}.json`), JSON.stringify(json, null, 1));
  fs.writeFileSync(path.join(dir, `${base}.source.json`), JSON.stringify(source, null, 2));
  const provenance = `<!-- data-source: ${base}.json | generated: ${new Date().toISOString()} -->\n`;
  fs.writeFileSync(path.join(dir, `${base}.svg`), provenance + svg);
  console.log(`[quintile] ${slug}/data/${base}.{json,source.json,svg}`);
}

// ---------- bar モード ----------
async function runBar() {
  const slug = arg("slug")!;
  const name = arg("name")!;
  const item = arg("item")!;
  const year = arg("year", "2024")!;
  const includeAverage = !flag("no-average");
  const title = arg("title") || name;
  const unit = arg("unit") || "円";
  if (!slug || !name || !item) throw new Error("--slug --name --item は必須");

  const codes = includeAverage ? ["00", "01", "02", "03", "04", "05"] : ["01", "02", "03", "04", "05"];
  const values = await estat({
    statsDataId: STATS_DATA_ID_AMOUNT,
    cdCat01: item,
    cdCat02: CAT02_TWO_PERSON,
    cdCat03: codes.join(","),
    cdTime: `${year}000000`,
    limit: "20",
  });

  const byCode: Record<string, number> = {};
  for (const v of values) byCode[v["@cat03"]] = Number(v["$"]);
  // data JSON: rank は階級順（I=1..V=5, 平均は 0）。areaName は階級ラベル（都道府県名でないので factual index されない）
  const data = codes
    .filter((c) => byCode[c] != null)
    .map((c) => ({ areaName: QUINTILE_LABELS[c], rank: c === "00" ? 0 : Number(c), value: byCode[c], unit }));

  // BarItem[]（single layout・階級順・平均は先頭）
  const items = data.map((d) => ({ label: d.areaName, value: d.value }));
  const svg = generateBarChartSvg(items, {
    title: `${title}（年収五分位別）`,
    subtitle: `${year}年 二人以上世帯・全国`,
    source: "e-Stat（政府統計の総合窓口）家計調査",
    unit,
    palette: "blue",
    layout: "single",
    showAxis: true,
    ariaLabel: `${title}の年収五分位階級別 ${year}年`,
  });

  const source = {
    kind: "estat",
    statsDataId: STATS_DATA_ID_AMOUNT,
    params: { cdCat01: item, cdCat02: CAT02_TWO_PERSON, cdCat03: codes.join(","), cdTime: `${year}000000` },
    year,
    unit,
    label: title,
    transform: "quintile bars (平均+I〜V or I〜V)",
    fetchedAt: new Date().toISOString(),
    restore: `npx tsx .claude/scripts/blog/fetch-quintile-data.ts --slug ${slug} --name ${name} --item ${item} --year ${year}${includeAverage ? "" : " --no-average"}`,
  };
  writeTriple(slug, `${name}-quintile`, { title: `${title}（年収五分位別）`, unit, year, data }, source, svg);
  // コンソールに実値（記事執筆の参照用）
  console.log("  値:", data.map((d) => `${d.areaName}=${d.value}${unit}`).join(" / "));
  if (byCode["01"] && byCode["05"]) console.log(`  V/I比: ${(byCode["05"] / byCode["01"]).toFixed(2)}倍`);
}

// ---------- line モード ----------
async function runLine() {
  const slug = arg("slug")!;
  const name = arg("name")!;
  const item = arg("item")!;
  const from = Number(arg("from", "1985"));
  const title = arg("title") || name;
  const unit = arg("unit") || "円";
  if (!slug || !name || !item) throw new Error("--slug --name --item は必須");

  // I / III / V の3系列（視認性優先）
  const seriesCodes = ["01", "03", "05"];
  const values = await estat({
    statsDataId: STATS_DATA_ID_AMOUNT,
    cdCat01: item,
    cdCat02: CAT02_TWO_PERSON,
    cdCat03: seriesCodes.join(","),
    limit: "300",
  });

  const series = seriesCodes.map((code) => {
    const pts = values
      .filter((v) => v["@cat03"] === code)
      .map((v) => ({ year: Number(String(v["@time"]).slice(0, 4)), value: Number(v["$"]) }))
      .filter((p) => p.year >= from && Number.isFinite(p.value))
      .sort((a, b) => a.year - b.year);
    return { label: QUINTILE_LABELS[code], data: pts };
  });

  // StatsSchema[] に変換して generateLineSvg
  const statsData = series.flatMap((s, si) =>
    s.data.map((pt) => ({
      metricKey: "value",
      areaCode: String(si + 1).padStart(2, "0"),
      areaName: s.label,
      yearCode: String(pt.year),
      yearName: String(pt.year),
      value: pt.value,
      unit,
    })),
  );
  const svg = generateLineSvg(statsData, {
    title: `${title}の推移（年収五分位別）`,
    subtitle: `${from}〜 二人以上世帯・全国`,
    unit,
    xKey: "yearCode",
    seriesKey: "areaCode",
    yLabel: `${title}（${unit}）`,
    legendPosition: "bottom",
  });

  const source = {
    kind: "estat",
    statsDataId: STATS_DATA_ID_AMOUNT,
    params: { cdCat01: item, cdCat02: CAT02_TWO_PERSON, cdCat03: seriesCodes.join(",") },
    unit,
    label: title,
    transform: "quintile timeseries (I/III/V)",
    fetchedAt: new Date().toISOString(),
    restore: `npx tsx .claude/scripts/blog/fetch-quintile-data.ts --mode line --slug ${slug} --name ${name} --item ${item} --from ${from}`,
  };
  writeTriple(slug, `${name}-quintile-timeseries`, { title: `${title}の推移（年収五分位別）`, unit, series }, source, svg);
  // 参照用: 各系列の最初と最後
  for (const s of series) {
    const f = s.data[0], l = s.data[s.data.length - 1];
    if (f && l) console.log(`  ${s.label}: ${f.year}=${f.value} → ${l.year}=${l.value}`);
  }
}

// ---------- scan モード ----------
async function runScan() {
  const year = arg("year", "2024")!;
  // メタから品目名（L3-4のみ）を取得
  const metaUrl = `https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo?appId=${APP_ID}&statsDataId=${STATS_DATA_ID_AMOUNT}`;
  const meta = await (await fetch(metaUrl)).json();
  const cat01 = meta.GET_META_INFO.METADATA_INF.CLASS_INF.CLASS_OBJ.find((o: any) => o["@id"] === "cat01");
  const nameByCode: Record<string, { name: string; level: string }> = {};
  for (const c of cat01.CLASS) nameByCode[c["@code"]] = { name: c["@name"], level: c["@level"] };

  // 全品目 × cat03=01,05 × year を一括取得（1 call）
  const values = await estat({
    statsDataId: STATS_DATA_ID_AMOUNT,
    cdCat02: CAT02_TWO_PERSON,
    cdCat03: "01,05",
    cdTime: `${year}000000`,
    limit: "5000",
  });
  const iByItem: Record<string, number> = {};
  const vByItem: Record<string, number> = {};
  for (const v of values) {
    const item = v["@cat01"];
    const val = Number(v["$"]);
    if (!Number.isFinite(val)) continue;
    if (v["@cat03"] === "01") iByItem[item] = val;
    if (v["@cat03"] === "05") vByItem[item] = val;
  }
  const rows: Array<{ code: string; name: string; level: string; I: number; V: number; ratio: number }> = [];
  for (const code of Object.keys(vByItem)) {
    const I = iByItem[code], V = vByItem[code];
    const meta2 = nameByCode[code];
    if (I == null || V == null || I <= 0 || !meta2) continue;
    // L1-2 の大分類・集計・属性行は除外（実品目のみ: level >= 3、かつ属性系コードを除く）
    if (Number(meta2.level) < 3) continue;
    rows.push({ code, name: meta2.name, level: meta2.level, I, V, ratio: V / I });
  }
  rows.sort((a, b) => b.ratio - a.ratio);
  const out = { year, generatedAt: new Date().toISOString(), count: rows.length, rows };
  fs.writeFileSync("/tmp/quintile-scan.json", JSON.stringify(out, null, 1));
  console.log(`[scan] ${rows.length}品目 → /tmp/quintile-scan.json`);
  console.log("=== 贅沢財 TOP15（V/I比・所得格差最大）===");
  rows.slice(0, 15).forEach((r) => console.log(`  ${r.ratio.toFixed(2)}倍  ${r.name}（I=${r.I} V=${r.V}）[${r.code}]`));
  console.log("=== 逆進 TOP15（V/I比最小・低所得ほど多い）===");
  rows.slice(-15).reverse().forEach((r) => console.log(`  ${r.ratio.toFixed(2)}倍  ${r.name}（I=${r.I} V=${r.V}）[${r.code}]`));
}

async function main() {
  const mode = arg("mode", "bar");
  if (mode === "scan") return runScan();
  if (mode === "line") return runLine();
  return runBar();
}
main().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
