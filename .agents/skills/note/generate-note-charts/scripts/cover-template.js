/**
 * note.com カバー画像テンプレート (1280×670)
 *
 * 使い方:
 *   1. このファイルを記事の images/ にコピー
 *   2. // CUSTOMIZE: コメントの箇所を記事に合わせて編集
 *   3. node generate-cover.js で SVG 生成
 *   4. svg-to-png.js で PNG 変換（density: 72 → 等倍 1280×670）
 *
 * レイアウト:
 *   左側 (x: 60-500): テキスト（サブタイトル、タイトル、説明、本文、ブランド）
 *   右側 (x: 560-):   ミニチャート（散布図・棒グラフ等）
 */
const fs = require('fs');
const path = require('path');

const W = 1280, H = 670;

// ====================================================================
// CUSTOMIZE: テキスト内容
// ====================================================================
const subtitle = '47都道府県「稼ぐ力」と「借金」の比較';
const titleLines = ['財政力7位なのに', '借金1位？'];
const descLines = ['財政力指数 × 地方債現在高比率', 'のギャップを可視化'];
const bodyLines = [
  '静岡県の逆説：稼ぐ力は全国上位、',
  'しかし借金は全国で最も多い。',
  '3つの構造パターンで読み解く。',
];
const accentColor = '#f97316'; // オレンジ

// ====================================================================
// CUSTOMIZE: ミニチャート用データ（散布図の場合）
// ====================================================================
const chartData = [
  // { name, x, y, color, isKey }
  // isKey: true でラベル表示＆大きいドット
  { name: '東京', x: 1.064, y: 41.6, color: '#3b82f6', isKey: true },
  { name: '静岡', x: 0.677, y: 208.5, color: '#f97316', isKey: true },
  { name: '新潟', x: 0.451, y: 205.1, color: '#ef4444', isKey: true },
  { name: '沖縄', x: 0.360, y: 61.9, color: '#22c55e', isKey: true },
  { name: '栃木', x: 0.610, y: 117.7, color: '#8b5cf6', isKey: true },
  { name: '秋田', x: 0.309, y: 193.7, color: '#ef4444', isKey: true },
  // 非キー（グレー、ラベルなし）は省略可。数が多いほどリッチだがSVGサイズ増加
];

// ====================================================================
// CUSTOMIZE: チャート軸範囲
// ====================================================================
const chartX = 560, chartY = 60, chartW = 660, chartH = 540;
const xMin = 0.2, xMax = 1.1, yMin = 20, yMax = 220;

// ====================================================================
// CUSTOMIZE: キーラベル配置（重なり回避用）
// ====================================================================
const labelOffsets = {
  '東京': { dx: -6, dy: -8, anchor: 'end' },
  '静岡': { dx: 6, dy: -8, anchor: 'start' },
  '新潟': { dx: -6, dy: -6, anchor: 'end' },
  '沖縄': { dx: 6, dy: 4, anchor: 'start' },
  '栃木': { dx: 6, dy: -6, anchor: 'start' },
  '秋田': { dx: 6, dy: 4, anchor: 'start' },
};

// ====================================================================
// 以下は基本的に変更不要（テキストレイアウトとチャート描画）
// ====================================================================

function scaleX(v) { return chartX + (v - xMin) / (xMax - xMin) * chartW; }
function scaleY(v) { return chartY + chartH - (v - yMin) / (yMax - yMin) * chartH; }

let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<style>
  text { font-family: 'Hiragino Sans', 'Noto Sans JP', sans-serif; }
</style>
<rect width="${W}" height="${H}" fill="#fafafa"/>

<!-- Left side: text -->
<line x1="60" y1="120" x2="60" y2="170" stroke="${accentColor}" stroke-width="4" stroke-linecap="round"/>
<text x="80" y="148" font-size="16" fill="#475569" font-weight="500">${subtitle}</text>
`;

// Title
let ty = 220;
for (const line of titleLines) {
  svg += `<text x="80" y="${ty}" font-size="36" font-weight="bold" fill="#1e293b">${line}</text>\n`;
  ty += 48;
}

// Description
ty += 14;
for (const line of descLines) {
  svg += `<text x="80" y="${ty}" font-size="22" fill="#334155" font-weight="500">${line}</text>\n`;
  ty += 32;
}

// Body
ty += 26;
for (const line of bodyLines) {
  svg += `<text x="80" y="${ty}" font-size="16" fill="#64748b">${line}</text>\n`;
  ty += 26;
}

// Branding
svg += `<text x="80" y="560" font-size="14" fill="#94a3b8">stats47.jp</text>

<!-- Right side: mini chart -->
<rect x="${chartX - 10}" y="${chartY - 10}" width="${chartW + 30}" height="${chartH + 30}" rx="8" fill="white" fill-opacity="0.5"/>

<!-- Axis labels -->
<text x="${chartX + chartW / 2}" y="${chartY + chartH + 22}" text-anchor="middle" font-size="11" fill="#94a3b8">財政力指数 →</text>
<text x="${chartX - 6}" y="${chartY + chartH / 2}" text-anchor="middle" font-size="11" fill="#94a3b8" transform="rotate(-90, ${chartX - 6}, ${chartY + chartH / 2})">地方債比率 →</text>

<!-- Grid -->`;

for (let v = xMin + 0.2; v <= xMax; v += 0.2) {
  svg += `\n<line x1="${scaleX(v).toFixed(1)}" y1="${chartY}" x2="${scaleX(v).toFixed(1)}" y2="${chartY + chartH}" stroke="#f1f5f9" stroke-width="0.5"/>`;
}
for (let v = yMin + 50; v <= yMax; v += 50) {
  svg += `\n<line x1="${chartX}" y1="${scaleY(v).toFixed(1)}" x2="${chartX + chartW}" y2="${scaleY(v).toFixed(1)}" stroke="#f1f5f9" stroke-width="0.5"/>`;
}

// Data points
svg += `\n\n<!-- Data points -->`;
for (const d of chartData) {
  const x = scaleX(d.x);
  const y = scaleY(d.y);
  const r = d.isKey ? 6 : 4;
  const opacity = d.color === '#94a3b8' ? 0.4 : 0.8;

  svg += `\n<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${d.color}" opacity="${opacity}"/>`;

  if (d.isKey && labelOffsets[d.name]) {
    const off = labelOffsets[d.name];
    svg += `\n<text x="${(x + off.dx).toFixed(1)}" y="${(y + off.dy).toFixed(1)}" text-anchor="${off.anchor}" font-size="12" font-weight="bold" fill="${d.color}">${d.name}</text>`;
  }
}

svg += `\n</svg>\n`;

fs.writeFileSync(path.join(__dirname, 'cover.svg'), svg);
console.log('Cover SVG generated: cover.svg');
