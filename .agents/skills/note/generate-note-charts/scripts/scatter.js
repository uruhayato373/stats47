/**
 * 散布図 SVG 生成スクリプト
 *
 * 使い方:
 *   node scatter.js <config.json> <output.svg>
 *
 * config.json の書式:
 * {
 *   "title": "財政力指数 × 地方債現在高比率（2022年度）",
 *   "size": [600, 540],
 *   "margin": { "top": 40, "right": 30, "bottom": 55, "left": 65 },
 *   "xAxis": {
 *     "label": "財政力指数 →高いほど「稼ぐ力」が強い",
 *     "min": 0.2, "max": 1.1, "step": 0.1,
 *     "format": "fixed1"          // "fixed1" | "fixed0" | "percent" | "integer"
 *   },
 *   "yAxis": {
 *     "label": "地方債現在高比率 →高いほど借金が重い",
 *     "min": 20, "max": 220, "step": 50,
 *     "format": "percent"
 *   },
 *   "data": [
 *     { "name": "東京", "x": 1.064, "y": 41.6 },
 *     ...
 *   ],
 *   "highlights": [
 *     {
 *       "names": ["東京", "神奈川", "大阪", "千葉"],
 *       "color": "#3b82f6",
 *       "label": "優等生（稼げて借金少）"
 *     }
 *   ],
 *   "labelOffsets": {
 *     "東京": { "dx": -8, "dy": -10, "anchor": "end" }
 *   },
 *   "zoneLabels": [
 *     { "text": "二重苦", "position": "top-left", "color": "#fca5a5" },
 *     { "text": "投資型", "position": "top-right", "color": "#fdba74" },
 *     { "text": "優等生", "position": "bottom-right", "color": "#93c5fd" }
 *   ]
 * }
 */
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(process.argv[2]);
const outputPath = path.resolve(process.argv[3]);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// --- Dimensions ---
const [W, H] = config.size || [600, 540];
const margin = config.margin || { top: 40, right: 30, bottom: 55, left: 65 };
const plotW = W - margin.left - margin.right;
const plotH = H - margin.top - margin.bottom;

// --- Axes ---
const xAxis = config.xAxis;
const yAxis = config.yAxis;

function scaleX(v) {
  return margin.left + (v - xAxis.min) / (xAxis.max - xAxis.min) * plotW;
}
function scaleY(v) {
  return margin.top + plotH - (v - yAxis.min) / (yAxis.max - yAxis.min) * plotH;
}

function formatTick(value, fmt) {
  switch (fmt) {
    case 'fixed1': return value.toFixed(1);
    case 'fixed0': return value.toFixed(0);
    case 'percent': return value + '%';
    case 'integer': return String(Math.round(value));
    default: return String(value);
  }
}

// --- Build highlight map ---
const highlightMap = {}; // name -> { color }
const legendItems = [];
for (const group of (config.highlights || [])) {
  legendItems.push({ label: group.label, color: group.color });
  for (const name of group.names) {
    highlightMap[name] = { color: group.color };
  }
}

const labelOffsets = config.labelOffsets || {};

// --- SVG assembly ---
let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>
  text { font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif; }
</style>
<rect width="${W}" height="${H}" fill="#fafafa"/>

<!-- Title -->
<text x="${W / 2}" y="22" text-anchor="middle" font-size="15" font-weight="bold" fill="#1e293b">${config.title}</text>

<!-- Plot background -->
<rect x="${margin.left}" y="${margin.top}" width="${plotW}" height="${plotH}" fill="white" stroke="#e2e8f0"/>

