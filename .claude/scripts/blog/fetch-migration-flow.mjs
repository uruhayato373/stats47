#!/usr/bin/env node
/**
 * fetch-migration-flow.mjs — G型(移動フロー)記事のデータ接地。
 *
 * R2 `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json` は
 * 都道府県ペアごとの行 {fromPrefCode,toPrefCode,inflow,outflow,net} を持つ。
 *
 * 行の視点は **toPrefCode 県** である (2026-08-30 に実測して確定):
 *   from=01000(北海道) to=13000(東京) inflow=13948 outflow=10654 net=+3294
 *   → 東京へ北海道から 13,948 人が転入し、東京から北海道へ 10,654 人が転出、東京の純増 +3,294。
 *   to=13000 の全 46 行の net 合計は +65,219 で、東京が転入超過であることと符合する。
 * 逆に読むと記事の主張が丸ごと反転するので、この規約を変えない。
 *
 * 出力 (3点セット。§blog-data-schema §1.5):
 *   <name>-migration-ranking.json    相手県別の純移動 46 行 (bar: 上位=転入超過 / 下位=転出超過)
 *   <name>-migration-map.json        同じ 46 値のタイルマップ (発散配色。対象県自身は行を持たない)
 *   <name>-migration-timeseries.json 総転入 / 総転出 / 純移動 の推移
 *   + それぞれの .source.json
 *
 * Usage:
 *   node .claude/scripts/blog/fetch-migration-flow.mjs --slug <slug> --pref <5桁コード>
 *     [--year <最新年>] [--from-year <開始年>] [--base-dir docs/21_ブログ記事原稿] [--data-name <name>]
 *
 * exit: 0 = ok / 1 = 引数不正 / 3 = R2 取得失敗・データ不整合
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const METRIC_KEY = "population-migration-inter-prefecture";
const PREFECTURES_JSON = path.join(PROJECT_ROOT, "packages/area/src/data/prefectures.json");

const args = process.argv.slice(2);
const getArg = (flag, fallback = null) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const SLUG = getArg("--slug");
const PREF = getArg("--pref");
const YEAR = getArg("--year", "2025");
const FROM_YEAR = Number(getArg("--from-year", "2020"));
const BASE_DIR = getArg("--base-dir", "docs/21_ブログ記事原稿");
if (!SLUG || !PREF) {
  console.error("usage: --slug <slug> --pref <5桁コード> [--year YYYY] [--from-year YYYY] [--base-dir <dir>] [--data-name <name>]");
  process.exit(1);
}
const DATA_NAME = getArg("--data-name", SLUG);

const PREFS = JSON.parse(fs.readFileSync(PREFECTURES_JSON, "utf8"));
const nameOf = new Map(PREFS.map((p) => [p.prefCode, p.prefName]));
const SELF = nameOf.get(PREF);
if (!SELF) {
  console.error(`[error] 都道府県コードが実在しない: ${PREF}`);
  process.exit(1);
}

async function loadYear(year) {
  const url = `${R2_BASE}/app/stats/${METRIC_KEY}/migration-flow-${year}.json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  return json.rows || [];
}

/** 対象県を to 側に持つ行 = 対象県から見た相手県別の純移動 */
function facing(rows) {
  return rows.filter((r) => r.toPrefCode === PREF);
}

