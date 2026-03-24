/**
 * タイルグリッドコロプレスマップ SVG 生成
 *
 * 47 都道府県を固定レイアウトのタイルに配置し、値に応じてセルを
 * 赤系グラデーションで着色する。タイル位置は地理的配置に近い形で固定。
 *
 * ## 使い方
 * ```ts
 * import { toChoroplethItems } from "../shared/stats-schema";
 * const items = toChoroplethItems(statsSchemaData);
 * const svg = generateChoroplethSvg(items, {
 *   title: "交通事故死者数（人口10万人あたり）2023年度",
 *   unit: "人",
 * });
 * ```
 */

import { FONT_FAMILY } from "../shared/color";
import { formatTick } from "../shared/axis";

export interface ChoroplethItem {
  /** 都道府県コード "01"〜"47"（"01000" 形式も可） */
  code: string;
  /** 都道府県名 */
  name: string;
  /** 数値 */
  value: number;
}

export interface ChoroplethOptions {
  /** チャートタイトル */
  title: string;
  /** サブタイトル（年次・指標の説明など） */
  subtitle?: string;
  /** 凡例の単位テキスト（例: "人", "%"） */
  unit: string;
  /** aria-label（省略時: title） */
  ariaLabel?: string;
  /** カラースケール最小値（省略時: データ最小値） */
  colorMin?: number;
  /** カラースケール最大値（省略時: データ最大値） */
  colorMax?: number;
  /** 値フォーマット関数（省略時: formatTick） */
  formatValue?: (v: number) => string;
  /** カラーストップ（省略時: Reds） */
  colorStops?: Array<{ t: number; r: number; g: number; b: number }>;
  /** 凡例の端ラベル [左端, 右端]（省略時: ["安全", "危険"]） */
  legendLabels?: [string, string];
}

// ─── タイルレイアウト ────────────────────────────────────────────

interface TileSpec {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * 47 都道府県の固定タイル座標（SVG px）。
 * キーは 2 桁コード "01"〜"47"。
 * 基本タイルサイズ 33px、2 マス分は 68px（33+2+33）。
 */
/**
 * 基本タイルサイズ 36px（旧 33px から scale=36/33 で拡大）、2 マス分は 74px。
 * タイル起点 y=45（旧 67.5）、水平中心 x=300 を基準にスケール変換済み。
 */
const TILE_LAYOUT: Record<string, TileSpec> = {
  "01": { x: 491, y:  45.0, w: 74, h: 74 }, // 北海道
  "02": { x: 491, y: 159.5, w: 74, h: 36 }, // 青森
  "03": { x: 529, y: 197.5, w: 36, h: 36 }, // 岩手
  "04": { x: 529, y: 236.0, w: 36, h: 36 }, // 宮城
  "05": { x: 491, y: 197.5, w: 36, h: 36 }, // 秋田
  "06": { x: 491, y: 236.0, w: 36, h: 36 }, // 山形
  "07": { x: 491, y: 274.0, w: 74, h: 36 }, // 福島
  "08": { x: 529, y: 312.5, w: 36, h: 36 }, // 茨城
  "09": { x: 491, y: 312.5, w: 36, h: 36 }, // 栃木
  "10": { x: 453, y: 312.5, w: 36, h: 36 }, // 群馬
  "11": { x: 491, y: 350.5, w: 36, h: 36 }, // 埼玉
  "12": { x: 529, y: 350.5, w: 36, h: 74 }, // 千葉
  "13": { x: 491, y: 388.5, w: 36, h: 36 }, // 東京
  "14": { x: 491, y: 427.0, w: 36, h: 36 }, // 神奈川
  "15": { x: 415, y: 274.0, w: 74, h: 36 }, // 新潟
  "16": { x: 376, y: 274.0, w: 36, h: 36 }, // 富山
  "17": { x: 338, y: 274.0, w: 36, h: 36 }, // 石川
  "18": { x: 338, y: 312.5, w: 36, h: 36 }, // 福井
  "19": { x: 453, y: 350.5, w: 36, h: 36 }, // 山梨
  "20": { x: 415, y: 312.5, w: 36, h: 74 }, // 長野
  "21": { x: 376, y: 312.5, w: 36, h: 74 }, // 岐阜
  "22": { x: 415, y: 388.5, w: 74, h: 36 }, // 静岡
  "23": { x: 376, y: 388.5, w: 36, h: 36 }, // 愛知
  "24": { x: 338, y: 388.5, w: 36, h: 74 }, // 三重
  "25": { x: 338, y: 350.5, w: 36, h: 36 }, // 滋賀
  "26": { x: 262, y: 350.5, w: 74, h: 36 }, // 京都
  "27": { x: 262, y: 388.5, w: 36, h: 36 }, // 大阪
  "28": { x: 224, y: 350.5, w: 36, h: 74 }, // 兵庫
  "29": { x: 300, y: 388.5, w: 36, h: 36 }, // 奈良
  "30": { x: 262, y: 427.0, w: 74, h: 36 }, // 和歌山
  "31": { x: 185, y: 350.5, w: 36, h: 36 }, // 鳥取
  "32": { x: 147, y: 350.5, w: 36, h: 36 }, // 島根
  "33": { x: 185, y: 388.5, w: 36, h: 36 }, // 岡山
  "34": { x: 147, y: 388.5, w: 36, h: 36 }, // 広島
  "35": { x: 109, y: 350.5, w: 36, h: 74 }, // 山口
  "36": { x: 185, y: 503.0, w: 36, h: 36 }, // 徳島
  "37": { x: 185, y: 465.0, w: 36, h: 36 }, // 香川
  "38": { x: 147, y: 465.0, w: 36, h: 36 }, // 愛媛
  "39": { x: 147, y: 503.0, w: 36, h: 36 }, // 高知
  "40": { x:  71, y: 427.0, w: 36, h: 36 }, // 福岡
  "41": { x:  33, y: 427.0, w: 36, h: 36 }, // 佐賀
  "42": { x:  33, y: 465.0, w: 36, h: 36 }, // 長崎
  "43": { x:  33, y: 503.0, w: 36, h: 36 }, // 熊本
  "44": { x:  71, y: 465.0, w: 36, h: 36 }, // 大分
  "45": { x:  71, y: 503.0, w: 36, h: 36 }, // 宮崎
  "46": { x:  33, y: 541.5, w: 74, h: 36 }, // 鹿児島
  "47": { x:  33, y: 617.5, w: 36, h: 36 }, // 沖縄
};

// ─── カラースケール（Reds） ─────────────────────────────────────

const COLOR_STOPS = [
  { t: 0.0, r: 254, g: 229, b: 217 }, // #fee5d9
  { t: 0.5, r: 251, g: 106, b:  74 }, // #fb6a4a
  { t: 1.0, r: 165, g:  15, b:  21 }, // #a50f15
];

function interpolateColor(
  t: number,
  stops: Array<{ t: number; r: number; g: number; b: number }> = COLOR_STOPS,
): string {
  t = Math.max(0, Math.min(1, t));
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t <= stops[i + 1].t) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const s = (t - lo.t) / (hi.t - lo.t);
  const r = Math.round(lo.r + s * (hi.r - lo.r));
  const g = Math.round(lo.g + s * (hi.g - lo.g));
  const b = Math.round(lo.b + s * (hi.b - lo.b));
  return `rgb(${r},${g},${b})`;
}

