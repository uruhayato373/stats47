import {
  resolveChartDomain,
  type NumericDomain,
  type NumericDomainPolicy,
} from '@stats47/types';
/**
 * 多系列折れ線グラフ SVG 生成
 *
 * StatsSchema[] を受け取り、xKey を X 軸、seriesKey を系列として描画する。
 *
 * ## 使い方
 * ```ts
 * const svg = generateLineSvg(data, {
 *   title: "女性の年齢階級別正規雇用率（L字カーブ）",
 *   subtitle: "2023年（令和7年版労働経済白書）",
 *   xKey: "categoryCode",    // 年齢階級を X 軸に
 *   seriesKey: "areaCode",   // 国ごとに系列
 *   yLabel: "正規雇用率（%）",
 * });
 * ```
 */

import { FONT_FAMILY, SERIES_COLORS as LINE_COLORS } from "../shared/color";
import { niceTicks, linearScale, formatTick } from "../shared/axis";
import { makePlotArea, px } from "../shared/layout";
import { layoutLegendRows, planCategoryTicks, rotatedLabelDrop, textWidth, truncateToWidth } from "../shared/text-metrics";
import { svgThemeStyle } from "../shared/theme";
import {
  StatsSchema,
  DimensionKey,
  uniqueDimension,
  buildValueMap,
} from "../shared/stats-schema";

export interface LineChartOptions {
  /** 媒体の外枠内で使う描画領域。省略時は従来の680×420。 */
  frame?: { width: number; height: number };
  /** 外枠に見出しがある場合は重複させない。 */
  showHeading?: boolean;
  /** 単系列の始点・終点の値を横軸の下に表示する。 */
  showEndpointValues?: boolean;
  domainPolicy?: NumericDomainPolicy;
  yDomain?: NumericDomain;
  /** チャートタイトル */
  title: string;
  /** サブタイトル（年次・出典など） */
  subtitle?: string;
  /** aria-label（省略時: title） */
  ariaLabel?: string;
  /** X 軸の次元キー（例: "categoryCode" で年齢階級 X 軸） */
  xKey: DimensionKey;
  /** 系列の次元キー（例: "areaCode" で国ごとの系列） */
  seriesKey: DimensionKey;
  /** X 軸ラベルテキスト */
  xLabel?: string;
  /** Y 軸ラベルテキスト */
  yLabel?: string;
  /** 単位（プロットエリア左上に表示） */
  unit?: string;
  /** Y 軸最小値（省略時は共有の範囲設定を使用） */
  yMin?: number;
  /** 凡例の位置（デフォルト: "bottom"） */
  legendPosition?: "right" | "bottom";
}

