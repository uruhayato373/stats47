#!/usr/bin/env node
/**
 * 有料記事 d-kakei-category-dataset の無料部分に置く「データのサンプル」画像 3 枚を、
 * 添付する実データ (docs/31_note記事原稿/<slug>/data/*.csv) から決定的に生成する。
 *
 *   images/sample-ratio-table.svg       47市平均比 CSV の先頭 6 行 (全14列)
 *   images/sample-timeseries-table.svg  時系列 CSV の先頭 10 行 (2007年 札幌市の十費目)
 *   images/category-spread-range.svg    十大費目ごとの最小市〜最大市 (2024年) と倍率
 *
 * 数字は CSV から読むだけで本文に手書きしない (本文の 8.7倍 等は同じ CSV 由来)。
 * デザインは .claude/skills/note/generate-note-charts/reference/design-system.md に従う。
 * SVG→PNG は .claude/scripts/lib/svg-to-png.cjs (density 288 = 2x)。
 *
 * 使い方: node .claude/scripts/note/build-kakei-dataset-sample-images.mjs [--slug d-kakei-category-dataset]
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { tableSvg, svgDoc, COLORS as C, esc } from "./lib/sample-table-svg.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const require = createRequire(import.meta.url);
const { svgDirToPng } = require(path.join(ROOT, ".claude/scripts/lib/svg-to-png.cjs"));

const slugIdx = process.argv.indexOf("--slug");
const SLUG = slugIdx >= 0 ? process.argv[slugIdx + 1] : "d-kakei-category-dataset";
const ADIR = path.join(ROOT, "docs/31_note記事原稿", SLUG);
const DATA = path.join(ADIR, "data");
const OUT = path.join(ADIR, "images");

function readCsv(file) {
  const text = fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const cols = head.split(",");
  return { cols, rows: lines.map((l) => l.split(",")) };
}

// ---- 1. 47市平均比 CSV 先頭 6 行 ----
const ratio = readCsv(path.join(DATA, "kakei-category-ratio-47.csv"));
const catCols = ratio.cols.filter((c) => !["prefCode", "prefName", "cityName", "year"].includes(c));
const ratioRows = ratio.rows.slice(0, 6);
const ratioSvg = tableSvg({
  title: "kakei-category-ratio-47.csv — 先頭6行",
  subtitle: `${ratioRows[0][3]}年・二人以上の世帯・47都道府県庁所在市の単純平均 = 1.0000`,
  cols: [
    { label: "prefCode", w: 62 }, { label: "prefName", w: 62 }, { label: "cityName", w: 66 }, { label: "year", w: 40, align: "end" },
    // 見出し (最長 8 字) が隣の列へ食い込まない幅。数値は右寄せなので見出しも右寄せ。
    ...catCols.map((c) => ({ label: c, w: c.length >= 7 ? 104 : c.length >= 5 ? 84 : 64, align: "end" })),
  ],
  rows: ratioRows.map((r) => r.map((v, i) => (i >= 4 ? Number(v).toFixed(4) : v))),
  footer: `… 全${ratio.rows.length}行 (北海道〜沖縄県)。列 = 県コード / 県名 / 県庁所在市 / 年 / 十大費目の47市平均比`,
  fileName: "kakei-category-ratio-47.csv",
});

// ---- 2. 時系列 CSV 先頭 10 行 ----
const ts = readCsv(path.join(DATA, "kakei-category-timeseries.csv"));
const tsRows = ts.rows.slice(0, 10);
const years = [...new Set(ts.rows.map((r) => r[0]))].sort();
const prefs = new Set(ts.rows.map((r) => r[1])).size;
const cats = new Set(ts.rows.map((r) => r[4])).size;
const tsSvg = tableSvg({
  title: "kakei-category-timeseries.csv — 先頭10行",
  subtitle: "年 × 県 × 費目の縦持ち。金額は正規化していない実額 (円/年)",
  cols: [
    { label: "year", w: 52, align: "end" }, { label: "prefCode", w: 70 }, { label: "prefName", w: 72 },
    { label: "cityName", w: 72 }, { label: "category", w: 120 }, { label: "valueYen", w: 90, align: "end" },
  ],
  rows: tsRows.map((r) => [r[0], r[1], r[2], r[3], r[4], Number(r[5]).toLocaleString("ja-JP")]),
  footer: `… 全${ts.rows.length.toLocaleString("ja-JP")}行 = ${years[0]}–${years[years.length - 1]}年 (${years.length}年) × ${prefs}県 × ${cats}費目。欠測なし`,
  fileName: "kakei-category-timeseries.csv",
});

// ---- 3. 十大費目の県間差 (最小市〜最大市) ----
const spread = catCols.map((c, i) => {
  const ci = 4 + i;
  const vals = ratio.rows.map((r) => ({ v: Number(r[ci]), city: r[2] }));
  const min = vals.reduce((a, b) => (b.v < a.v ? b : a));
  const max = vals.reduce((a, b) => (b.v > a.v ? b : a));
  return { cat: c, min, max, ratio: max.v / min.v };
}).sort((a, b) => b.ratio - a.ratio);

function rangeSvg(items) {
  const w = 680, rowH = 40, top = 92, left = 124, right = 66, plotW = w - left - right;
  const h = top + rowH * items.length + 56;
  const xMin = 0, xMax = 2.4;
  const X = (v) => left + ((v - xMin) / (xMax - xMin)) * plotW;
  const p = [];
  p.push(`<text x="16" y="28" font-size="17" font-weight="700" fill="${C.title}">十大費目の県間差 — 最小の市と最大の市 (${ratioRows[0][3]}年)</text>`);
  p.push(`<text x="16" y="50" font-size="11.5" fill="${C.sub}">47都道府県庁所在市の単純平均を1.00とした比率。右端は最大÷最小の倍率。添付 CSV から算出</text>`);
  p.push(`<rect x="${left}" y="${top - 10}" width="${plotW}" height="${rowH * items.length + 10}" fill="${C.plot}" stroke="${C.border}"/>`);
  for (const t of [0.5, 1.0, 1.5, 2.0]) {
    const x = X(t);
    p.push(`<line x1="${x}" y1="${top - 10}" x2="${x}" y2="${top + rowH * items.length}" stroke="${t === 1 ? C.axis : C.grid}" stroke-width="${t === 1 ? 1.2 : 1}" stroke-dasharray="${t === 1 ? "4 3" : "0"}"/>`);
    p.push(`<text x="${x}" y="${top + rowH * items.length + 16}" font-size="10.5" fill="${C.axis}" text-anchor="middle">${t.toFixed(2)}</text>`);
  }
  p.push(`<text x="${X(1)}" y="${top - 16}" font-size="10.5" fill="${C.axis}" text-anchor="middle">47市平均 = 1.00</text>`);
  items.forEach((it, i) => {
    const y = top + rowH * i + rowH / 2;
    const hot = i === 0;
    const col = hot ? C.red : C.blue;
    p.push(`<text x="${left - 10}" y="${y + 4}" font-size="12.5" font-weight="${hot ? 700 : 500}" fill="${C.title}" text-anchor="end">${esc(it.cat)}</text>`);
    p.push(`<line x1="${X(it.min.v)}" y1="${y}" x2="${X(it.max.v)}" y2="${y}" stroke="${col}" stroke-width="${hot ? 5 : 4}" stroke-linecap="round" opacity="0.55"/>`);
    p.push(`<circle cx="${X(it.min.v)}" cy="${y}" r="5" fill="${C.plot}" stroke="${col}" stroke-width="2.5"/>`);
    p.push(`<circle cx="${X(it.max.v)}" cy="${y}" r="5" fill="${col}"/>`);
    p.push(`<text x="${X(it.min.v) - 9}" y="${y - 6}" font-size="10" fill="${C.sub}" text-anchor="end">${esc(it.min.city)}</text>`);
    p.push(`<text x="${X(it.min.v) - 9}" y="${y + 8}" font-size="10" fill="${C.sub}" text-anchor="end">${it.min.v.toFixed(2)}</text>`);
    p.push(`<text x="${X(it.max.v) + 9}" y="${y - 6}" font-size="10" fill="${C.sub}">${esc(it.max.city)}</text>`);
    p.push(`<text x="${X(it.max.v) + 9}" y="${y + 8}" font-size="10" fill="${C.sub}">${it.max.v.toFixed(2)}</text>`);
    p.push(`<text x="${w - 14}" y="${y + 4}" font-size="12.5" font-weight="700" fill="${col}" text-anchor="end">×${it.ratio.toFixed(1)}</text>`);
  });
  p.push(`<text x="16" y="${h - 14}" font-size="10" fill="${C.faint}">出典: 総務省統計局「家計調査」(都道府県庁所在市別・二人以上の世帯) を加工して作成</text>`);
  return svgDoc(w, h, p.join("\n"));
}
const rangeSvgText = rangeSvg(spread);

fs.mkdirSync(OUT, { recursive: true });
const files = {
  "sample-ratio-table.svg": ratioSvg,
  "sample-timeseries-table.svg": tsSvg,
  "category-spread-range.svg": rangeSvgText,
};
for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), body, "utf8");
const results = await svgDirToPng(OUT);
for (const r of results) console.log(`→ ${path.basename(r.pngPath)}  ${r.width}×${r.height}  ${(r.bytes / 1024).toFixed(0)} KB`);
console.log(JSON.stringify({ slug: SLUG, svg: Object.keys(files), topSpread: spread[0].cat, topRatio: Number(spread[0].ratio.toFixed(1)), rows: { ratio: ratio.rows.length, timeseries: ts.rows.length } }));
