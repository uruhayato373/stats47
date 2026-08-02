/**
 * 散布図 SVG 生成
 *
 * 2 つのランキングデータを都道府県コードで JOIN し、
 * 回帰直線付き散布図を静的 SVG 文字列として出力する。
 */

import {
  niceTicks,
  paddedRange,
  linearScale,
  formatTick,
} from '../shared/axis';
import { FONT_FAMILY, SCATTER_COLORS } from '../shared/color';
import { makePlotArea, px } from '../shared/layout';
import { linearRegression } from '../shared/regression';
import { svgThemeStyle } from '../shared/theme';

export interface ScatterPoint {
  name: string;
  code: string;
  x: number;
  y: number;
}

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
}

/**
 * 散布図 SVG を生成する
 */
export function generateScatterSvg(
  points: ScatterPoint[],
  options: ScatterOptions
): string {
  const { xLabel, yLabel, title, subtitle, ariaLabel = title } = options;

  const W = 720;
  const H = 720;
  // キャンバスだけでなく、データを読む実プロット領域も 600×600 の正方形に固定する。
  const plot = makePlotArea(W, H, { top: 56, right: 40, bottom: 64, left: 80 });

  // 軸範囲
  const xRange = paddedRange(points.map((p) => p.x));
  const yRange = paddedRange(
    points.map((p) => p.y),
    0.08
  );

  const toSvgX = linearScale(xRange.lo, xRange.hi, plot.left, plot.right);
  // SVG は Y 軸が反転（データ値大 → SVG Y 小）
  const toSvgY = linearScale(yRange.lo, yRange.hi, plot.bottom, plot.top);

  // 目盛り
  const xTicks = niceTicks(xRange.lo, xRange.hi, 5);
  const yTicks = niceTicks(yRange.lo, yRange.hi, 5);

  const xGridLines = xTicks.map((v) => {
    const x = px(toSvgX(v));
    return [
      `  <line x1="${x}" y1="${plot.top}" x2="${x}" y2="${plot.bottom}" class="svg-grid" stroke-width="1"/>`,
      `  <text x="${x}" y="${plot.bottom + 14}" text-anchor="middle" font-size="8.5" class="svg-tick">${formatTick(v)}</text>`,
    ].join('\n');
  });

  const yGridLines = yTicks.map((v) => {
    const y = px(toSvgY(v));
    return [
      `  <line x1="${plot.left}" y1="${y}" x2="${plot.right}" y2="${y}" class="svg-grid" stroke-width="1"/>`,
      `  <text x="${plot.left - 4}" y="${(parseFloat(y) + 3).toFixed(1)}" text-anchor="end" font-size="8.5" class="svg-tick">${formatTick(v)}</text>`,
    ].join('\n');
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
    return `  <circle cx="${cx}" cy="${cy}" r="4" fill="${defaultFill}" fill-opacity="0.85" stroke="${defaultStroke}" stroke-width="1"><title>${p.name}：X=${formatTick(p.x)} Y=${formatTick(p.y)}</title></circle>`;
  });

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" class="svg-title">${title}</text>`,
  ];

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ''}
${svgThemeStyle()}
  <rect width="${W}" height="${H}" class="svg-bg"/>
${titleLines.join('\n')}
  <!-- プロットエリア -->
  <rect x="${plot.left}" y="${plot.top}" width="${plot.width}" height="${plot.height}" class="svg-plot svg-plot-border" stroke-width="1"/>
  <!-- グリッド -->
${xGridLines.join('\n')}
${yGridLines.join('\n')}
  <!-- 軸ラベル -->
  <text x="${(plot.left + plot.right) / 2}" y="${plot.bottom + 42}" text-anchor="middle" font-size="10" class="svg-axis">${xLabel}</text>
  <text x="14" y="${(plot.top + plot.bottom) / 2}" text-anchor="middle" font-size="10" class="svg-axis" transform="rotate(-90,14,${(plot.top + plot.bottom) / 2})">${yLabel}</text>
  <!-- 回帰直線 -->
${regLine}
  <!-- ドット -->
${dots.join('\n')}
</svg>`;
}
