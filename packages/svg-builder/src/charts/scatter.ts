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
  /**
   * 点の横に県名を直接書く対象（`ScatterPoint.name` と完全一致）。
   * 本文が名指しする点を読者が図上で識別できるようにするための指定で、未指定なら何も描かない。
   * ラベル同士・他の点・プロット枠と重ならない位置（右・左・上・下の順）を決定的に選ぶ。
   */
  labelNames?: string[];
}

interface LabelBox {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

const LABEL_FONT_SIZE = 10;
const DOT_R = 4;

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
}

/**
 * 散布図 SVG を生成する
 */
export function generateScatterSvg(
  points: ScatterPoint[],
  options: ScatterOptions
): string {
  const {
    xLabel,
    yLabel,
    title,
    subtitle,
    ariaLabel = title,
    labelNames = [],
  } = options;

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

  // 県名ラベル（labelNames 指定の点のみ）。全点の円を障害物として、置ける位置を決定的に選ぶ
  const dotBoxes: LabelBox[] = points.map((p) => {
    const cx = toSvgX(p.x);
    const cy = toSvgY(p.y);
    return {
      x0: cx - DOT_R,
      x1: cx + DOT_R,
      y0: cy - DOT_R,
      y1: cy + DOT_R,
    };
  });
  const placed: LabelBox[] = [];
  const labelTexts: string[] = [];
  for (const name of labelNames) {
    const idx = points.findIndex((p) => p.name === name);
    if (idx < 0) continue;
    const cx = toSvgX(points[idx].x);
    const cy = toSvgY(points[idx].y);
    const w = name.length * LABEL_FONT_SIZE;
    const h = LABEL_FONT_SIZE;
    const gap = DOT_R + 3;
    const candidates = [
      {
        anchor: 'start',
        tx: cx + gap,
        ty: cy + 3.5,
        x0: cx + gap,
        y0: cy - h / 2,
      },
      {
        anchor: 'end',
        tx: cx - gap,
        ty: cy + 3.5,
        x0: cx - gap - w,
        y0: cy - h / 2,
      },
      {
        anchor: 'middle',
        tx: cx,
        ty: cy - gap - 1,
        x0: cx - w / 2,
        y0: cy - gap - h,
      },
      {
        anchor: 'middle',
        tx: cx,
        ty: cy + gap + h - 1,
        x0: cx - w / 2,
        y0: cy + gap,
      },
    ].map((c) => ({
      ...c,
      box: { x0: c.x0, x1: c.x0 + w, y0: c.y0, y1: c.y0 + h },
    }));
    const inPlot = (b: LabelBox) =>
      b.x0 >= plot.left &&
      b.x1 <= plot.right &&
      b.y0 >= plot.top &&
      b.y1 <= plot.bottom;
    const free = (b: LabelBox) =>
      inPlot(b) &&
      !placed.some((o) => overlaps(b, o)) &&
      !dotBoxes.some((o, i) => i !== idx && overlaps(b, o));
    const chosen =
      candidates.find((c) => free(c.box)) ??
      candidates.find(
        (c) => inPlot(c.box) && !placed.some((o) => overlaps(c.box, o))
      ) ??
      candidates[0];
    placed.push(chosen.box);
    labelTexts.push(
      `  <text x="${px(chosen.tx)}" y="${px(chosen.ty)}" text-anchor="${chosen.anchor}" font-size="${LABEL_FONT_SIZE}" font-weight="bold" class="svg-axis">${name}</text>`
    );
  }

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
${dots.join('\n')}${labelTexts.length ? `\n  <!-- 県名ラベル -->\n${labelTexts.join('\n')}` : ''}
</svg>`;
}
