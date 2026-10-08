#!/usr/bin/env node
/**
 * 高校男子 100人あたり ラグビー部員数 (都道府県別) の投入スクリプト。
 *
 * 出典 (分子): 公益財団法人全国高等学校体育連盟「令和7年度 加盟・登録状況【全日制＋定通制】」(令和7年10月現在)
 *   https://www.zen-koutairen.com/statistics/  (PDF: /pdf/reg-reiwa07.pdf の2ページ目「ラグビーフットボール 男子 人数」)
 * 出典 (分母): 文部科学省「学校基本調査」令和7年度 高等学校 都道府県別 学科別学年別生徒数(本科)・全日制+定時制・男
 *   (e-Stat 表番号 ey-168 / statInfId 000040393253 / ey0168-1 シート。令和7年5月1日現在)
 *   利用条件: 全国高体連の利用規約は未確認 (事実としての加盟登録人数を出典明記で利用。オーナー承認 2026-10-08)。
 *
 * 手順:
 *   1. 高体連PDFを取得し pdftotext -layout で2ページ目をテキスト化 (18競技区分 x (校数,人数) = 36数値/県)
 *   2. 47都道府県の36数値を抽出し、ラグビー男子の (校数,人数) = 7番目の組を取り出す
 *   3. 検算 (分子): 各列の47県合算がPDF「合計」行と全36列で完全一致
 *   4. e-Stat のxlsxから高校男子生徒数(計=全日制+定時制)を取得し、検算 (分母):
 *      男 = 国立+公立+私立 / 男 = 全日制男 + 定時制男 / 計 = 男 + 女 (47県すべて)
 *   5. 100人あたり = 人数 / 男子生徒数 x 100 (2桁丸め) を .local/r2/app/stats/<key>/values.json へ書き出し
 *
 * 注意: 高体連の「全日制＋定通制」は通信制の登録も含みうるが、分母の学校基本調査は全日制+定時制の本科のみ。
 *   通信制の男子登録が分子にだけ含まれる分、値はわずかに過大になりうる (metric note に明記)。
 *
 * 実行: node .claude/scripts/data/fetch-zen-koutairen-rugby.mjs
 * 正典: .claude/rules/data-provenance-standards.md
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { fetchBuffer, makeWorkDir, toFullPrefName, writeStatsValues, roundTo, PREF_NAMES } from "./lib/stats-values-writer.mjs";

const PDF_URL = "https://www.zen-koutairen.com/pdf/reg-reiwa07.pdf";
const DENOM_URL = "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040393253&fileKind=0";
const METRIC_KEY = "high-school-club-per100-rugby-male";
const PAIR_COUNT = 18; // ソフトテニス(男,女) ハンドボール(男,女) サッカー(男,女) ラグビー(男) バドミントン(男,女) ソフトボール(男,女) 相撲(男) 柔道(男,女) スキー(男,女) スケート(男,女)
const RUGBY_PAIR = 6; // 0始まり: ソフトテニス男0 女1 ハンド男2 女3 サッカー男4 女5 ラグビー男6

const nums = (s) => [...s.matchAll(/\d[\d,]*/g)].map((m) => Number(m[0].replace(/,/g, "")));

function parsePage(text) {
  const rows = new Map();
  let total = null;
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(\d{1,2})\s+(\D+?)\s{2,}((?:\d[\d,]*\s+){35}\d[\d,]*)\s*$/);
    if (m) {
      const pref = toFullPrefName(m[2]);
      if (!pref) continue;
      rows.set(pref, nums(m[3]));
      continue;
    }
    const t = line.match(/^\s*合計\s+((?:\d[\d,]*\s+){35}\d[\d,]*)\s*$/);
    if (t) total = nums(t[1]);
  }
  return { rows, total };
}

const cell = (c) => (c && typeof c === "object" && "result" in c ? c.result : c);

function sheetRows(ws) {
  const out = new Map();
  for (let r = 8; r <= ws.rowCount; r++) {
    const pref = toFullPrefName(String(cell(ws.getCell(r, 1).value) ?? ""));
    if (pref) out.set(pref, [2, 3, 4].map((k) => Number(cell(ws.getCell(r, k).value))));
  }
  return out;
}

async function loadMaleStudents() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await fetchBuffer(DENOM_URL));
  const get = (name) => {
    const ws = wb.getWorksheet(name);
    if (!ws) throw new Error(`シート ${name} がありません`);
    return sheetRows(ws);
  };
  const all = get("ey0168-1"); // 計 全日制+定時制: [計, 男, 女]
  const nat = get("ey0168-2"), pub = get("ey0168-3"), pri = get("ey0168-4");
  const full = get("ey0168-5"), part = get("ey0168-9");
  if (all.size !== 47) throw new Error(`高校生徒数の県数 ${all.size}/47`);
  for (const [pref, [tot, male, female]] of all) {
    if (tot !== male + female) throw new Error(`${pref}: 計 != 男+女`);
    if (male !== nat.get(pref)[1] + pub.get(pref)[1] + pri.get(pref)[1]) throw new Error(`${pref}: 男 != 国立+公立+私立`);
    if (male !== full.get(pref)[1] + part.get(pref)[1]) throw new Error(`${pref}: 男 != 全日制男+定時制男`);
  }
  console.log("[verify] 分母OK: 47県で 計=男+女 / 男=国立+公立+私立 / 男=全日制男+定時制男");
  return new Map([...all].map(([pref, v]) => [pref, v[1]]));
}

async function main() {
  const work = makeWorkDir("zen-koutairen");
  try {
    const pdfPath = path.join(work, "reg.pdf");
    fs.writeFileSync(pdfPath, await fetchBuffer(PDF_URL));
    const text = execFileSync("pdftotext", ["-layout", "-f", "2", "-l", "2", pdfPath, "-"], { encoding: "utf8", maxBuffer: 1 << 26 });
    const { rows, total } = parsePage(text);
    if (rows.size !== 47 || PREF_NAMES.some((n) => !rows.has(n))) throw new Error(`都道府県の抽出 ${rows.size}/47 (PDF構造が変化した可能性)`);
    if (!total || total.length !== PAIR_COUNT * 2) throw new Error("合計行を抽出できません");
    for (let k = 0; k < PAIR_COUNT * 2; k++) {
      const sum = [...rows.values()].reduce((s, v) => s + v[k], 0);
      if (sum !== total[k]) throw new Error(`検算失敗(分子) 列${k}: 47県合算 ${sum} != 公表合計 ${total[k]}`);
    }
    console.log(`[verify] 分子OK: 36列すべてで47県合算がPDF合計行と一致 (ラグビー男子 ${total[RUGBY_PAIR * 2]}校 / ${total[RUGBY_PAIR * 2 + 1]}人)`);

    const male = await loadMaleStudents();
    const out = PREF_NAMES.map((areaName) => {
      const members = rows.get(areaName)[RUGBY_PAIR * 2 + 1];
      return { areaName, yearCode: "2025", value: roundTo((members / male.get(areaName)) * 100, 2), _members: members, _students: male.get(areaName) };
    });
    const nationalPer100 = roundTo((total[RUGBY_PAIR * 2 + 1] / [...male.values()].reduce((a, b) => a + b, 0)) * 100, 2);
    console.log(`[info] 全国(47県計)の高校男子100人あたりラグビー部員数: ${nationalPer100}`);
    writeStatsValues({ metricKey: METRIC_KEY, unit: "人", rows: out });
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