async function main() {
  const rows = await loadYear(YEAR);
  if (!rows || rows.length === 0) {
    console.error(`[error] 移動フローが取得できない: year=${YEAR}`);
    process.exit(3);
  }
  const mine = facing(rows);
  if (mine.length === 0) {
    console.error(`[error] ${SELF} を to 側に持つ行が無い (方向規約が変わった可能性)`);
    process.exit(3);
  }
  // 46 相手県が揃っているか。欠けたまま「全国の傾向」を書かせないための門。
  const counterparts = new Set(mine.map((r) => r.fromPrefCode));
  if (counterparts.size !== 46 || counterparts.has(PREF)) {
    console.error(`[error] 相手県が 46 でない (${counterparts.size} 件)。自県混入=${counterparts.has(PREF)}`);
    process.exit(3);
  }

  const sorted = [...mine].sort((a, b) => b.net - a.net);
  const ranking = {
    title: `${SELF}と各県の人口移動 (純移動)`,
    subtitle: `${YEAR}年`,
    label: `${SELF}の純移動`,
    unit: "人",
    year: YEAR,
    rankingKey: METRIC_KEY,
    source: "住民基本台帳人口移動報告",
    palette: "blue",
    generatedBy: "fetch-migration-flow.mjs",
    data: sorted.map((r, i) => ({
      rank: i + 1,
      areaName: nameOf.get(r.fromPrefCode),
      pref: nameOf.get(r.fromPrefCode),
      areaCode: r.fromPrefCode,
      value: r.net,
      label: `${SELF}の純移動`,
      unit: "人",
    })),
  };

  const map = {
    title: `${SELF}と各県の人口移動 (純移動)`,
    subtitle: `${YEAR}年`,
    label: `${SELF}の純移動`,
    unit: "人",
    year: YEAR,
    rankingKey: METRIC_KEY,
    source: "住民基本台帳人口移動報告",
    // 正負が意味を持つので発散配色。既定の「低い/高い」では読めないのでラベルを明示する。
    scheme: "RdBu",
    legendLabels: ["転出超過", "転入超過"],
    generatedBy: "fetch-migration-flow.mjs",
    data: sorted.map((r) => ({
      pref: nameOf.get(r.fromPrefCode),
      areaName: nameOf.get(r.fromPrefCode),
      value: r.net,
    })),
  };

  // 時系列: 総転入 / 総転出 / 純移動。取得できた年だけを使い、欠年を 0 で埋めない。
  const inflowSeries = [];
  const outflowSeries = [];
  const netSeries = [];
  for (let y = FROM_YEAR; y <= Number(YEAR); y += 1) {
    const yr = await loadYear(String(y));
    if (!yr || yr.length === 0) continue;
    const f = facing(yr);
    if (f.length === 0) continue;
    const inflow = f.reduce((s, r) => s + r.inflow, 0);
    const outflow = f.reduce((s, r) => s + r.outflow, 0);
    inflowSeries.push({ year: String(y), value: inflow });
    outflowSeries.push({ year: String(y), value: outflow });
    netSeries.push({ year: String(y), value: inflow - outflow });
  }
  if (netSeries.length < 3) {
    console.error(`[error] 時系列が ${netSeries.length} 年分しか取れない (3 年未満では推移を論じられない)`);
    process.exit(3);
  }
  const timeseries = {
    title: `${SELF}の都道府県間の転入・転出の推移`,
    unit: "人",
    label: `${SELF}の転入・転出`,
    year: YEAR,
    rankingKey: METRIC_KEY,
    source: "住民基本台帳人口移動報告",
    generatedBy: "fetch-migration-flow.mjs",
    series: [
      { label: "他県からの転入", data: inflowSeries },
      { label: "他県への転出", data: outflowSeries },
      { label: "純移動", data: netSeries },
    ],
  };

  const restoreBase = `node .claude/scripts/blog/fetch-migration-flow.mjs --slug ${SLUG} --pref ${PREF} --year ${YEAR} --from-year ${FROM_YEAR} --data-name ${DATA_NAME}`;
  const commonSource = {
    kind: "derived",
    metricKey: METRIC_KEY,
    prefCode: PREF,
    prefName: SELF,
    year: YEAR,
    unit: "人",
    source: `r2:app/stats/${METRIC_KEY}/migration-flow-${YEAR}.json`,
    upstream: "住民基本台帳人口移動報告 (e-Stat) → R2 app/stats",
    restore: restoreBase,
    generatedBy: "fetch-migration-flow.mjs",
    fetchedAt: new Date().toISOString(),
  };

  const outDir = path.join(PROJECT_ROOT, BASE_DIR, SLUG, "data");
  fs.mkdirSync(outDir, { recursive: true });
  const write = (name, payload, sourceExtra) => {
    fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(payload, null, 2) + "\n");
    fs.writeFileSync(
      path.join(outDir, `${name}.source.json`),
      JSON.stringify({ ...commonSource, ...sourceExtra }, null, 2) + "\n",
    );
  };

  write(`${DATA_NAME}-migration-ranking`, ranking, {
    label: `${SELF}と各県の純移動`,
    formula: "net = (相手県→対象県の転入) − (対象県→相手県の転出)。行は toPrefCode 県の視点",
    transform: "対象県を to 側に持つ 46 行を net 降順に並べる",
  });
  write(`${DATA_NAME}-migration-map`, map, {
    label: `${SELF}と各県の純移動 (タイルマップ)`,
    formula: "ranking と同一の値",
    transform: "46 相手県。対象県自身は移動の相手にならないため行を持たない",
  });
  write(`${DATA_NAME}-migration-timeseries`, timeseries, {
    label: `${SELF}の転入・転出の推移`,
    formula: "各年の 46 相手県について inflow / outflow を合計",
    transform: `${inflowSeries[0].year}〜${inflowSeries[inflowSeries.length - 1].year} 年`,
    source: `r2:app/stats/${METRIC_KEY}/migration-flow-<year>.json`,
  });

  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const net = netSeries[netSeries.length - 1].value;
  console.error(
    `[ok] ${SELF} (${PREF}) ${YEAR}年 — 純移動 ${net > 0 ? "+" : ""}${net.toLocaleString()}人\n` +
      `     最大の転入元: ${nameOf.get(top.fromPrefCode)} ${top.net > 0 ? "+" : ""}${top.net.toLocaleString()}人\n` +
      `     最大の転出先: ${nameOf.get(bottom.fromPrefCode)} ${bottom.net.toLocaleString()}人\n` +
      `     時系列 ${netSeries.length} 年分 / → ${path.relative(PROJECT_ROOT, outDir)}`,
  );
}
main();