/**
 * 都道府県名のフォントサイズ。
 * - 北海道（68x68 大タイル）: 11
 * - 3 文字以上の名前: 7（神奈川・和歌山・鹿児島）
 * - その他: 9
 */
function nameFontSize(name: string, w: number, h: number): number {
  if (w >= 68 && h >= 68) return 11;
  if (name.length >= 3) return 7;
  return 9;
}

/**
 * 背景色の知覚輝度に基づきテキスト色を返す。
 * 輝度 > 0.5 → 暗い背景向け白文字ではなく濃いグレー（#374151）、
 * 輝度 ≤ 0.5 → 白（#ffffff）。
 */
function textFill(rgbColor: string): string {
  const m = rgbColor.match(/rgb\((\d+),(\d+),(\d+)\)/);
  if (!m) return "#ffffff";
  const lum =
    (0.299 * parseInt(m[1]) + 0.587 * parseInt(m[2]) + 0.114 * parseInt(m[3])) / 255;
  return lum > 0.5 ? "#374151" : "#ffffff";
}

// ─── SVG 定数 ────────────────────────────────────────────────────

const W = 600;
const TOTAL_H = 665;
// 凡例：右寄せ（バー右端 x=545、SVG 右端 600 から 55px 余白）
const BAR_RIGHT = 545; // グラデーションバー右端 x
const BAR_W     = 140; // バー幅（コンパクト）
const BAR_X     = BAR_RIGHT - BAR_W; // = 405
const BAR_Y     = 625; // バー y（沖縄右側の空白に配置）
const BAR_H     = 10;  // バー高さ

// ─── 公開関数 ────────────────────────────────────────────────────

/**
 * タイルグリッドコロプレスマップ SVG を生成する
 */
