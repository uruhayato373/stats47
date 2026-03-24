/**
 * 出生率ランキング記事用 SVG チャート生成スクリプト
 *
 * 生成物:
 * 1. fertility-rate-ranking.svg   — 合計特殊出生率 上位10・下位10
 * 2. fertility-rate-map.svg       — タイルグリッドマップ
 * 3. fertility-vs-marriage-age-scatter.svg — 散布図
 * 4. fertility-rate-timeseries.svg — 時系列折れ線
 * 5. fertility-summary-findings.svg — まとめ
 * 6. all-data.json                — 全データ
 */

import Database from "better-sqlite3";
import { writeFileSync } from "fs";
import { genRanking10 } from "./svg-builders/ranking-table.mjs";

const DB_PATH = ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite";
const OUT_DIR = "docs/21_ブログ記事原稿/birth-rate-fertility-ranking/data";
const FONT = "'Hiragino Sans','Noto Sans JP',sans-serif";

const db = new Database(DB_PATH);

// ── データ取得 ──────────────────────────────────────────────
function getRanking(categoryCode, yearCode) {
  return db.prepare(
    "SELECT area_code, area_name, value, rank FROM ranking_data WHERE category_code = ? AND year_code = ? AND area_type = 'prefecture' ORDER BY rank"
  ).all(categoryCode, yearCode);
}

const tfr = getRanking("total-fertility-rate", "2023");
const mageData = getRanking("average-age-of-first-marriage-wife", "2023");
const cbrData = getRanking("crude-birth-rate", "2023");
const marriageData = getRanking("marriages-per-total-population", "2022");

const timeseries = db.prepare(
  "SELECT year_code, AVG(value) as avg_val FROM ranking_data WHERE category_code = 'total-fertility-rate' AND area_type = 'prefecture' GROUP BY year_code ORDER BY year_code"
).all();

const nationalAvg = tfr.reduce((s, r) => s + r.value, 0) / tfr.length;

// ── 1. ランキング表 SVG (genRanking10) ─────────────────────
const top10 = tfr.slice(0, 10);
const bottom10 = [...tfr].reverse().slice(0, 10);

const rankingSvg = genRanking10({
  title: "合計特殊出生率ランキング",
  subtitle: "（2023年）",
  left: {
    label: "出生率が高い",
    color: "#dc2626",
    barColor: "#ef4444",
    bgColor: "#fef2f2",
    items: top10.map(r => ({
      rank: r.rank,
      name: r.area_name,
      value: r.value,
      label: r.value.toFixed(2),
    })),
  },
  right: {
    label: "出生率が低い",
    color: "#1d4ed8",
    barColor: "#3b82f6",
    bgColor: "#eff6ff",
    items: bottom10.map(r => ({
      rank: r.rank,
      name: r.area_name,
      value: r.value,
      label: r.value.toFixed(2),
    })),
  },
  maxBarValue: Math.max(...tfr.map(r => r.value)),
  note: "出典：厚生労働省「人口動態統計」2023年",
});

writeFileSync(`${OUT_DIR}/fertility-rate-ranking.svg`, rankingSvg);
console.log("✓ fertility-rate-ranking.svg");