<!-- Grid lines -->`;

// X grid lines
for (let v = xAxis.min + xAxis.step; v < xAxis.max; v += xAxis.step) {
  v = Math.round(v * 1000) / 1000; // float fix
  const x = scaleX(v);
  svg += `\n<line x1="${x.toFixed(1)}" y1="${margin.top}" x2="${x.toFixed(1)}" y2="${margin.top + plotH}" stroke="#f1f5f9"/>`;
}

// Y grid lines
for (let v = yAxis.min + yAxis.step; v < yAxis.max; v += yAxis.step) {
  const y = scaleY(v);
  svg += `\n<line x1="${margin.left}" y1="${y.toFixed(1)}" x2="${margin.left + plotW}" y2="${y.toFixed(1)}" stroke="#f1f5f9"/>`;
}

// X axis tick labels
svg += `\n\n<!-- X axis -->`;
for (let v = xAxis.min + xAxis.step; v <= xAxis.max - xAxis.step / 2; v += xAxis.step) {
  v = Math.round(v * 1000) / 1000;
  const x = scaleX(v);
  svg += `\n<text x="${x.toFixed(1)}" y="${margin.top + plotH + 18}" text-anchor="middle" font-size="11" fill="#64748b">${formatTick(v, xAxis.format)}</text>`;
}
svg += `\n<text x="${margin.left + plotW / 2}" y="${H - 8}" text-anchor="middle" font-size="12" fill="#475569">${xAxis.label}</text>`;

// Y axis tick labels
svg += `\n\n<!-- Y axis -->`;
for (let v = yAxis.min + yAxis.step; v <= yAxis.max - yAxis.step / 2; v += yAxis.step) {
  const y = scaleY(v);
  svg += `\n<text x="${margin.left - 8}" y="${y.toFixed(1)}" text-anchor="end" dominant-baseline="central" font-size="11" fill="#64748b">${formatTick(v, yAxis.format)}</text>`;
}
// Rotated Y label
const yMid = margin.top + plotH / 2;
svg += `\n<text x="16" y="${yMid}" text-anchor="middle" dominant-baseline="central" font-size="12" fill="#475569" transform="rotate(-90, 16, ${yMid})">${yAxis.label}</text>`;

// Zone labels (optional)
if (config.zoneLabels) {
  svg += `\n\n<!-- Zone labels -->`;
  for (const z of config.zoneLabels) {
    let tx, ty, anchor;
    switch (z.position) {
      case 'top-left':
        tx = margin.left + 12; ty = margin.top + 18; anchor = 'start'; break;
      case 'top-right':
        tx = margin.left + plotW - 8; ty = margin.top + 18; anchor = 'end'; break;
      case 'bottom-left':
        tx = margin.left + 12; ty = margin.top + plotH - 8; anchor = 'start'; break;
      case 'bottom-right':
        tx = margin.left + plotW - 8; ty = margin.top + plotH - 8; anchor = 'end'; break;
    }
    svg += `\n<text x="${tx}" y="${ty}" text-anchor="${anchor}" font-size="11" fill="${z.color}" opacity="0.7">${z.text}</text>`;
  }
}

// Gray dots (non-highlighted)
svg += `\n\n<!-- Gray dots -->`;
config.data.forEach(d => {
  if (!highlightMap[d.name]) {
    const x = scaleX(d.x);
    const y = scaleY(d.y);
    svg += `\n<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#cbd5e1" opacity="0.6"/>`;
  }
});

// Highlighted dots and labels
svg += `\n\n<!-- Highlighted dots and labels -->`;
config.data.forEach(d => {
  const h = highlightMap[d.name];
  if (!h) return;
  const x = scaleX(d.x);
  const y = scaleY(d.y);
  const off = labelOffsets[d.name] || { dx: 8, dy: -8, anchor: 'start' };

  svg += `\n<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${h.color}" opacity="0.85"/>`;
  svg += `\n<text x="${(x + off.dx).toFixed(1)}" y="${(y + off.dy).toFixed(1)}" text-anchor="${off.anchor}" font-size="10.5" font-weight="bold" fill="${h.color}">${d.name}</text>`;
});

// Legend
if (legendItems.length > 0) {
  const legendX = margin.left + 8;
  const legendY = margin.top + plotH - (legendItems.length * 16 + 8) - 4;

  svg += `\n\n<!-- Legend -->`;
  svg += `\n<rect x="${legendX}" y="${legendY}" width="175" height="${legendItems.length * 16 + 8}" rx="4" fill="white" fill-opacity="0.85" stroke="#e2e8f0"/>`;
  legendItems.forEach((g, i) => {
    const ly = legendY + 14 + i * 16;
    svg += `\n<circle cx="${legendX + 12}" cy="${ly}" r="4" fill="${g.color}"/>`;
    svg += `\n<text x="${legendX + 22}" y="${ly}" dominant-baseline="central" font-size="10" fill="#475569">${g.label}</text>`;
  });
}

svg += `\n</svg>\n`;

fs.writeFileSync(outputPath, svg);
console.log(`Generated: ${outputPath} (${(svg.length / 1024).toFixed(1)} KB)`);