export function generateLineSvg(data: StatsSchema[], options: LineChartOptions): string {
  const {
    title,
    subtitle,
    ariaLabel = title,
    xKey,
    seriesKey,
    xLabel,
    yLabel,
    unit,
    yMin,
    legendPosition = "bottom",
  } = options;

  const xItems = uniqueDimension(data, xKey);
  const series = uniqueDimension(data, seriesKey);
  const valueMap = buildValueMap(data, xKey, seriesKey);

  // Y 軸範囲
  const allValues = data.map((d) => d.value).filter((v): v is number => v !== null);
  const domain = resolveChartDomain(allValues, options.domainPolicy ?? {mode: 'extent'}, options.yDomain);
  if (!domain) throw new Error('No finite observations for line chart');
  const [yScaleLo, yScaleHi] = yMin === undefined ? domain : resolveChartDomain(allValues, {mode: 'fixed', min: yMin, max: domain[1]})!;
  const yTicks = niceTicks(yScaleLo, yScaleHi, 5);

  const W = options.frame?.width ?? 680;
  const H = options.frame?.height ?? 420;
  if (!Number.isFinite(W) || !Number.isFinite(H) || W < 300 || H < 240)
    throw new Error("Line chart frame must be at least 300×240.");
  const axisLabel = unit
    ? yLabel?.split(`（${unit}）`).join("").split(`(${unit})`).join("").trim()
    : yLabel;
  const visibleYLabel = axisLabel === title ? undefined : axisLabel;
  const legendEntries = series.map((s, i) => ({ label: s.name, color: LINE_COLORS[i % LINE_COLORS.length] }));
  const legendAtBottom = legendPosition === "bottom" && series.length > 1;
  const legendW = legendPosition === "right" && series.length > 1
    ? Math.min(240, 30 + Math.max(...series.map(s => textWidth(s.name, 9)))) : 0;
  const left = Math.max(55, (visibleYLabel ? 28 : 12) + Math.max(...yTicks.map(v => textWidth(formatTick(v), 8.5))) + 5);
  const right = Math.max(14, textWidth(xItems[xItems.length - 1]?.name ?? "", 8.5) / 2 + 4) + legendW;
  const plotWidth = W - left - right;
  const ticks = planCategoryTicks(xItems.map(x => x.name), plotWidth / Math.max(1, xItems.length - 1), 8.5, { angle: 35, maxLabels: 12 });
  const labelDrop = ticks.rotate
    ? rotatedLabelDrop(Math.max(...xItems.map(x => textWidth(x.name, 8.5))), 8.5, 35) : 8.5;
  const legend = layoutLegendRows(legendAtBottom ? legendEntries : [], { left, availW: plotWidth, fontSize: 9, swatchW: 12, gap: 16 });
  const endpointValues = options.showEndpointValues && series.length === 1;
  const bottom = Math.max(60, 14 + labelDrop + (endpointValues ? 22 : 0) + (legendAtBottom ? 12 + legend.rows * 22 : 0) + (xLabel ? 20 : 8));
  const plot = makePlotArea(W, H, { top: options.showHeading === false ? 14 : 58, right, bottom, left });

  const toSvgX = (i: number): number =>
    xItems.length > 1
      ? plot.left + (i / (xItems.length - 1)) * plot.width
      : (plot.left + plot.right) / 2;
  const toSvgY = linearScale(yScaleLo, yScaleHi, plot.bottom, plot.top);

  // Y グリッド
  const yGridLines = yTicks.map((v) => {
    const y = px(toSvgY(v));
    return [
      `  <line x1="${px(plot.left)}" y1="${y}" x2="${px(plot.right)}" y2="${y}" class="svg-grid" stroke-width="1"/>`,
      `  <text x="${(plot.left - 5).toFixed(1)}" y="${(toSvgY(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="8.5" class="svg-tick">${formatTick(v)}</text>`,
    ].join("\n");
  });

  // 文字幅に応じて回転・間引きする。観測点そのものは間引かない。
  const xTickLabels = ticks.indices.map(i => {
    const x = toSvgX(i).toFixed(1);
    const y = (plot.bottom + 14).toFixed(1);
    return ticks.rotate
      ? `  <text x="${x}" y="${y}" font-size="8.5" class="svg-tick" text-anchor="end" transform="rotate(-35,${x},${y})">${xItems[i].name}</text>`
      : `  <text x="${x}" y="${y}" font-size="8.5" class="svg-tick" text-anchor="middle">${xItems[i].name}</text>`;
  });

  // ゼロライン（Y 軸が負を含む場合）
  const zeroLine =
    yScaleLo < 0 && yScaleHi >= 0
      ? `  <line x1="${px(plot.left)}" y1="${px(toSvgY(0))}" x2="${px(plot.right)}" y2="${px(toSvgY(0))}" stroke="#9ca3af" stroke-width="1.5"/>`
      : "";

  // 系列ごとに折れ線 + ドット
  const seriesElements: string[] = [];
  series.forEach((s, si) => {
    const color = LINE_COLORS[si % LINE_COLORS.length];
    const points: Array<[number, number]> = [];
    const segments: Array<Array<[number, number]>> = [];
    let segment: Array<[number, number]> = [];
    for (let i = 0; i < xItems.length; i++) {
      const v = valueMap.get(xItems[i].code)?.get(s.code);
      if (v !== undefined && Number.isFinite(v)) {const point: [number, number] = [toSvgX(i), toSvgY(v)]; points.push(point); segment.push(point);}
      else if (segment.length) {segments.push(segment); segment = [];}
    }
    if (segment.length) segments.push(segment);
    for (const run of segments) {
      if (run.length < 2) continue;
      const polyPts = run.map(([x, y]) => x.toFixed(1) + ',' + y.toFixed(1)).join(' ');
      seriesElements.push('  <polyline points="' + polyPts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>');
    }
    points.forEach(([x, y]) => {
      seriesElements.push(
        `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}" fill-opacity="0.9" stroke="#fff" stroke-width="1.2"/>`,
      );
    });
  });

  const legendItems = legendAtBottom
    ? legend.items.map(item => {
      const y = plot.bottom + 14 + labelDrop + 16 + item.row * 22;
      return `  <rect x="${px(item.x)}" y="${px(y - 3)}" width="12" height="3" fill="${item.color}" rx="1.5"/>
  <text x="${px(item.x + 16)}" y="${px(y)}" font-size="9" class="svg-axis">${item.label}</text>`;
    }).join("\n")
    : legendW > 0 ? legendEntries.map((item, i) => {
      const y = plot.top + i * 22 + 4;
      return `  <rect x="${px(plot.right + 12)}" y="${px(y - 4)}" width="12" height="3" fill="${item.color}" rx="1.5"/>
  <text x="${px(plot.right + 28)}" y="${px(y)}" font-size="9" class="svg-axis">${truncateToWidth(item.label, legendW - 28, 9)}</text>`;
    }).join("\n") : "";

  const unitLabel = unit
    ? `  <text x="${px(plot.left)}" y="${(plot.top - 6).toFixed(1)}" font-size="8.5" class="svg-tick">(${unit})</text>`
    : "";
  const endpointLabels = endpointValues
    ? [...new Set([0, xItems.length - 1])].map(i => {
      const value = valueMap.get(xItems[i].code)?.get(series[0].code);
      if (value === undefined || !Number.isFinite(value)) return "";
      return `<text x="${px(toSvgX(i))}" y="${px(plot.bottom + 14 + labelDrop + 16)}" text-anchor="${i === 0 ? "start" : "end"}" font-size="9" class="svg-axis">${formatTick(value)}</text>`;
    }).join("\n") : "";
  const xAxisLabel = xLabel
    ? `  <text x="${((plot.left + plot.right) / 2).toFixed(1)}" y="${(H - 4).toFixed(1)}" text-anchor="middle" font-size="10" class="svg-axis">${xLabel}</text>`
    : "";
  const yAxisLabel = visibleYLabel
    ? `  <text x="13" y="${((plot.top + plot.bottom) / 2).toFixed(1)}" text-anchor="middle" font-size="10" class="svg-axis" transform="rotate(-90,13,${((plot.top + plot.bottom) / 2).toFixed(1)})">${truncateToWidth(visibleYLabel, plot.height, 10)}</text>`
    : "";

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" class="svg-title">${title}</text>`,
    subtitle
      ? `  <text x="${W / 2}" y="37" text-anchor="middle" font-size="9" class="svg-tick">${subtitle}</text>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
${svgThemeStyle()}
  <rect width="${W}" height="${H}" class="svg-bg"/>
${options.showHeading === false ? "" : titleLines}
${unitLabel}
  <!-- プロットエリア -->
  <rect x="${px(plot.left)}" y="${px(plot.top)}" width="${px(plot.width)}" height="${px(plot.height)}" class="svg-plot svg-plot-border" stroke-width="1"/>
  <!-- Y グリッド -->
${yGridLines.join("\n")}
${zeroLine}
  <!-- X 軸ラベル -->
${xTickLabels.join("\n")}
${endpointLabels}
  <!-- 系列 -->
${seriesElements.join("\n")}
  <!-- 凡例 -->
${legendItems}
  <!-- 軸ラベル -->
${xAxisLabel}
${yAxisLabel}
</svg>`;
}