// ── 2. タイルグリッドマップ ─────────────────────────────────
const TILE_GRID_LAYOUT = {
  "01000": { name: "北海道", col: 12, row: 0, colspan: 2, rowspan: 2 },
  "02000": { name: "青森",   col: 12, row: 3, colspan: 2, rowspan: 1 },
  "03000": { name: "岩手",   col: 13, row: 4 },
  "05000": { name: "秋田",   col: 12, row: 4 },
  "04000": { name: "宮城",   col: 13, row: 5 },
  "06000": { name: "山形",   col: 12, row: 5 },
  "07000": { name: "福島",   col: 12, row: 6, colspan: 2 },
  "15000": { name: "新潟",   col: 10, row: 6, colspan: 2 },
  "16000": { name: "富山",   col: 9, row: 6 },
  "17000": { name: "石川",   col: 8, row: 6 },
  "18000": { name: "福井",   col: 8, row: 7 },
  "21000": { name: "岐阜",   col: 9, row: 7, rowspan: 2 },
  "20000": { name: "長野",   col: 10, row: 7, rowspan: 2 },
  "10000": { name: "群馬",   col: 11, row: 7 },
  "09000": { name: "栃木",   col: 12, row: 7 },
  "08000": { name: "茨城",   col: 13, row: 7 },
  "19000": { name: "山梨",   col: 11, row: 8 },
  "11000": { name: "埼玉",   col: 12, row: 8 },
  "12000": { name: "千葉",   col: 13, row: 8, rowspan: 2 },
  "13000": { name: "東京",   col: 12, row: 9 },
  "14000": { name: "神奈川", col: 12, row: 10 },
  "22000": { name: "静岡",   col: 10, row: 9, colspan: 2 },
  "23000": { name: "愛知",   col: 9, row: 9 },
  "25000": { name: "滋賀",   col: 8, row: 8 },
  "24000": { name: "三重",   col: 8, row: 9, rowspan: 2 },
  "26000": { name: "京都",   col: 6, row: 8, colspan: 2 },
  "28000": { name: "兵庫",   col: 5, row: 8, rowspan: 2 },
  "27000": { name: "大阪",   col: 6, row: 9 },
  "29000": { name: "奈良",   col: 7, row: 9 },
  "30000": { name: "和歌山", col: 6, row: 10, colspan: 2 },
  "31000": { name: "鳥取",   col: 4, row: 8 },
  "33000": { name: "岡山",   col: 4, row: 9 },
  "32000": { name: "島根",   col: 3, row: 8 },
  "34000": { name: "広島",   col: 3, row: 9 },
  "35000": { name: "山口",   col: 2, row: 8, rowspan: 2 },
  "38000": { name: "愛媛",   col: 3, row: 11 },
  "37000": { name: "香川",   col: 4, row: 11 },
  "39000": { name: "高知",   col: 3, row: 12 },
  "36000": { name: "徳島",   col: 4, row: 12 },
  "40000": { name: "福岡",   col: 1, row: 10 },
  "41000": { name: "佐賀",   col: 0, row: 10 },
  "44000": { name: "大分",   col: 1, row: 11 },
  "42000": { name: "長崎",   col: 0, row: 11 },
  "45000": { name: "宮崎",   col: 1, row: 12 },
  "43000": { name: "熊本",   col: 0, row: 12 },
  "46000": { name: "鹿児島", col: 0, row: 13, colspan: 2 },
  "47000": { name: "沖縄",   col: 0, row: 15 },
};

const BASE_X = 35;
const BASE_Y = 45;
const PITCH = 38;
const GAP = 2;
const CELL = PITCH - GAP;

const PALETTE = ["#fff3e0","#ffe0b2","#ffcc80","#ff9800","#e65100","#bf360c"];

function getColor(value, min, max) {
  const t = (value - min) / (max - min);
  const idx = Math.min(Math.floor(t * PALETTE.length), PALETTE.length - 1);
  return PALETTE[idx];
}

function getTextColor(fillColor) {
  const dark = ["#e65100", "#bf360c"];
  return dark.includes(fillColor) ? "#ffffff" : "#374151";
}

const tfrValues = tfr.map(r => r.value);
const tfrMin = Math.min(...tfrValues);
const tfrMax = Math.max(...tfrValues);

let mapSvg = `<svg width="600" height="700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" font-family="${FONT}" role="img" aria-label="合計特殊出生率 都道府県マップ">`;
mapSvg += `<rect width="600" height="700" fill="#fafafa"/>`;
mapSvg += `<text x="300" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">合計特殊出生率（2023年）</text>`;
mapSvg += `<text x="300" y="44" text-anchor="middle" font-size="10" fill="#888">全国平均 ${nationalAvg.toFixed(2)}</text>`;

const tfrMap = Object.fromEntries(tfr.map(r => [r.area_code, r.value]));

