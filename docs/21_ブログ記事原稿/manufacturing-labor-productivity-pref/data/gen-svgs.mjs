import fs from "node:fs";
import path from "node:path";

const DIR = path.dirname(new URL(import.meta.url).pathname);

// dark/light 両対応の fill: 上位=青系 / 下位=橙系。背景非依存の中明度色 (両モードで視認可)。
const TOP_FILL = "#2563eb"; // blue-600
const BOTTOM_FILL = "#ea580c"; // orange-600
const AXIS = "#94a3b8"; // slate-400 — light/dark どちらでも視認できる中間色

function barChart({ title, subtitle, unit, rows, outfile, valueFmt }) {
  // rows: [{name, value, group:'top'|'bottom', rank}]
  const W = 760;
  const rowH = 38;
  const padTop = 70;
  const padBottom = 30;
  const labelW = 96; // 県名 + rank
  const valueW = 90;
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

  // 上位/下位の境界線
  const firstBottom = rows.findIndex((r) => r.group === "bottom");
  let divider = "";
  if (firstBottom > 0) {
    const dy = padTop + firstBottom * rowH;
    divider = `<line x1="0" y1="${dy}" x2="${W}" y2="${dy}" stroke="${AXIS}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />`;
  }

  // dark/light 両対応: テキストは @media (prefers-color-scheme:dark) で明色に切替える。
  // 棒の色 (青/橙) は両モードで視認可のため不変。
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
    { name: "鳥取", rank: 45, value: 8441, group: "bottom" },
    { name: "高知", rank: 46, value: 6015, group: "bottom" },
    { name: "沖縄", rank: 47, value: 4599, group: "bottom" },
    { name: "島根", rank: 44, value: 12866, group: "bottom" },
    { name: "秋田", rank: 43, value: 14057, group: "bottom" },
  ].sort((a, b) =>
    a.group === b.group ? a.rank - b.rank : a.group === "top" ? -1 : 1
  ),
});

// ── 2. 1人あたり出荷額（万円/人・本文に値が明示された主要県のみ）──
// 上位4県（値あり）＋出荷王の愛知（5位）＋最下位の沖縄。すべて本文記載値。
// 派生指標のため値が確定しているのはこの 5 県のみ (捏造禁止)。
barChart({
  title: "製造業 1人あたり出荷額（2021年）",
  subtitle: "本文で値を示した主要県（製造品出荷額÷従業者数の派生指標）",
  unit: "万円/人",
  valueFmt: (v) => `${v.toLocaleString()}`,
  outfile: "manufacturing-productivity-prefecture-rankings.svg",
  rows: [
    { name: "大分", rank: 1, value: 7308, group: "top" },
    { name: "山口", rank: 2, value: 7048, group: "top" },
    { name: "千葉", rank: 3, value: 6357, group: "top" },
    { name: "愛知", rank: 5, value: 5930, group: "top" },
    { name: "沖縄", rank: 47, value: 2001, group: "bottom" },
  ],
});
