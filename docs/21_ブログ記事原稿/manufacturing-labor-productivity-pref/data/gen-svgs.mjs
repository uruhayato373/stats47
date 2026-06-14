import fs from "node:fs";
import path from "node:path";

import { fileURLToPath } from "node:url";
const DIR = path.dirname(fileURLToPath(import.meta.url));

// dark/light 両対応の fill: 上位=青系 / 下位=橙系。背景非依存の中明度色 (両モードで視認可)。
const TOP_FILL = "#2563eb"; // blue-600
const BOTTOM_FILL = "#ea580c"; // orange-600
const AXIS = "#94a3b8"; // slate-400 — light/dark どちらでも視認できる中間色

// ── 全 47 県の実データ (R2 ground truth, 2021年) ──
// shipment: app/ranking/manufacturing-shipment-amount/values.json (百万円)
// employees: app/ranking/manufacturing-employees/values.json (人)
// productivity(万円/人) = shipment_百万円 * 100 / employees  ← 派生計算 (両 R2 実値から算出)
// data/manufacturing-shipment-productivity.json に保存済み (factual-check 参照用)
const ALL = JSON.parse(
  fs.readFileSync(path.join(DIR, "manufacturing-shipment-productivity.json"), "utf8")
).data;

function barChart({ title, subtitle, unit, rows, outfile, valueFmt }) {
  const W = 760;
  const rowH = 38;
  const padTop = 70;
  const padBottom = 30;
  const labelW = 110;
  const valueW = 96;
  const chartLeft = labelW + 16;
  const chartRight = W - valueW - 16;
  const chartW = chartRight - chartLeft;
  const H = padTop + rows.length * rowH + padBottom + 16;
  const maxVal = Math.max(...rows.map((r) => r.value));

  let bars = "";
  rows.forEach((r, i) => {
    const y = padTop + i * rowH;
    const barY = y + 6;
    const barH = rowH - 14;
    const w = Math.max(2, (r.value / maxVal) * chartW);
    const fill = r.group === "top" ? TOP_FILL : BOTTOM_FILL;
    const valLabel = valueFmt(r.value);
    bars += `
    <g>
      <text class="svg-label" x="${labelW}" y="${barY + barH / 2 + 5}" text-anchor="end" font-size="15" font-weight="600">${r.rank}位 ${r.name}</text>
      <rect x="${chartLeft}" y="${barY}" width="${w}" height="${barH}" rx="2" fill="${fill}" />
      <text class="svg-value" x="${chartLeft + w + 8}" y="${barY + barH / 2 + 5}" text-anchor="start" font-size="14" font-weight="700">${valLabel}</text>
    </g>`;
  });

  const firstBottom = rows.findIndex((r) => r.group === "bottom");
  let divider = "";
  if (firstBottom > 0) {
    const dy = padTop + firstBottom * rowH;
    divider = `<line x1="0" y1="${dy}" x2="${W}" y2="${dy}" stroke="${AXIS}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />`;
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}">
  <style>
    .svg-title { fill: #0f172a; }
    .svg-sub   { fill: #475569; }
    .svg-label { fill: #334155; }
    .svg-value { fill: #1e293b; }
    @media (prefers-color-scheme: dark) {
      .svg-title { fill: #f1f5f9; }
      .svg-sub   { fill: #cbd5e1; }
      .svg-label { fill: #e2e8f0; }
      .svg-value { fill: #f1f5f9; }
    }
  </style>
  <title>${title}</title>
  <desc>${subtitle}（単位: ${unit}）。上位を青、下位を橙で表示。</desc>
  <text class="svg-title" x="20" y="30" font-size="18" font-weight="700">${title}</text>
  <text class="svg-sub" x="20" y="52" font-size="13">${subtitle}（単位: ${unit}）</text>
  ${divider}
  ${bars}
</svg>
`;
  fs.writeFileSync(path.join(DIR, outfile), svg);
  console.log("wrote", outfile, `(${rows.length} bars)`);
}

// ── 1. 製造品出荷額（億円・上位5+下位5、R2 ground truth）──
barChart({
  title: "製造品出荷額ランキング（2021年）",
  subtitle: "上位5県・下位5県の製造品出荷額等",
  unit: "億円",
  valueFmt: (v) => `${(v / 10000).toFixed(1)}兆円`,
  outfile: "manufacturing-shipment-prefecture-rankings.svg",
  rows: [
    { name: "愛知", rank: 1, value: 478946, group: "top" },
    { name: "大阪", rank: 2, value: 186058, group: "top" },
    { name: "神奈川", rank: 3, value: 173752, group: "top" },
    { name: "静岡", rank: 4, value: 172905, group: "top" },
    { name: "兵庫", rank: 5, value: 165023, group: "top" },
    { name: "秋田", rank: 43, value: 14057, group: "bottom" },
    { name: "島根", rank: 44, value: 12866, group: "bottom" },
    { name: "鳥取", rank: 45, value: 8441, group: "bottom" },
    { name: "高知", rank: 46, value: 6015, group: "bottom" },
    { name: "沖縄", rank: 47, value: 4599, group: "bottom" },
  ],
});

// ── 2. 1人あたり出荷額（万円/人・上位5+下位5、47県派生計算から）──
const prodSorted = [...ALL].sort((a, b) => a.prodRank - b.prodRank);
const top5 = prodSorted.slice(0, 5);
const bottom5 = prodSorted.slice(-5);
barChart({
  title: "製造業の労働生産性ランキング（2021年）",
  subtitle: "従業者1人あたり製造品出荷額 上位5県・下位5県",
  unit: "万円/人",
  valueFmt: (v) => `${Math.round(v).toLocaleString()}`,
  outfile: "manufacturing-productivity-prefecture-rankings.svg",
  rows: [
    ...top5.map((r) => ({
      name: r.areaName.replace(/[都府県]$/, ""),
      rank: r.prodRank,
      value: r.productivity,
      group: "top",
    })),
    ...bottom5.map((r) => ({
      name: r.areaName.replace(/[都府県]$/, ""),
      rank: r.prodRank,
      value: r.productivity,
      group: "bottom",
    })),
  ],
});

// ── 3. 散布図: x=出荷額(兆円) × y=生産性(万円/人) 全47県 (archetype B) ──
function scatter({ outfile }) {
  const W = 680, H = 470;
  const m = { t: 50, r: 24, b: 84, l: 64 };
  const plotW = W - m.l - m.r;
  const plotH = H - m.t - m.b;
  const xs = ALL.map((d) => d.shipmentOku / 10000); // 兆円
  const ys = ALL.map((d) => d.productivity); // 万円/人
  const xMax = Math.ceil(Math.max(...xs) / 5) * 5; // 0..50
  const yMin = 1500, yMax = 7500;
  const sx = (x) => m.l + (x / xMax) * plotW;
  const sy = (y) => m.t + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // x grid (兆円)
  let grid = "";
  for (let gx = 0; gx <= xMax; gx += 10) {
    const px = sx(gx);
    grid += `<line x1="${px.toFixed(1)}" y1="${m.t}" x2="${px.toFixed(1)}" y2="${m.t + plotH}" class="svg-grid" stroke-width="0.5"/><text x="${px.toFixed(1)}" y="${m.t + plotH + 18}" text-anchor="middle" font-size="10" class="svg-tick">${gx}</text>`;
  }
  // y grid (万円/人)
  for (let gy = 2000; gy <= 7000; gy += 1000) {
    const py = sy(gy);
    grid += `<line x1="${m.l}" y1="${py.toFixed(1)}" x2="${m.l + plotW}" y2="${py.toFixed(1)}" class="svg-grid" stroke-width="0.5"/><text x="${m.l - 8}" y="${(py + 3).toFixed(1)}" text-anchor="end" font-size="10" class="svg-tick">${gy.toLocaleString()}</text>`;
  }

  const HILIGHT = { 大分県: "#dc2626", 愛知県: "#2563eb", 千葉県: "#16a34a", 沖縄県: "#ea580c" };
  let dots = "", labels = "";
  ALL.forEach((d) => {
    const x = sx(d.shipmentOku / 10000), y = sy(d.productivity);
    const hl = HILIGHT[d.areaName];
    const r = hl ? 6 : 4;
    const fill = hl || "#64748b";
    const op = hl ? "0.95" : "0.6";
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" fill-opacity="${op}" stroke="#fff" stroke-width="0.8"/>`;
    if (hl) {
      const nm = d.areaName.replace(/[都府県]$/, "");
      // ラベル位置を点ごとに調整 (重なり回避)
      let dx = 9, dy = 4, anchor = "start";
      if (d.areaName === "愛知県") { dx = 9; dy = -8; }
      if (d.areaName === "沖縄県") { dx = 9; dy = 4; }
      if (d.areaName === "千葉県") { dx = -9; dy = -8; anchor = "end"; }
      labels += `<text x="${(x + dx).toFixed(1)}" y="${(y + dy).toFixed(1)}" text-anchor="${anchor}" font-size="12" font-weight="700" fill="${hl}">${nm}</text>`;
    }
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="'Hiragino Sans','Noto Sans JP',sans-serif" role="img" aria-label="製造品出荷額(総額)と労働生産性(1人あたり)の相関 47都道府県 2021年">
  <style>
    .svg-bg{fill:#fafafa}
    .svg-title{fill:#0f172a}
    .svg-subtitle{fill:#475569}
    .svg-grid{stroke:#e5e7eb}
    .svg-tick{fill:#64748b}
    @media (prefers-color-scheme:dark){
      .svg-bg{fill:#1f2937}
      .svg-title{fill:#f1f5f9}
      .svg-subtitle{fill:#cbd5e1}
      .svg-grid{stroke:#374151}
      .svg-tick{fill:#9ca3af}
    }
  </style>
  <title>製造業 出荷額(総額) × 労働生産性(1人あたり) の散布図（47都道府県・2021年）</title>
  <desc>横軸=製造品出荷額(兆円)、縦軸=従業者1人あたり出荷額(万円/人)。総額が中位でも生産性が高い大分が左上の外れ値、総額1位の愛知が右側に位置する。両者の相関は弱い。</desc>
  <rect width="${W}" height="${H}" class="svg-bg" rx="8"/>
  <text x="${W / 2}" y="28" text-anchor="middle" font-size="16" font-weight="bold" class="svg-title">出荷額(総額) × 労働生産性(1人あたり) の相関（47都道府県・2021年）</text>
  <rect x="${m.l}" y="${m.t}" width="${plotW}" height="${plotH}" class="svg-bg" stroke="#d1d5db" stroke-width="0.5"/>
  ${grid}
  ${dots}
  ${labels}
  <text x="${m.l + plotW / 2}" y="${H - 36}" text-anchor="middle" font-size="11" class="svg-subtitle">製造品出荷額 = 総額の大きさ (兆円)</text>
  <text x="18" y="${m.t + plotH / 2}" text-anchor="middle" font-size="11" class="svg-subtitle" transform="rotate(-90 18 ${m.t + plotH / 2})">労働生産性 = 1人あたり出荷額 (万円/人)</text>
  <text x="${m.l}" y="${H - 14}" font-size="10" class="svg-subtitle">■ 大分=総額中位×生産性1位の外れ値　■ 愛知=総額1位×生産性5位　■ 千葉=規模と効率を両立　■ 沖縄=最下位</text>
</svg>
`;
  fs.writeFileSync(path.join(DIR, outfile), svg);
  console.log("wrote", outfile, "(47 points)");
}
scatter({ outfile: "shipment-productivity-scatter.svg" });