for (const [code, layout] of Object.entries(TILE_GRID_LAYOUT)) {
  const value = tfrMap[code];
  if (value === undefined) continue;

  const cs = layout.colspan || 1;
  const rs = layout.rowspan || 1;
  const x = BASE_X + layout.col * PITCH;
  const y = BASE_Y + layout.row * PITCH;
  const w = cs * PITCH - GAP;
  const h = rs * PITCH - GAP;
  const fill = getColor(value, tfrMin, tfrMax);
  const textFill = getTextColor(fill);
  const cx = x + w / 2;
  const nameY = rs > 1 ? y + h / 2 - 3 : y + h / 2 - 3;
  const valY = rs > 1 ? y + h / 2 + 10 : y + h / 2 + 10;
  const nameFontSize = cs > 1 ? 9 : 8;
  const nameWeight = cs > 1 ? "700" : "700";

  mapSvg += `<g aria-label="${layout.name} ${value}"><title>${layout.name}：${value}</title>`;
  mapSvg += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="#ffffff" stroke-width="1"/>`;
  mapSvg += `<text fill="${textFill}" text-anchor="middle">`;
  mapSvg += `<tspan x="${cx}" y="${nameY}" font-size="${nameFontSize}" font-weight="${nameWeight}">${layout.name}</tspan>`;
  mapSvg += `<tspan x="${cx}" y="${valY}" font-size="7">${value.toFixed(2)}</tspan>`;
  mapSvg += `</text></g>`;
}

// 凡例
mapSvg += `<text x="200" y="660" font-size="9" fill="#6b7280">低い</text>`;
mapSvg += `<text x="400" y="660" text-anchor="end" font-size="9" fill="#6b7280">高い</text>`;
const legendW = 200 / PALETTE.length;
PALETTE.forEach((c, i) => {
  mapSvg += `<rect x="${200 + i * legendW}" y="668" width="${legendW}" height="12" fill="${c}"/>`;
});
mapSvg += `<text x="200" y="692" font-size="8" fill="#6b7280">${tfrMin.toFixed(2)}</text>`;
mapSvg += `<text x="400" y="692" text-anchor="end" font-size="8" fill="#6b7280">${tfrMax.toFixed(2)}</text>`;
mapSvg += `</svg>`;

writeFileSync(`${OUT_DIR}/fertility-rate-map.svg`, mapSvg);
console.log("✓ fertility-rate-map.svg");

// ── 3. 散布図（合計特殊出生率 × 平均婚姻年齢） ────────────
const REGION_MAP = {
  "01000": "北海道・東北", "02000": "北海道・東北", "03000": "北海道・東北",
  "04000": "北海道・東北", "05000": "北海道・東北", "06000": "北海道・東北",
  "07000": "北海道・東北",
  "08000": "関東", "09000": "関東", "10000": "関東", "11000": "関東",
  "12000": "関東", "13000": "関東", "14000": "関東",
  "15000": "中部", "16000": "中部", "17000": "中部", "18000": "中部",
  "19000": "中部", "20000": "中部", "21000": "中部", "22000": "中部",
  "23000": "中部",
  "24000": "近畿", "25000": "近畿", "26000": "近畿", "27000": "近畿",
  "28000": "近畿", "29000": "近畿", "30000": "近畿",
  "31000": "中国・四国", "32000": "中国・四国", "33000": "中国・四国",
  "34000": "中国・四国", "35000": "中国・四国", "36000": "中国・四国",
  "37000": "中国・四国", "38000": "中国・四国", "39000": "中国・四国",
  "40000": "九州・沖縄", "41000": "九州・沖縄", "42000": "九州・沖縄",
  "43000": "九州・沖縄", "44000": "九州・沖縄", "45000": "九州・沖縄",
  "46000": "九州・沖縄", "47000": "九州・沖縄",
};

const REGION_COLORS = {
  "北海道・東北": "#42a5f5",
  "関東": "#66bb6a",
  "中部": "#fdd835",
  "近畿": "#ffa726",
  "中国・四国": "#ef5350",
  "九州・沖縄": "#ab47bc",
};

const mageMap = Object.fromEntries(mageData.map(r => [r.area_code, r.value]));

// Merge data
const scatterData = tfr.map(r => ({
  code: r.area_code,
  name: r.area_name.replace(/[県府都道]$/, ""),
  x: r.value, // fertility rate
  y: mageMap[r.area_code], // marriage age
  region: REGION_MAP[r.area_code],
})).filter(d => d.y !== undefined);

const SW = 560, SH = 580;
const MARGIN = { top: 60, right: 30, bottom: 60, left: 60 };
const plotW = SW - MARGIN.left - MARGIN.right;
const plotH = SH - MARGIN.top - MARGIN.bottom;

const xVals = scatterData.map(d => d.x);
const yVals = scatterData.map(d => d.y);
const xMin = Math.floor(Math.min(...xVals) * 10) / 10 - 0.05;
const xMax = Math.ceil(Math.max(...xVals) * 10) / 10 + 0.05;
const yMin = Math.floor(Math.min(...yVals) * 10) / 10 - 0.1;
const yMax = Math.ceil(Math.max(...yVals) * 10) / 10 + 0.1;

function scaleX(v) { return MARGIN.left + ((v - xMin) / (xMax - xMin)) * plotW; }
function scaleY(v) { return MARGIN.top + ((yMax - v) / (yMax - yMin)) * plotH; }

const avgX = xVals.reduce((a,b) => a+b) / xVals.length;
const avgY = yVals.reduce((a,b) => a+b) / yVals.length;

// Correlation coefficient
const n = scatterData.length;
const sumXY = scatterData.reduce((s, d) => s + d.x * d.y, 0);
const sumX = xVals.reduce((a,b) => a+b);
const sumY = yVals.reduce((a,b) => a+b);
const sumX2 = xVals.reduce((s, v) => s + v*v, 0);
const sumY2 = yVals.reduce((s, v) => s + v*v, 0);
const r = (n * sumXY - sumX * sumY) / Math.sqrt((n * sumX2 - sumX**2) * (n * sumY2 - sumY**2));

let scatterSvg = `<svg width="${SW}" height="${SH}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SW} ${SH}" font-family="${FONT}" role="img" aria-label="合計特殊出生率と平均婚姻年齢の散布図">`;
scatterSvg += `<rect width="${SW}" height="${SH}" fill="#fafafa" rx="8"/>`;
scatterSvg += `<text x="${SW/2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">合計特殊出生率 × 平均婚姻年齢（初婚の妻）</text>`;
scatterSvg += `<text x="${SW/2}" y="46" text-anchor="middle" font-size="10" fill="#888">相関係数 r = ${r.toFixed(2)}</text>`;

// Plot area
scatterSvg += `<rect x="${MARGIN.left}" y="${MARGIN.top}" width="${plotW}" height="${plotH}" fill="#f9fafb" stroke="#d1d5db"/>`;

// X grid lines
for (let v = Math.ceil(xMin * 10) / 10; v <= xMax; v += 0.1) {
  const vRounded = Math.round(v * 10) / 10;
  const px = scaleX(vRounded);
  scatterSvg += `<line x1="${px}" y1="${MARGIN.top}" x2="${px}" y2="${MARGIN.top + plotH}" stroke="#e5e7eb" stroke-width="0.5"/>`;
  scatterSvg += `<text x="${px}" y="${MARGIN.top + plotH + 16}" text-anchor="middle" font-size="10" fill="#6b7280">${vRounded.toFixed(1)}</text>`;
}

// Y grid lines
for (let v = Math.ceil(yMin * 2) / 2; v <= yMax; v += 0.5) {
  const vRounded = Math.round(v * 2) / 2;
  const py = scaleY(vRounded);
  scatterSvg += `<line x1="${MARGIN.left}" y1="${py}" x2="${MARGIN.left + plotW}" y2="${py}" stroke="#e5e7eb" stroke-width="0.5"/>`;
  scatterSvg += `<text x="${MARGIN.left - 8}" y="${py + 4}" text-anchor="end" font-size="10" fill="#6b7280">${vRounded.toFixed(1)}</text>`;
}

// Average lines
scatterSvg += `<line x1="${scaleX(avgX)}" y1="${MARGIN.top}" x2="${scaleX(avgX)}" y2="${MARGIN.top + plotH}" stroke="#9ca3af" stroke-dasharray="4,3" opacity="0.6"/>`;
scatterSvg += `<line x1="${MARGIN.left}" y1="${scaleY(avgY)}" x2="${MARGIN.left + plotW}" y2="${scaleY(avgY)}" stroke="#9ca3af" stroke-dasharray="4,3" opacity="0.6"/>`;

// Quadrant labels
scatterSvg += `<text x="${MARGIN.left + 10}" y="${MARGIN.top + 16}" font-size="9" fill="#9ca3af">出生率低×晩婚</text>`;
scatterSvg += `<text x="${MARGIN.left + plotW - 10}" y="${MARGIN.top + 16}" text-anchor="end" font-size="9" fill="#9ca3af">出生率高×晩婚</text>`;
scatterSvg += `<text x="${MARGIN.left + 10}" y="${MARGIN.top + plotH - 6}" font-size="9" fill="#9ca3af">出生率低×早婚</text>`;
scatterSvg += `<text x="${MARGIN.left + plotW - 10}" y="${MARGIN.top + plotH - 6}" text-anchor="end" font-size="9" fill="#9ca3af">出生率高×早婚</text>`;

// Label key points
const labelPoints = ["東京", "沖縄", "北海道", "長崎", "島根", "宮崎", "鹿児島", "神奈川", "福井", "京都", "大阪", "秋田"];

// Data points
for (const d of scatterData) {
  const cx = scaleX(d.x);
  const cy = scaleY(d.y);
  const color = REGION_COLORS[d.region];

  scatterSvg += `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${color}" fill-opacity="0.75" stroke="#fff" stroke-width="1">`;
  scatterSvg += `<title>${d.name}：出生率${d.x} 婚姻年齢${d.y}歳</title></circle>`;

  if (labelPoints.includes(d.name)) {
    const anchor = d.x > avgX ? "start" : "end";
    const offset = d.x > avgX ? 8 : -8;
    scatterSvg += `<text x="${cx + offset}" y="${cy - 8}" text-anchor="${anchor}" font-size="8" fill="#374151">${d.name}</text>`;
  }
}

