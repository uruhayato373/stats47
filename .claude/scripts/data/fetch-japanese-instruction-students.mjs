#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PDF_URL = "https://www.mext.go.jp/content/20260525-mxt_kyokoku-000049811_03.pdf";
const EXPECTED_SHA256 = "c94028f6385bfa735095d796c70adf85804a7e342b64d1d57e1aa84e06f4bedc";
const EXPECTED_TOTALS = { foreign: 73_313, japanese: 11_446, combined: 84_759 };
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県",
  "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
  "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

export function parsePrefectureTotals(text) {
  const rows = new Map();
  for (const line of text.split(/\r?\n/)) {
    const name = PREFECTURES.find((prefecture) => line.trimStart().startsWith(prefecture));
    if (!name) continue;
    const numbers = line
      .slice(line.indexOf(name) + name.length)
      .match(/[0-9][0-9,]*(?:\.[0-9]+)?%?/g)
      ?.map((token) => Number(token.replace(/[,%]/g, ""))) ?? [];
    if (numbers.length < 4) throw new Error(`${name}: 合計列を判定できません`);
    rows.set(name, numbers.at(-4));
  }
  if (rows.size !== PREFECTURES.length) {
    const missing = PREFECTURES.filter((name) => !rows.has(name));
    throw new Error(`都道府県抽出 ${rows.size}/47（欠落: ${missing.join(", ")}）`);
  }
  return rows;
}

export function buildRows(foreign, japanese) {
  return PREFECTURES.map((areaName, index) => ({
    areaCode: `${String(index + 1).padStart(2, "0")}000`,
    areaName,
    yearCode: "2025",
    yearName: "2025",
    value: foreign.get(areaName) + japanese.get(areaName),
    unit: "人",
  }));
}

export function verifyRows(rows, foreign, japanese, expectedTotals = EXPECTED_TOTALS) {
  if (rows.length !== PREFECTURES.length) throw new Error(`観測行 ${rows.length}/47`);
  if (new Set(rows.map(({ areaCode }) => areaCode)).size !== PREFECTURES.length) throw new Error("都道府県コードが重複しています");
  for (const row of rows) {
    if (!PREFECTURES.includes(row.areaName)) throw new Error(`未知の都道府県: ${row.areaName}`);
    if (!Number.isInteger(row.value) || row.value < 0) throw new Error(`${row.areaName}: 値は0以上の整数が必要です`);
    if (row.yearCode !== "2025" || row.yearName !== "2025" || row.unit !== "人") {
      throw new Error(`${row.areaName}: 年・単位契約が不正です`);
    }
  }
  const sum = (values) => [...values.values()].reduce((total, value) => total + value, 0);
  const actual = {
    foreign: sum(foreign),
    japanese: sum(japanese),
    combined: rows.reduce((total, row) => total + row.value, 0),
  };
  for (const key of Object.keys(expectedTotals)) {
    if (actual[key] !== expectedTotals[key]) {
      throw new Error(`${key}全国計 ${actual[key]} != ${expectedTotals[key]}`);
    }
  }
}

function pageText(pdfPath, page) {
  return execFileSync("pdftotext", ["-layout", "-f", String(page), "-l", String(page), pdfPath, "-"], {
    encoding: "utf8",
  });
}

async function main() {
  const writeLocal = process.argv.includes("--write-local");
  const work = mkdtempSync(path.join(tmpdir(), "stats47-japanese-instruction-"));
  try {
    const response = await fetch(PDF_URL);
    if (!response.ok) throw new Error(`PDF取得失敗: HTTP ${response.status}`);
    const pdf = Buffer.from(await response.arrayBuffer());
    const hash = createHash("sha256").update(pdf).digest("hex");
    if (hash !== EXPECTED_SHA256) throw new Error(`PDF hash drift: ${hash}`);
    const pdfPath = path.join(work, "source.pdf");
    writeFileSync(pdfPath, pdf);
    const foreign = parsePrefectureTotals(pageText(pdfPath, 10));
    const japanese = parsePrefectureTotals(pageText(pdfPath, 15));
    const rows = buildRows(foreign, japanese);
    verifyRows(rows, foreign, japanese);
    if (writeLocal) {
      const sorted = [...rows].sort((left, right) => right.value - left.value || left.areaCode.localeCompare(right.areaCode));
      const rankByCode = new Map(sorted.map((row, index) => [row.areaCode, index + 1]));
      const rankedRows = rows.map((row) => ({ ...row, rank: rankByCode.get(row.areaCode) }));
      const outputPath = path.join(
        PROJECT_ROOT,
        ".local/r2/app/stats/students-requiring-japanese-instruction/values.json",
      );
      mkdirSync(path.dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, `${JSON.stringify({
        metricKey: "students-requiring-japanese-instruction",
        entityKind: "prefecture",
        rows: rankedRows,
        meta: { rowCount: 47, yearRange: ["2025", "2025"], areaCount: 47, generatedAt: new Date().toISOString() },
      }, null, 2)}\n`);
      console.log(`local snapshot written: ${outputPath}`);
    }
    console.log(`verified: 47 prefectures / ${EXPECTED_TOTALS.combined.toLocaleString("ja-JP")} people / ${hash}`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
