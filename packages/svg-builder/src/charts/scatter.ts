/**
 * 散布図 SVG 生成
 *
 * 2 つのランキングデータを都道府県コードで JOIN し、
 * 回帰直線付き散布図を静的 SVG 文字列として出力する。
 */

import { niceTicks, paddedRange, linearScale, formatTick } from "../shared/axis";
import { FONT_FAMILY, SCATTER_COLORS } from "../shared/color";
import { makePlotArea, px } from "../shared/layout";
import { linearRegression } from "../shared/regression";

export interface ScatterPoint {
  name: string;
  code: string;
  x: number;
  y: number;
}

/** 地方ブロック定義 */
export interface RegionBlock {
  /** 凡例表示名 */
  label: string;
  /** ドット塗り色 */
  color: string;
  /** この地方に属する都道府県コード */
  codes: string[];
}

/** 標準の地方ブロック色（6ブロック） */
export const REGION_BLOCKS: RegionBlock[] = [
  { label: "北海道・東北", color: "#42a5f5", codes: ["01", "02", "03", "04", "05", "06", "07"] },
  { label: "関東",         color: "#66bb6a", codes: ["08", "09", "10", "11", "12", "13", "14"] },
  { label: "中部",         color: "#fdd835", codes: ["15", "16", "17", "18", "19", "20", "21", "22", "23"] },
  { label: "近畿",         color: "#ffa726", codes: ["24", "25", "26", "27", "28", "29", "30"] },
  { label: "中国・四国",   color: "#ef5350", codes: ["31", "32", "33", "34", "35", "36", "37", "38", "39"] },
  { label: "九州・沖縄",   color: "#ab47bc", codes: ["40", "41", "42", "43", "44", "45", "46", "47"] },
];

export interface ScatterOptions {
  /** X 軸ラベル（年度を含める。例: "事故件数（件/10万人）2023年度"） */
  xLabel: string;
  /** Y 軸ラベル（年度を含める。例: "致死率（人/100件）2023年度"） */
  yLabel: string;
  /** チャートタイトル */
  title: string;
  /**
   * @deprecated 年度・出典はxLabel/yLabelに含めること。
   * この値はアクセシビリティ用 <desc> タグにのみ使用される（画面には表示されない）。
   */
  subtitle?: string;
  /** aria-label */
  ariaLabel?: string;
  /**
   * 地方ブロック色分けを有効にする。
   * true → REGION_BLOCKS を使用。RegionBlock[] → カスタム地方定義を使用。
   */
  colorByRegion?: boolean | RegionBlock[];
}

/** code → { color } のルックアップマップを構築 */
function buildRegionColorMap(blocks: RegionBlock[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const block of blocks) {
    for (const code of block.codes) {
      map.set(code, block.color);
    }
  }
  return map;
}

/** 凡例を下部中央に配置する SVG 要素を生成 */
function renderBottomLegend(blocks: RegionBlock[], svgWidth: number, legendY: number): string {
  // 各アイテムの幅を計算（ラベル文字数 × 7px + circle + gap）
  const itemWidths = blocks.map((b) => 10 + b.label.length * 7 + 12);
  const totalW = itemWidths.reduce((a, b) => a + b, 0);
  let x = (svgWidth - totalW) / 2;

  return blocks.map((block, i) => {
    const cx = x + 4;
    const lines = [
      `  <circle cx="${px(cx)}" cy="${px(legendY)}" r="4" fill="${block.color}" fill-opacity="0.75"/>`,
      `  <text x="${px(cx + 8)}" y="${px(legendY + 3)}" font-size="8" fill="#6b7280">${block.label}</text>`,
    ];
    x += itemWidths[i];
    return lines.join("\n");
  }).join("\n");
}

/**
 * 散布図 SVG を生成する
 */
