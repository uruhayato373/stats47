#!/usr/bin/env node
/**
 * オープンデータ取組済み市区町村の割合 (都道府県別) の投入スクリプト。
 *
 * 出典: デジタル庁「オープンデータ取組済自治体資料」全団体リスト (CSV) 令和8年(2026年)6月30日時点
 *   https://www.digital.go.jp/resources/data_local_governments
 *   利用条件: デジタル庁の利用規約 (公共データ利用規約第1.0版) https://www.digital.go.jp/copyright-policy
 *   加工の旨: 取組済み市区町村数を、市区町村総数で割って都道府県別の割合を算出した。
 *
 * 手順:
 *   1. ランディングページから CSV の直リンクを解決して取得 (UTF-8 BOM 付き)
 *   2. 団体コード (6桁) の先頭2桁=都道府県、3〜5桁が "000" の行=都道府県自身 / それ以外=市区町村
 *   3. 都道府県別に取組済み市区町村を数える
 *   4. 分母=市区町村総数 (既存 metric municipality-count の R2 値 2024年度。全国計 1,741 = 1,718市町村 + 23特別区)
 *   5. 検算: 全団体行数がデジタル庁公表の取組数 1,617 (PPTX 資料) と一致 / 都道府県行は 47 件 /
 *      都道府県×市区町村の合計が 1,617 / 分母合計が 1,741 (1,788 = 47 + 1,741 の公表分母と一致) /
 *      どの県も 取組済み <= 総数
 *
 * 実行: node .claude/scripts/data/fetch-opendata-adoption-rate.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";
import { PREF_NAMES, PREF_AREA_CODES, fetchBuffer, fetchJson, writeStatsValues, roundTo } from "./lib/stats-values-writer.mjs";

const LANDING_URL = "https://www.digital.go.jp/resources/data_local_governments";
const ORIGIN = "https://www.digital.go.jp";
const AS_OF_LABEL = "令和8年(2026年)6月30日時点";
const PUBLISHED_ADOPTED_TOTAL = 1617; // 公表資料 (PPTX) 「1,617/1,788 自治体」
const PUBLISHED_DENOMINATOR_TOTAL = 1788; // 47都道府県 + 1,741市区町村
const DENOM_URL = `${R2_PUBLIC_BASE_URL}/app/stats/municipality-count/values.json`;
const DENOM_YEAR = "2024";
const METRIC_KEY = "opendata-adoption-rate-municipalities";

export function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function main() {
  const html = (await fetchBuffer(LANDING_URL)).toString("utf8");
  const m = html.match(/href="([^"]+_resources_opendata_lg_list_\d+\.csv)"/);
  if (!m) throw new Error("CSV の直リンクをランディングページから解決できません (ページ構造が変化)");
  const csvUrl = ORIGIN + m[1];
  console.log(`[fetch] ${csvUrl}`);
  const text = (await fetchBuffer(csvUrl)).toString("utf8").replace(/^﻿/, "");
  const table = parseCsv(text);
  const header = table[0];
  if (header[0] !== "団体コード" || header[1] !== "団体名") throw new Error(`CSV 見出しが想定外: ${header.slice(0, 3)}`);
  const body = table.slice(1).filter((r) => /^\d{6}$/.test((r[0] ?? "").trim()));

  const prefRows = body.filter((r) => r[0].slice(2, 5) === "000");
  const muniRows = body.filter((r) => r[0].slice(2, 5) !== "000");
  const adopted = Object.fromEntries(PREF_AREA_CODES.map((c) => [c.slice(0, 2), 0]));
  for (const r of muniRows) {
    const p = r[0].slice(0, 2);
    if (!(p in adopted)) throw new Error(`未知の都道府県コード: ${r[0]} ${r[1]}`);
    adopted[p] += 1;
  }

  // --- 検算 ---
  if (body.length !== PUBLISHED_ADOPTED_TOTAL) throw new Error(`取組済み団体数 ${body.length} != 公表 ${PUBLISHED_ADOPTED_TOTAL}`);
  if (prefRows.length !== 47) throw new Error(`都道府県行 ${prefRows.length} != 47`);
  const denomPayload = await fetchJson(DENOM_URL);
  const denomByCode = Object.fromEntries(denomPayload.rows.filter((r) => r.yearCode === DENOM_YEAR).map((r) => [r.areaCode, r.value]));
  const denomTotal = PREF_AREA_CODES.reduce((s, c) => s + denomByCode[c], 0);
  if (denomTotal + 47 !== PUBLISHED_DENOMINATOR_TOTAL) throw new Error(`分母 ${denomTotal}+47 != 公表分母 ${PUBLISHED_DENOMINATOR_TOTAL}`);
  const muniAdoptedTotal = Object.values(adopted).reduce((a, b) => a + b, 0);
  if (muniAdoptedTotal + prefRows.length !== PUBLISHED_ADOPTED_TOTAL) throw new Error("県+市区町村の合計が公表値と不一致");

  const rows = PREF_NAMES.map((areaName, i) => {
    const code = PREF_AREA_CODES[i];
    const n = adopted[code.slice(0, 2)];
    const d = denomByCode[code];
    if (n > d) throw new Error(`${areaName}: 取組済み ${n} > 総数 ${d}`);
    return { areaName, yearCode: "2026", value: roundTo((n / d) * 100, 1), _n: n, _d: d };
  });
  console.log(`[verify] OK: 取組済み ${body.length}団体 (県47+市区町村${muniAdoptedTotal}) = 公表 ${PUBLISHED_ADOPTED_TOTAL}, 分母 ${denomTotal}+47=${PUBLISHED_DENOMINATOR_TOTAL}, 全国市区町村取組率 ${roundTo((muniAdoptedTotal / denomTotal) * 100, 1)}% (${AS_OF_LABEL})`);
  writeStatsValues({ metricKey: METRIC_KEY, unit: "％", rows });
}

main().catch((e) => { console.error(e); process.exit(1); });