// Axis labels
scatterSvg += `<text x="${SW/2}" y="${SH - 10}" text-anchor="middle" font-size="11" fill="#6b7280">合計特殊出生率</text>`;
scatterSvg += `<text x="16" y="${MARGIN.top + plotH/2}" text-anchor="middle" font-size="11" fill="#6b7280" transform="rotate(-90,16,${MARGIN.top + plotH/2})">平均婚姻年齢（歳）</text>`;

// Legend
const legendRegions = Object.entries(REGION_COLORS);
let lx = MARGIN.left + 20;
const ly = SH - 28;
for (const [name, color] of legendRegions) {
  scatterSvg += `<circle cx="${lx}" cy="${ly}" r="5" fill="${color}" fill-opacity="0.75"/>`;
  scatterSvg += `<text x="${lx + 8}" y="${ly + 4}" font-size="9" fill="#6b7280">${name}</text>`;
  lx += name.length * 9 + 25;
}

scatterSvg += `</svg>`;
writeFileSync(`${OUT_DIR}/fertility-vs-marriage-age-scatter.svg`, scatterSvg);
console.log("✓ fertility-vs-marriage-age-scatter.svg");

// ── 4. 時系列折れ線 ────────────────────────────────────────
const LW = 680, LH = 420;
const LM = { top: 55, right: 25, bottom: 50, left: 55 };
const lpW = LW - LM.left - LM.right;
const lpH = LH - LM.top - LM.bottom;