export function generateChoroplethSvg(
  items: ChoroplethItem[],
  options: ChoroplethOptions,
): string {
  const {
    title,
    subtitle,
    unit,
    ariaLabel = title,
    colorMin,
    colorMax,
    formatValue = (v) => formatTick(v, 1),
    colorStops = COLOR_STOPS,
    legendLabels = ["安全", "危険"],
  } = options;

  // コードを 2 桁に正規化（"01000" → "01"）
  const byCode = new Map(
    items.map((d) => [d.code.slice(0, 2).padStart(2, "0"), d]),
  );

  const values = items.map((d) => d.value);
  const lo = colorMin ?? Math.min(...values);
  const hi = colorMax ?? Math.max(...values);
  const toT = (v: number) => (hi === lo ? 0.5 : (v - lo) / (hi - lo));

  // タイル描画
  const tiles = Object.entries(TILE_LAYOUT).map(([code, tile]) => {
    const item = byCode.get(code);
    if (!item) return "";

    const t = toT(item.value);
    const fill = interpolateColor(t, colorStops);
    const nfs = nameFontSize(item.name, tile.w, tile.h);

    const cx = tile.x + tile.w / 2;
    // 名前を縦中央に配置（baseline = タイル中心 + cap-height 補正）
    const nameY = tile.y + tile.h / 2 + nfs * 0.38;

    const valStr = formatValue(item.value);

    const tc = textFill(fill);
    const filterAttr = tc === "#ffffff" ? ` filter="url(#txt-shadow)"` : "";

    return [
      `  <g aria-label="${item.name} ${valStr}${unit}">`,
      `    <title>${item.name}：${valStr}${unit}</title>`,
      `    <rect x="${tile.x}" y="${tile.y}" width="${tile.w}" height="${tile.h}" rx="3" fill="${fill}" stroke="#ffffff" stroke-width="1"/>`,
      `    <text${filterAttr} font-family="${FONT_FAMILY}" fill="${tc}" text-anchor="middle">`,
      `      <tspan x="${cx}" y="${nameY.toFixed(1)}" font-size="${nfs}" font-weight="700">${item.name}</tspan>`,
      `    </text>`,
      `  </g>`,
    ].join("\n");
  });

  // タイトル（バーチャートと同スタイル：14px bold #333 + subtitle は tspan でインライン）
  const titleText = subtitle
    ? `${title}<tspan font-size="10" font-weight="normal" fill="#888">　${subtitle}</tspan>`
    : title;
  const titleLine = `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${titleText}</text>`;

  // 凡例（グラデーションバー + 最小・中間・最大ラベル）
  const loStr = formatValue(lo);
  const midStr = formatValue((lo + hi) / 2);
  const hiStr = formatValue(hi);
  // グラデーションストップを colorStops から生成
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  const gradientStops = colorStops
    .map((s) => `      <stop offset="${Math.round(s.t * 100)}%"   stop-color="#${toHex(s.r)}${toHex(s.g)}${toHex(s.b)}"/>`)
    .join("\n");
  // コンパクト凡例（沖縄右側: x=96〜236, y=625〜647）
  const legend = [
    `  <defs>`,
    `    <linearGradient id="choropleth-lg" x1="0" x2="1">`,
    gradientStops,
    `    </linearGradient>`,
    `    <filter id="txt-shadow" x="-40%" y="-40%" width="180%" height="180%">`,
    `      <feDropShadow dx="0" dy="0" stdDeviation="1.3" flood-color="#000000" flood-opacity="0.6"/>`,
    `    </filter>`,
    `  </defs>`,
    `  <text x="${BAR_X - 4}" y="${BAR_Y + 8}" font-size="8" fill="#6b7280" text-anchor="end">${legendLabels[0]}</text>`,
    `  <rect x="${BAR_X}" y="${BAR_Y}" width="${BAR_W}" height="${BAR_H}" rx="2" fill="url(#choropleth-lg)"/>`,
    `  <text x="${BAR_RIGHT + 4}" y="${BAR_Y + 8}" font-size="8" fill="#6b7280">${legendLabels[1]}</text>`,
    `  <text x="${BAR_X}" y="${BAR_Y + 22}" font-size="7.5" fill="#9ca3af">${loStr}${unit}</text>`,
    `  <text x="${BAR_X + Math.round(BAR_W / 2)}" y="${BAR_Y + 22}" font-size="7.5" fill="#9ca3af" text-anchor="middle">${midStr}${unit}</text>`,
    `  <text x="${BAR_RIGHT}" y="${BAR_Y + 22}" font-size="7.5" fill="#9ca3af" text-anchor="end">${hiStr}${unit}</text>`,
  ];

  return `<svg width="${W}" height="${TOTAL_H}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${TOTAL_H}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>${subtitle ? `\n  <desc>${subtitle}</desc>` : ""}
  <rect width="${W}" height="${TOTAL_H}" fill="#f9fafb"/>
${titleLine}
${tiles.filter(Boolean).join("\n")}
${legend.join("\n")}
</svg>`;
}

