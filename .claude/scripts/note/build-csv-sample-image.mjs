#!/usr/bin/env node
/**
 * 任意の CSV の先頭 N 行を「データのサンプル」表画像 (SVG + PNG) にする。有料データ商品の無料部分に置く
 * (sns-content-standards.md §2-7b: サンプル画像は実データから生成し手書きしない)。
 *
 * 使い方:
 *   node .claude/scripts/note/build-csv-sample-image.mjs --csv <analysis.csv> --out <dir>/<name>.svg \
 *     [--rows 6] [--title "analysis.csv — 先頭6行"] [--subtitle "…"] [--footer "…"] [--file-name analysis.csv] \
 *     [--expand-json values]   # JSON 文字列の列をキーごとの列へ展開して見せる (元ファイルの構造はキャプションで説明する)
 *     [--keys a,b,c]           # 展開するキーを絞る (列が多すぎて幅 1280 を超えると PNG が等倍になり読めない)
 *     [--number-locale]        # 数値列を桁区切りで表示
 * 出力: --out の SVG と同名の PNG (svg-to-png.cjs、density 288)。
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { tableSvg, estimateWidth } from "./lib/sample-table-svg.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const require = createRequire(import.meta.url);
const { svgDirToPng } = require(path.join(ROOT, ".claude/scripts/lib/svg-to-png.cjs"));

const args = process.argv.slice(2);
const opt = (name, fallback = null) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : fallback; };
const CSV = opt("csv"); const OUT = opt("out");
if (!CSV || !OUT) { console.error("--csv と --out (…/name.svg) が必要"); process.exit(1); }
const ROWS = Number(opt("rows", 6));
const EXPAND = opt("expand-json");
const LOCALE = args.includes("--number-locale");

/** RFC4180 風の最小 CSV パーサ (引用符内のカンマ・二重引用符に対応)。 */
export function parseCsv(text) {
  const rows = []; let row = []; let cell = ""; let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') { if (src[i + 1] === '"') { cell += '"'; i += 1; } else quoted = false; }
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && src[i + 1] === "\n") i += 1; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.length > 1 || (r[0] ?? "").trim() !== "");
}

const table = parseCsv(fs.readFileSync(path.resolve(ROOT, CSV), "utf8"));
let header = table[0];
let body = table.slice(1);
const totalRows = body.length;
if (EXPAND) {
  const idx = header.indexOf(EXPAND);
  if (idx < 0) { console.error(`--expand-json 列が無い: ${EXPAND}`); process.exit(1); }
  const wanted = opt("keys") ? opt("keys").split(",").map((k) => k.trim()).filter(Boolean) : null;
  const present = [...new Set(body.flatMap((r) => Object.keys(JSON.parse(r[idx] || "{}"))))];
  if (wanted) for (const k of wanted) if (!present.includes(k)) { console.error(`--keys に無いキー: ${k}`); process.exit(1); }
  const keys = wanted || present; // --keys は表示順も決める
  header = [...header.slice(0, idx), ...keys, ...header.slice(idx + 1)];
  body = body.map((r) => { const o = JSON.parse(r[idx] || "{}"); return [...r.slice(0, idx), ...keys.map((k) => o[k] ?? ""), ...r.slice(idx + 1)]; });
}
// コード・順位・年の列は桁区切りしない (16000 → 16,000 は県コードとして誤り)
const KEEP_RAW = /(code|rank|year|id|コード|順位|年)$/i;
const shown = body.slice(0, ROWS).map((r) => r.map((v, i) => {
  if (LOCALE && !KEEP_RAW.test(header[i] || "") && /^-?\d+(\.\d+)?$/.test(String(v))) return Number(v).toLocaleString("ja-JP", { maximumFractionDigits: 4 });
  return String(v);
}));
const cols = header.map((label, i) => {
  const values = [label, ...shown.map((r) => r[i] ?? "")];
  const numeric = shown.every((r) => /^-?[\d,]+(\.\d+)?%?$/.test(String(r[i] ?? "")) || String(r[i] ?? "") === "");
  return { label, w: estimateWidth(values), align: numeric ? "end" : "start" };
});
const svg = tableSvg({
  title: opt("title", `${path.basename(CSV)} — 先頭${shown.length}行`),
  subtitle: opt("subtitle", ""),
  cols, rows: shown,
  footer: opt("footer", `… 全${totalRows.toLocaleString("ja-JP")}行`),
  fileName: opt("file-name", path.basename(CSV)),
});
const viewWidth = 24 + cols.reduce((a, c) => a + c.w, 0);
if (viewWidth >= 1280) { console.error(`表が広すぎる (viewBox ${viewWidth}px ≥ 1280 → PNG が等倍で読めない)。--keys で列を絞る`); process.exit(1); }
const outPath = path.resolve(ROOT, OUT);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, svg, "utf8");
const results = await svgDirToPng(path.dirname(outPath));
const mine = results.find((r) => path.basename(r.pngPath) === path.basename(outPath).replace(/\.svg$/, ".png"));
console.log(JSON.stringify({ svg: outPath, png: mine?.pngPath ?? null, width: mine?.width, height: mine?.height, rows: shown.length, totalRows, columns: header }));