const years = timeseries.map(t => parseInt(t.year_code));
const vals = timeseries.map(t => t.avg_val);
const yearMin = Math.min(...years);
const yearMax = Math.max(...years);
const valMin = Math.floor(Math.min(...vals) * 10) / 10 - 0.1;
const valMax = Math.ceil(Math.max(...vals) * 10) / 10 + 0.1;

function tlx(y) { return LM.left + ((y - yearMin) / (yearMax - yearMin)) * lpW; }
function tly(v) { return LM.top + ((valMax - v) / (valMax - valMin)) * lpH; }

let lineSvg = `<svg width="${LW}" height="${LH}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LW} ${LH}" font-family="${FONT}" role="img" aria-label="合計特殊出生率の推移（全国平均）">`;
lineSvg += `<rect width="${LW}" height="${LH}" fill="#fafafa" rx="8"/>`;
lineSvg += `<text x="${LW/2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" fill="#333">合計特殊出生率の推移（全国平均）</text>`;
lineSvg += `<text x="${LW/2}" y="44" text-anchor="middle" font-size="10" fill="#888">1980〜2023年</text>`;

// Plot area
lineSvg += `<rect x="${LM.left}" y="${LM.top}" width="${lpW}" height="${lpH}" fill="#f9fafb" stroke="#d1d5db"/>`;

// Y grid
for (let v = Math.ceil(valMin * 5) / 5; v <= valMax; v += 0.2) {
  const vr = Math.round(v * 10) / 10;
  const py = tly(vr);
  lineSvg += `<line x1="${LM.left}" y1="${py}" x2="${LM.left + lpW}" y2="${py}" stroke="#e5e7eb" stroke-width="0.5"/>`;
  lineSvg += `<text x="${LM.left - 8}" y="${py + 4}" text-anchor="end" font-size="10" fill="#6b7280">${vr.toFixed(1)}</text>`;
}

