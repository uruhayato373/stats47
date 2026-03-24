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

import { FONT_FAMILY } from "../shared/color";
import { niceTicks, linearScale, formatTick } from "../shared/axis";
import { makePlotArea, px } from "../shared/layout";
import {
  StatsSchema,
  DimensionKey,
  uniqueDimension,
  buildValueMap,
} from "../shared/stats-schema";

/** 多系列折れ線グラフのカラーセット */
const LINE_COLORS = [
  "#1e88e5", // blue
  "#e53935", // red
  "#43a047", // green
  "#fb8c00", // orange
  "#8e24aa", // purple
  "#00897b", // teal
];

export interface LineChartOptions {
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
  /** Y 軸最小値（デフォルト: 0） */
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
    yMin = 0,
    legendPosition = "bottom",
  } = options;

  const xItems = uniqueDimension(data, xKey);
  const series = uniqueDimension(data, seriesKey);
  const valueMap = buildValueMap(data, xKey, seriesKey);

  const W = 560;
  const legendAtBottom = legendPosition === "bottom" && series.length > 1;
  const legendW = !legendAtBottom && series.length > 1 ? 132 : 0;
  const legendBottomH = legendAtBottom ? 22 : 0;
  const H = 400 + legendBottomH;
  const plot = makePlotArea(W, H, { top: 58, right: 14 + legendW, bottom: 60 + legendBottomH, left: 55 });

  // Y 軸範囲
  const allValues = data.map((d) => d.value);
  const yLo = Math.min(yMin, Math.min(...allValues));
  const yHi = Math.max(...allValues);
  const yTicks = niceTicks(yLo, yHi, 5);
  // niceTicks がデータ最大値未満で止まる場合は次の目盛りを追加する
  while (yTicks[yTicks.length - 1] < yHi) {
    const step = yTicks.length >= 2 ? yTicks[1] - yTicks[0] : yHi;
    yTicks.push(parseFloat((yTicks[yTicks.length - 1] + step).toFixed(10)));
  }
  const yScaleLo = yTicks[0];
  const yScaleHi = yTicks[yTicks.length - 1];

  const toSvgX = (i: number): number =>
    xItems.length > 1
      ? plot.left + (i / (xItems.length - 1)) * plot.width
      : (plot.left + plot.right) / 2;
  const toSvgY = linearScale(yScaleLo, yScaleHi, plot.bottom, plot.top);

  // Y グリッド
  const yGridLines = yTicks.map((v) => {
    const y = px(toSvgY(v));
    return [
      `  <line x1="${px(plot.left)}" y1="${y}" x2="${px(plot.right)}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>`,
      `  <text x="${(plot.left - 5).toFixed(1)}" y="${(toSvgY(v) + 3.5).toFixed(1)}" text-anchor="end" font-size="8.5" fill="#6b7280">${formatTick(v)}</text>`,
    ].join("\n");
  });

  // X 軸ラベル（7個超は斜め表示）
  const rotateTick = xItems.length > 7;
  const xTickLabels = xItems.map((item, i) => {
    const x = toSvgX(i).toFixed(1);
    const y = (plot.bottom + 14).toFixed(1);
    return rotateTick
      ? `  <text x="${x}" y="${y}" font-size="8.5" fill="#6b7280" text-anchor="end" transform="rotate(-35,${x},${y})">${item.name}</text>`
      : `  <text x="${x}" y="${y}" font-size="8.5" fill="#6b7280" text-anchor="middle">${item.name}</text>`;
  });

  // ゼロライン（Y 軸が負を含む場合）
  const zeroLine =
    yScaleLo < 0
      ? `  <line x1="${px(plot.left)}" y1="${px(toSvgY(0))}" x2="${px(plot.right)}" y2="${px(toSvgY(0))}" stroke="#9ca3af" stroke-width="1.5"/>`
      : "";

  // 系列ごとに折れ線 + ドット
  const seriesElements: string[] = [];
  series.forEach((s, si) => {
    const color = LINE_COLORS[si % LINE_COLORS.length];
    const points: Array<[number, number]> = [];
    for (let i = 0; i < xItems.length; i++) {
      const v = valueMap.get(xItems[i].code)?.get(s.code);
      if (v !== undefined) points.push([toSvgX(i), toSvgY(v)]);
    }
    if (points.length < 2) return;

    const polyPts = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    seriesElements.push(
      `  <polyline points="${polyPts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
    );
    points.forEach(([x, y]) => {
      seriesElements.push(
        `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${color}" fill-opacity="0.9" stroke="#fff" stroke-width="1.2"/>`,
      );
    });
  });

  // 凡例
  const legendItems = (() => {
    if (legendAtBottom) {
      // 下部凡例: 系列を横並びで中央配置
      const itemWidth = 90;
      const totalW = series.length * itemWidth;
      const startX = (W - totalW) / 2;
      const ly = plot.bottom + 18;
      return series
        .map((s, si) => {
          const color = LINE_COLORS[si % LINE_COLORS.length];
          const lx = startX + si * itemWidth;
          return [
            `  <rect x="${lx.toFixed(1)}" y="${(ly - 3).toFixed(1)}" width="12" height="3" fill="${color}" rx="1.5"/>`,
            `  <text x="${(lx + 16).toFixed(1)}" y="${ly.toFixed(1)}" font-size="9" fill="#374151">${s.name}</text>`,
          ].join("\n");
        })
        .join("\n");
    } else {
      // 右サイド凡例
      return series
        .map((s, si) => {
          const color = LINE_COLORS[si % LINE_COLORS.length];
          const lx = (plot.right + 12).toFixed(1);
          return [
            `  <rect x="${lx}" y="${(plot.top + si * 22).toFixed(1)}" width="12" height="3" fill="${color}" rx="1.5"/>`,
            `  <text x="${(plot.right + 27).toFixed(1)}" y="${(plot.top + si * 22 + 4).toFixed(1)}" font-size="9" fill="#374151">${s.name}</text>`,
          ].join("\n");
        })
        .join("\n");
    }
  })();

  const unitLabel = unit
    ? `  <text x="${px(plot.left)}" y="${(plot.top - 6).toFixed(1)}" font-size="8.5" fill="#9ca3af">(${unit})</text>`
    : "";
  const xAxisLabel = xLabel
    ? `  <text x="${((plot.left + plot.right) / 2).toFixed(1)}" y="${(H - 4).toFixed(1)}" text-anchor="middle" font-size="10" fill="#374151">${xLabel}</text>`
    : "";
  const yAxisLabel = yLabel
    ? `  <text x="13" y="${((plot.top + plot.bottom) / 2).toFixed(1)}" text-anchor="middle" font-size="10" fill="#374151" transform="rotate(-90,13,${((plot.top + plot.bottom) / 2).toFixed(1)})">${yLabel}</text>`
    : "";

  const titleLines = [
    `  <text x="${W / 2}" y="22" text-anchor="middle" font-size="12.5" font-weight="bold" fill="#111827">${title}</text>`,
    subtitle
      ? `  <text x="${W / 2}" y="37" text-anchor="middle" font-size="9" fill="#6b7280">${subtitle}</text>`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <title>${title}</title>
  ${subtitle ? `<desc>${subtitle}</desc>` : ""}
  <rect width="${W}" height="${H}" fill="#ffffff"/>
${titleLines}
${unitLabel}
  <!-- プロットエリア -->
  <rect x="${px(plot.left)}" y="${px(plot.top)}" width="${px(plot.width)}" height="${px(plot.height)}" fill="#f9fafb" stroke="#d1d5db" stroke-width="1"/>
  <!-- Y グリッド -->
${yGridLines.join("\n")}
${zeroLine}
  <!-- X 軸ラベル -->
${xTickLabels.join("\n")}
  <!-- 系列 -->
${seriesElements.join("\n")}
  <!-- 凡例 -->
${legendItems}
  <!-- 軸ラベル -->
${xAxisLabel}
${yAxisLabel}
</svg>`;
}