export function generateScatterSvg(points: ScatterPoint[], options: ScatterOptions): string {
  const {
    xLabel,
    yLabel,
    title,
    subtitle,
    ariaLabel = title,
    colorByRegion,
  } = options;

  // 地方色分けの解決
  const regionBlocks = colorByRegion === true
    ? REGION_BLOCKS
    : Array.isArray(colorByRegion)
      ? colorByRegion
      : null;
  const regionColorMap = regionBlocks ? buildRegionColorMap(regionBlocks) : null;

  const W = 560;
  const legendH = regionBlocks ? 40 : 0;
  const H = 560 + legendH;
  const plot = makePlotArea(W, H, { top: 58, right: 28, bottom: 58 + legendH, left: 68 });

  // 軸範囲
  const xRange = paddedRange(points.map((p) => p.x));
  const yRange = paddedRange(points.map((p) => p.y), 0.08);

  const toSvgX = linearScale(xRange.lo, xRange.hi, plot.left, plot.right);
  // SVG は Y 軸が反転（データ値大 → SVG Y 小）
  const toSvgY = linearScale(yRange.lo, yRange.hi, plot.bottom, plot.top);

  // 目盛り
  const xTicks = niceTicks(xRange.lo, xRange.hi, 5);
  const yTicks = niceTicks(yRange.lo, yRange.hi, 5);

  const xGridLines = xTicks.map((v) => {
    const x = px(toSvgX(v));
    return [
      `  <line x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.bottom}" stroke="#e5e7eb" stroke-width="1"/>`,
      `  <text x="${x}" y="${plot.bottom + 14}" text-anchor="middle" font-size="8.5" fill="#6b7280">${formatTick(v)}</text>`,
    ].join("\n");
  });

  const yGridLines = yTicks.map((v) => {
    const y = px(toSvgY(v));
    return [
      `  <line x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`,
      `  <text x="${plot.left - 4}" y="${(parseFloat(y) + 3).toFixed(1)}" text-anchor="end" font-size="8.5" fill="#6b7280">${formatTick(v)}</text>`,
    ].join("\n");
  });

  // 回帰直線
  const reg = linearRegression(points);
  const regLine = (() => {
    const y1 = px(toSvgY(reg.slope * xRange.lo + reg.intercept));
    const y2 = px(toSvgY(reg.slope * xRange.hi + reg.intercept));
    return `  <line x1="${px(plot.left)}" y1="${y1}" x2="${px(plot.right)}" y2="${y2}" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="6 3" opacity="0.7"/>`;
  })();

  // ドット
  const defaultFill = SCATTER_COLORS.mid.fill;
  const defaultStroke = SCATTER_COLORS.mid.stroke;
  const dots = points.map((p) => {
    const cx = px(toSvgX(p.x));
    const cy = px(toSvgY(p.y));
    const dotColor = regionColorMap?.get(p.code) ?? defaultFill;
    const dotStroke = regionColorMap ? "#fff" : defaultStroke;
    const dotOpacity = regionColorMap ? "0.75" : "0.8";
    return `  <circle cx="${cx}" cy="${cy}" r="4" fill="${dotColor}" fill-opacity="${dotOpacity}" stroke="${dotStroke}" stroke-width="1"><title>${p.name}：X=${formatTick(p.x)} Y=${formatTick(p.y)}</title></circle>`;
  });

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${title}</text>`,
  ];

  // 凡例（下部中央）
  const legendSvg = regionBlocks
    ? `  <!-- 凡例 -->\n${renderBottomLegend(regionBlocks, W, H - 14)}`
    : "";

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
  <rect width="${W}" height="${H}" fill="#ffffff"/>
${titleLines.join("\n")}
  <!-- プロットエリア -->
  <rect x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}" fill="#f9fafb" stroke="#d1d5db" stroke-width="1"/>
  <!-- グリッド -->
${xGridLines.join("\n")}
${yGridLines.join("\n")}
  <!-- 軸ラベル -->
  <text x="${(plot.left + plot.right) / 2}" y="${plot.bottom + 42}" text-anchor="middle" font-size="10" fill="#374151">${xLabel}</text>
  <text x="14" y="${(plot.top + plot.bottom) / 2}" text-anchor="middle" font-size="10" fill="#374151" transform="rotate(-90,14,${(plot.top + plot.bottom) / 2})">${yLabel}</text>
  <!-- 回帰直線 -->
${regLine}
  <!-- ドット -->
${dots.join("\n")}
${legendSvg}
</svg>`;
}