// X grid
for (let y = 1980; y <= 2025; y += 5) {
  if (y > yearMax) break;
  const px = tlx(y);
  lineSvg += `<line x1="${px}" y1="${LM.top}" x2="${px}" y2="${LM.top + lpH}" stroke="#e5e7eb" stroke-width="0.5"/>`;
  lineSvg += `<text x="${px}" y="${LM.top + lpH + 16}" text-anchor="middle" font-size="10" fill="#6b7280">${y}</text>`;
}

// 人口置換水準 ライン (2.07)
if (valMax >= 2.07) {
  const repY = tly(2.07);
  lineSvg += `<line x1="${LM.left}" y1="${repY}" x2="${LM.left + lpW}" y2="${repY}" stroke="#dc2626" stroke-dasharray="6,3" opacity="0.5"/>`;
  lineSvg += `<text x="${LM.left + lpW - 5}" y="${repY - 5}" text-anchor="end" font-size="9" fill="#dc2626">人口置換水準 2.07</text>`;
}

// Path
const pathD = timeseries.map((t, i) => {
  const px = tlx(parseInt(t.year_code));
  const py = tly(t.avg_val);
  return `${i === 0 ? "M" : " L"}${px.toFixed(1)},${py.toFixed(1)}`;
}).join("");

lineSvg += `<path d="${pathD}" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linejoin="round"/>`;

// Annotations
// Peak: 1980
const peak1980 = timeseries[0];
const peakX = tlx(parseInt(peak1980.year_code));
const peakY = tly(peak1980.avg_val);
lineSvg += `<circle cx="${peakX}" cy="${peakY}" r="4" fill="#dc2626"/>`;
lineSvg += `<text x="${peakX + 8}" y="${peakY - 5}" font-size="9" fill="#dc2626" font-weight="bold">1980年</text>`;
lineSvg += `<text x="${peakX + 8}" y="${peakY + 7}" font-size="8" fill="#6b7280">${peak1980.avg_val.toFixed(2)}</text>`;

// 2005年 bottom
const idx2005 = timeseries.findIndex(t => t.year_code === "2005");
if (idx2005 >= 0) {
  const b = timeseries[idx2005];
  const bx = tlx(2005);
  const by = tly(b.avg_val);
  lineSvg += `<circle cx="${bx}" cy="${by}" r="4" fill="#0284c7"/>`;
  lineSvg += `<text x="${bx + 8}" y="${by - 5}" font-size="9" fill="#0284c7" font-weight="bold">2005年 底</text>`;
  lineSvg += `<text x="${bx + 8}" y="${by + 7}" font-size="8" fill="#6b7280">${b.avg_val.toFixed(2)}</text>`;
}

// 2015年 recovery
const idx2015 = timeseries.findIndex(t => t.year_code === "2015");
if (idx2015 >= 0) {
  const rv = timeseries[idx2015];
  const rvx = tlx(2015);
  const rvy = tly(rv.avg_val);
  lineSvg += `<circle cx="${rvx}" cy="${rvy}" r="4" fill="#059669"/>`;
  lineSvg += `<text x="${rvx + 8}" y="${rvy - 5}" font-size="9" fill="#059669" font-weight="bold">2015年 回復</text>`;
  lineSvg += `<text x="${rvx + 8}" y="${rvy + 7}" font-size="8" fill="#6b7280">${rv.avg_val.toFixed(2)}</text>`;
}

// 2023年 current
const last = timeseries[timeseries.length - 1];
const lastX = tlx(parseInt(last.year_code));
const lastY = tly(last.avg_val);
lineSvg += `<circle cx="${lastX}" cy="${lastY}" r="4" fill="#dc2626"/>`;
lineSvg += `<text x="${lastX - 8}" y="${lastY - 5}" text-anchor="end" font-size="9" fill="#dc2626" font-weight="bold">2023年 過去最低</text>`;
lineSvg += `<text x="${lastX - 8}" y="${lastY + 7}" text-anchor="end" font-size="8" fill="#6b7280">${last.avg_val.toFixed(2)}</text>`;

// Axis labels
lineSvg += `<text x="${LW/2}" y="${LH - 8}" text-anchor="middle" font-size="11" fill="#6b7280">年</text>`;
lineSvg += `<text x="16" y="${LM.top + lpH/2}" text-anchor="middle" font-size="11" fill="#6b7280" transform="rotate(-90,16,${LM.top + lpH/2})">合計特殊出生率</text>`;

