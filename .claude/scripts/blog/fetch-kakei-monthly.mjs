#!/usr/bin/env node
/**
 * fetch-kakei-monthly.mjs — 家計調査 (全国・二人以上の世帯) の月次品目データと消費者物価指数 (CPI) から
 * 型C (時系列変化) 記事の折れ線 data JSON を作る接地器。
 *
 * metric 化していない e-Stat 表を直接読むので、source.json は kind:"estat" で statsDataId と params を保存する
 * (blog-data-schema.md §1.5「metric 化していない e-Stat 直叩き」)。
 *
 * 表:
 *   kakei-expenditure  0003343671 家計調査 家計収支編 二人以上の世帯 品目分類 (2020年改定) 月次 金額 (2000-01〜)
 *   kakei-quantity     0003343670 同 数量
 *   kakei-unit-price   金額 ÷ 数量 の購入単価 (上 2 表から算出。円/単位)
 *   cpi                0003427113 2020年基準 消費者物価指数 品目別 (指数, 1970-01〜)
 * いずれも area=00000 (全国)。家計調査は cat02=03 (二人以上の世帯 2000年〜)、CPI は tab=1 (指数)。
 *
 * layout:
 *   monthly         そのまま月次 (from〜to)。系列 = 品目
 *   annual          暦年集計。家計調査は 12 か月合計、CPI は 12 か月平均。系列 = 品目。--index-base で基準年=100 の指数に
 *   months-by-year  横軸 = 1〜12 月、系列 = 年 (--years 指定)。品目は 1 つ。季節パターンの比較用
 *
 * Usage:
 *   node .claude/scripts/blog/fetch-kakei-monthly.mjs --slug <slug> --name <base> --source kakei-expenditure \
 *     --items 011100030:ビール,011100060:発泡酒・ビール風 --layout annual --from 2000-01 --to 2024-12 --title "..." --unit 円
 *   node .claude/scripts/blog/fetch-kakei-monthly.mjs --slug <slug> --name beer-months --source kakei-expenditure \
 *     --items 011100030:ビール --layout months-by-year --years 2000,2012,2024 --title "..." --unit 円
 *   node .claude/scripts/blog/fetch-kakei-monthly.mjs --slug <slug> --name bread-cpi --source cpi \
 *     --items 1021:食パン,1001:米 --layout annual --index-base 2000 --title "..." --unit "指数 (2000年=100)"
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const CACHE_DIR = path.join(os.tmpdir(), "stats47-kakei-monthly-cache");

const SOURCES = {
  "kakei-expenditure": { statsDataId: "0003343671", name: "家計調査 家計収支編 二人以上の世帯 品目分類(2020年改定) 月次 (金額)", fixed: { cdArea: "00000", cdCat02: "03" }, annual: "sum" },
  "kakei-quantity": { statsDataId: "0003343670", name: "家計調査 家計収支編 二人以上の世帯 品目分類(2020年改定) 月次 (数量)", fixed: { cdArea: "00000", cdCat02: "03" }, annual: "sum" },
  cpi: { statsDataId: "0003427113", name: "2020年基準 消費者物価指数 品目別 (全国・指数)", fixed: { cdArea: "00000", cdTab: "1" }, annual: "mean" },
  // 購入単価 = 金額 ÷ 数量 (同じ品目コードを金額表と数量表の両方から取る)。年次は 12 か月の金額合計 ÷ 数量合計
  "kakei-unit-price": { statsDataId: "0003343671,0003343670", name: "家計調査 家計収支編 二人以上の世帯 品目分類(2020年改定) 月次 (金額 ÷ 数量 = 購入単価)", fixed: { cdArea: "00000", cdCat02: "03" }, annual: "ratio" },
};

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const SLUG = getArg("--slug");
const NAME = getArg("--name");
const SOURCE = getArg("--source");
const ITEMS = (getArg("--items") || "")
  .split(",")
  .filter(Boolean)
  .map((s) => {
    const [code, label] = s.split(":");
    return { code, label: label || code };
  });
const LAYOUT = getArg("--layout", "annual");
const FROM = getArg("--from", "2000-01");
const TO = getArg("--to", "2024-12");
const YEARS = (getArg("--years") || "").split(",").filter(Boolean);
const INDEX_BASE = getArg("--index-base");
const TITLE = getArg("--title");
const UNIT = getArg("--unit", "");
const BASE_DIR = getArg("--base-dir", "docs/21_ブログ記事原稿");
if (!SLUG || !NAME || !SOURCES[SOURCE] || !ITEMS.length || !TITLE) {
  console.error("usage: --slug <slug> --name <base> --source kakei-expenditure|kakei-quantity|kakei-unit-price|cpi --items code:label,... --layout monthly|annual|months-by-year [--from YYYY-MM] [--to YYYY-MM] [--years YYYY,...] [--index-base YYYY] --title <title> [--unit <unit>]");
  process.exit(1);
}
if (LAYOUT === "months-by-year" && (ITEMS.length !== 1 || YEARS.length < 2)) {
  console.error("[error] months-by-year は --items 1 つ + --years 2 年以上");
  process.exit(1);
}

function appId() {
  if (process.env.NEXT_PUBLIC_ESTAT_APP_ID) return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
  const env = fs.readFileSync(path.join(PROJECT_ROOT, "apps/web/.env.development"), "utf8");
  const m = env.match(/NEXT_PUBLIC_ESTAT_APP_ID=\s*"?([^"\n]+)"?/);
  if (!m) throw new Error("NEXT_PUBLIC_ESTAT_APP_ID が無い");
  return m[1].trim();
}

async function fetchItem(src, code) {
  if (src.annual === "ratio") {
    const [e, q] = await Promise.all([fetchItem(SOURCES["kakei-expenditure"], code), fetchItem(SOURCES["kakei-quantity"], code)]);
    const qty = new Map(q.values.map((v) => [v.ym, v]));
    const values = e.values
      .map((v) => {
        const qv = qty.get(v.ym);
        if (!qv || v.value == null || qv.value == null || qv.value === 0) return { ym: v.ym, value: null, unit: "" };
        return { ym: v.ym, value: Math.round((v.value / qv.value) * 100) / 100, unit: `円/${qv.unit || "単位"}`, expenditure: v.value, quantity: qv.value };
      })
      .sort((a, b) => a.ym.localeCompare(b.ym));
    return { total: values.length, unit: values.find((v) => v.unit)?.unit || "", values };
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cache = path.join(CACHE_DIR, `${src.statsDataId}-${code}.json`);
  if (fs.existsSync(cache) && Date.now() - fs.statSync(cache).mtimeMs < 7 * 24 * 3600 * 1000) {
    return JSON.parse(fs.readFileSync(cache, "utf8"));
  }
  const params = new URLSearchParams({ appId: appId(), statsDataId: src.statsDataId, cdCat01: code, metaGetFlg: "N", cntGetFlg: "N", ...src.fixed });
  const url = `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`e-Stat HTTP ${res.status}`);
  const json = await res.json();
  const d = json.GET_STATS_DATA?.STATISTICAL_DATA;
  if (!d) throw new Error(`e-Stat error: ${json.GET_STATS_DATA?.RESULT?.ERROR_MSG || "unknown"}`);
  const values = [].concat(d.DATA_INF?.VALUE || [])
    .map((v) => {
      const t = String(v["@time"]);
      const mm = t.slice(-2);
      if (mm === "00") return null; // 年・年度の行は使わない (月次だけ)
      return { ym: `${t.slice(0, 4)}-${mm}`, value: /^-?[0-9.]+$/.test(v["$"]) ? Number(v["$"]) : null, unit: v["@unit"] || "" };
    })
    .filter(Boolean)
    .sort((a, b) => a.ym.localeCompare(b.ym));
  const out = { total: Number(d.RESULT_INF?.TOTAL_NUMBER || 0), unit: values.find((v) => v.unit)?.unit || "", values };
  fs.writeFileSync(cache, JSON.stringify(out));
  return out;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const round1 = (x) => Math.round(x * 10) / 10;

async function main() {
  const src = SOURCES[SOURCE];
  const fetched = [];
  for (const it of ITEMS) fetched.push({ ...it, ...(await fetchItem(src, it.code)) });

  let series = [];
  let subtitle;
  if (LAYOUT === "monthly") {
    series = fetched.map((f) => ({
      label: f.label,
      data: f.values.filter((v) => v.ym >= FROM && v.ym <= TO && v.value != null).map((v) => ({ year: v.ym, value: v.value })),
    }));
  } else if (LAYOUT === "annual") {
    series = fetched.map((f) => {
      const byYear = new Map();
      for (const v of f.values) {
        if (v.ym < FROM || v.ym > TO || v.value == null) continue;
        const y = v.ym.slice(0, 4);
        if (!byYear.has(y)) byYear.set(y, []);
        byYear.get(y).push(src.annual === "ratio" ? v : v.value);
      }
      let data = [...byYear.entries()]
        .filter(([, xs]) => xs.length === 12) // 12 か月そろった年だけ (途中年を混ぜない)
        .map(([y, xs]) => ({
          year: y,
          value:
            src.annual === "sum"
              ? Math.round(xs.reduce((a, b) => a + b, 0))
              : src.annual === "ratio"
                ? round1(xs.reduce((a, b) => a + b.expenditure, 0) / xs.reduce((a, b) => a + b.quantity, 0))
                : round1(mean(xs)),
        }));
      if (INDEX_BASE) {
        const base = data.find((d) => d.year === INDEX_BASE);
        if (!base || !base.value) throw new Error(`${f.label}: 基準年 ${INDEX_BASE} の値が無い`);
        data = data.map((d) => ({ year: d.year, value: round1((d.value / base.value) * 100) }));
      }
      return { label: f.label, data };
    });
    if (INDEX_BASE) subtitle = `${INDEX_BASE}年 = 100`;
  } else if (LAYOUT === "months-by-year") {
    const f = fetched[0];
    series = YEARS.map((y) => ({
      label: `${y}年`,
      data: f.values.filter((v) => v.ym.startsWith(y) && v.value != null).map((v) => ({ year: `${Number(v.ym.slice(5))}月`, value: v.value })),
    }));
    subtitle = f.label;
  }
  series = series.filter((s) => s.data.length);
  if (!series.length) {
    console.error("[error] データが空");
    process.exit(1);
  }

  const outDir = path.join(PROJECT_ROOT, BASE_DIR, SLUG, "data");
  fs.mkdirSync(outDir, { recursive: true });
  const unit = UNIT || fetched[0].unit || "";
  const chart = { chartType: "line", title: TITLE, unit, ...(subtitle ? { subtitle } : {}), series };
  const yearsCovered = [...new Set(series.flatMap((s) => s.data.map((d) => String(d.year).slice(0, 4))))].sort();
  const source = {
    kind: "estat",
    statsDataId: src.statsDataId,
    statsName: src.name,
    params: { ...src.fixed, cdCat01: ITEMS.map((i) => i.code).join(",") },
    items: ITEMS,
    year: LAYOUT === "months-by-year" ? YEARS.join(",") : `${yearsCovered[0]}-${yearsCovered[yearsCovered.length - 1]}`,
    unit,
    label: TITLE,
    transform:
      LAYOUT === "annual"
        ? `月次値を暦年で${src.annual === "sum" ? "合計 (12 か月そろった年のみ)" : src.annual === "ratio" ? "集計 (12 か月の金額合計 ÷ 数量合計)" : "平均 (12 か月そろった年のみ)"}${INDEX_BASE ? `し、${INDEX_BASE}年 = 100 で指数化` : ""}`
        : LAYOUT === "months-by-year"
          ? `指定年 (${YEARS.join(", ")}) の月次値を月ごとに並べた季節パターン`
          : `月次値そのまま (${FROM}〜${TO})`,
    source: `estat:${src.statsDataId}`,
    restore: `node .claude/scripts/blog/fetch-kakei-monthly.mjs --slug ${SLUG} --name ${NAME} --source ${SOURCE} --items ${ITEMS.map((i) => `${i.code}:${i.label}`).join(",")} --layout ${LAYOUT} --from ${FROM} --to ${TO}${YEARS.length ? ` --years ${YEARS.join(",")}` : ""}${INDEX_BASE ? ` --index-base ${INDEX_BASE}` : ""} --title ${JSON.stringify(TITLE)} --unit ${JSON.stringify(unit)}`,
    accessedAt: new Date().toISOString().slice(0, 10),
  };
  fs.writeFileSync(path.join(outDir, `${NAME}-timeseries.json`), JSON.stringify(chart, null, 2) + "\n");
  fs.writeFileSync(path.join(outDir, `${NAME}-timeseries.source.json`), JSON.stringify(source, null, 2) + "\n");
  console.error(
    `[ok] ${NAME}-timeseries.json: ${series.length} 系列 / ` +
      series.map((s) => `${s.label} ${s.data.length}点 (${s.data[0].year}〜${s.data[s.data.length - 1].year})`).join(", ") +
      `\n     → ${path.relative(PROJECT_ROOT, outDir)}`,
  );
}
main().catch((e) => {
  console.error(`[error] ${e.message}`);
  process.exit(1);
});
