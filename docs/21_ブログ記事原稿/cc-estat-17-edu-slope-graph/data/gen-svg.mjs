import { writeFileSync } from "node:fs";

// 値は article 本文に明記された順位差 (delta = rank2013 - rank2023) のみ。捏造なし。
// 上昇 (青系) = 順位を上げた県 / 下降 (橙系) = 順位を下げた県。
const risers = [
  { pref: "高知", delta: 17, from: 42, to: 25 },
  { pref: "沖縄", delta: 9, from: 47, to: 38 },
  { pref: "鹿児島", delta: 8, from: 38, to: 30 },
  { pref: "大分", delta: 7, from: 35, to: 28 },
];
const fallers = [
  { pref: "富山", delta: -10, from: 8, to: 18 },
  { pref: "静岡", delta: -8, from: 25, to: 33 },
  { pref: "群馬", delta: -7, from: 19, to: 26 },
];
// 上昇県は delta 大きい順、下降県は delta 小さい順 (落差大きい順) に上から並べる
const rows = [...risers, ...fallers];

const W = 720;
const rowH = 46;
const padTop = 64;
const padBottom = 28;
const H = padTop + rows.length * rowH + padBottom;
const labelW = 150; // 左の県名ラベル領域
const centerX = labelW + 70; // delta=0 の基準線 x
const scale = 16; // 1ランクあたり px

const blue = "#2563eb"; // 上昇 (青系)
const orange = "#ea580c"; // 下降 (橙系)
const axis = "#94a3b8";
const text = "#334155";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

let bars = "";
rows.forEach((r, i) => {
  const cy = padTop + i * rowH + rowH / 2;
  const w = Math.abs(r.delta) * scale;
  const isUp = r.delta > 0;
  const fill = isUp ? blue : orange;
  const x = isUp ? centerX : centerX - w;
  const sign = isUp ? "+" : "";
  // バー
  bars += `<rect x="${x.toFixed(1)}" y="${(cy - 13).toFixed(1)}" width="${w.toFixed(1)}" height="26" rx="3" fill="${fill}"><title>${esc(r.pref)}：2013年${r.from}位 → 2023年${r.to}位 (順位差 ${sign}${r.delta})</title></rect>`;
  // 県名 (左)
  bars += `<text x="${labelW - 10}" y="${(cy + 5).toFixed(1)}" text-anchor="end" font-size="16" font-weight="600" fill="${text}" font-family="system-ui,-apple-system,sans-serif">${esc(r.pref)}</text>`;
  // delta ラベル (バー端)
  const lx = isUp ? x + w + 8 : x - 8;
  const lanchor = isUp ? "start" : "end";
  bars += `<text x="${lx.toFixed(1)}" y="${(cy + 5).toFixed(1)}" text-anchor="${lanchor}" font-size="14" font-weight="700" fill="${fill}" font-family="system-ui,-apple-system,sans-serif">${sign}${r.delta}</text>`;
  // from→to (バー上、薄字)
  bars += `<text x="${(centerX + (isUp ? -6 : 6)).toFixed(1)}" y="${(cy + 5).toFixed(1)}" text-anchor="${isUp ? "end" : "start"}" font-size="11" fill="#64748b" font-family="system-ui,-apple-system,sans-serif">${r.from}→${r.to}位</text>`;
});

// 0 基準線
const axisLine = `<line x1="${centerX}" y1="${padTop - 8}" x2="${centerX}" y2="${H - padBottom + 6}" stroke="${axis}" stroke-width="1.5" stroke-dasharray="3 3" />`;
const axisLabel = `<text x="${centerX}" y="${padTop - 16}" text-anchor="middle" font-size="11" fill="#64748b" font-family="system-ui,-apple-system,sans-serif">0 (変化なし)</text>`;

const title = `<text x="24" y="34" font-size="18" font-weight="700" fill="${text}" font-family="system-ui,-apple-system,sans-serif">全国学力テスト・中3数学 順位の10年変化 (2013→2023)</text>`;
const legend =
  `<text x="${W - 24}" y="34" text-anchor="end" font-size="12" font-family="system-ui,-apple-system,sans-serif">` +
  `<tspan fill="${blue}" font-weight="700">■上昇</tspan>` +
  `<tspan fill="#64748b"> / </tspan>` +
  `<tspan fill="${orange}" font-weight="700">■下降</tspan></text>`;

const svg = `<!-- data-source: edu-slope-rank.json | generated: ${new Date().toISOString()} -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="全国学力テスト 中3数学の順位 10年変化 横棒グラフ">
<rect x="0" y="0" width="${W}" height="${H}" fill="none" />
${title}
${legend}
${axisLabel}
${axisLine}
${bars}
</svg>
`;

writeFileSync(new URL("./edu-slope-rank.svg", import.meta.url), svg);
console.log("wrote edu-slope-rank.svg", H, "px tall");