lineSvg += `</svg>`;
writeFileSync(`${OUT_DIR}/fertility-rate-timeseries.svg`, lineSvg);
console.log("✓ fertility-rate-timeseries.svg");

// ── 5. まとめファインディングス ────────────────────────────
const findings = [
  {
    color: "#dc2626",
    title: "東京都が全国ワースト1位（0.99）、初の「1.0割れ」",
    desc: "2位の北海道（1.06）、3位の宮城県（1.07）を引き離し、全国で唯一出生率が1.0を下回った",
  },
  {
    color: "#ea580c",
    title: "沖縄県が17年連続トップ（1.60）だが低下傾向",
    desc: "2位の長崎県・宮崎県（1.49）との差は0.11。沖縄も2015年の1.96から大幅に低下している",
  },
  {
    color: "#0284c7",
    title: "2023年は全国平均1.20──8年連続で低下し過去最低を更新",
    desc: `2015年の1.53をピークに下がり続け、1980年の1.83から43年間で0.63ポイント低下`,
  },
  {
    color: "#7c3aed",
    title: "晩婚化と出生率の負の相関（r = " + r.toFixed(2) + "）",
    desc: "平均婚姻年齢が高い東京（30.7歳）・神奈川（30.3歳）は出生率も低く、早婚の沖縄・島根は高い",
  },
  {
    color: "#059669",
    title: "出生率が高い県は九州・北陸・山陰に集中",
    desc: "上位10県のうち5県が九州、3県が北陸・山陰──地域コミュニティと子育て環境の充実が背景",
  },
];

const FW = 960;
const rowHeight = 64;
const headerH = 56;
const FH = headerH + findings.length * rowHeight + 20;

let findSvg = `<svg width="${FW}" height="${FH}" viewBox="0 0 ${FW} ${FH}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT}" role="img" aria-label="この記事でわかったこと">`;
findSvg += `<rect width="${FW}" height="${FH}" fill="#f9fafb"/>`;
findSvg += `<text x="${FW/2}" y="40" text-anchor="middle" font-size="22" font-weight="bold" fill="#1f2937">この記事でわかったこと</text>`;

findings.forEach((f, i) => {
  const y = headerH + i * rowHeight;
  const bg = i % 2 === 0 ? "#ffffff" : "#f9fafb";
  const cy = y + rowHeight / 2;

  findSvg += `<rect x="60" y="${y}" width="840" height="${rowHeight}" fill="${bg}"/>`;
  findSvg += `<circle cx="100" cy="${cy}" r="16" fill="${f.color}"/>`;
  findSvg += `<text x="100" y="${cy + 6}" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">${i + 1}</text>`;
  findSvg += `<text x="140" y="${cy - 6}" font-size="15" font-weight="bold" fill="#1f2937">${f.title}</text>`;
  findSvg += `<text x="140" y="${cy + 16}" font-size="13" fill="#4b5563">${f.desc}</text>`;
});

findSvg += `</svg>`;
writeFileSync(`${OUT_DIR}/fertility-summary-findings.svg`, findSvg);
console.log("✓ fertility-summary-findings.svg");

// ── 6. JSON データ ─────────────────────────────────────────
const allData = {
  "total-fertility-rate": {
    categoryName: "合計特殊出生率",
    year: "2023年",
    unit: "‐",
    data: tfr,
  },
  "crude-birth-rate": {
    categoryName: "粗出生率",
    year: "2023年",
    unit: "‐",
    data: cbrData,
  },
  "marriages-per-total-population": {
    categoryName: "婚姻率",
    year: "2022年",
    unit: "‐",
    data: marriageData,
  },
  "average-age-of-first-marriage-wife": {
    categoryName: "平均婚姻年齢（初婚の妻）",
    year: "2023年",
    unit: "歳",
    data: mageData,
  },
  timeseries: {
    categoryName: "合計特殊出生率（全国平均推移）",
    data: timeseries.map(t => ({
      year: t.year_code,
      value: Math.round(t.avg_val * 10000) / 10000,
    })),
  },
};

writeFileSync(`${OUT_DIR}/all-data.json`, JSON.stringify(allData, null, 2));
console.log("✓ all-data.json");

db.close();
console.log("\nAll charts generated successfully.");
