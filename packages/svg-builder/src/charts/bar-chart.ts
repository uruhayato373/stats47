/**
 * 横棒グラフ SVG 生成
 *
 * ランキング上位・下位N件の水平バーチャートを静的 SVG 文字列として出力する。
 *
 * ## セパレーターの使い方
 * isSeparator: true のアイテムを挿入すると、その行に破線と「…中略…」を描画する。
 * 上位N件と下位N件を1枚のチャートにまとめる場合に使用する。
 *
 * ```ts
 * import { toSplitItems } from "../shared/stats-schema";
 * const items = toSplitItems(data, 5, 5);
 * ```
 *
 * ## xMin の使い方
 * X 軸を 0 以外から始めたい場合に指定する（例: 保険普及率 20〜60%）。
 * 未指定時は 0 スタート。
 */

import { niceScale, formatTick } from "../shared/axis";
import { FONT_FAMILY, PALETTES, PaletteName, colorByIndex } from "../shared/color";

export interface BarItem {
  /** 表示ラベル（例: "1位 徳島"） */
  label: string;
  /** 数値 */
  value: number;
  /**
   * true のとき、バーを描画せず破線と「…中略…」を表示する区切り行にする。
   * value は参照されない。
   */
  isSeparator?: boolean;
}

export interface BarChartOptions {
  /** チャートタイトル */
  title: string;
  /**
   * サブタイトル（年度・単位の説明など）。
   * タイトルと同じ行に小さいグレー文字で表示する（tspan）。
   */
  subtitle?: string;
  /** X 軸ラベル（showAxis: true のときのみ描画） */
  unit: string;
  /** aria-label */
  ariaLabel?: string;
  /** カラーパレット名。デフォルト: "red" */
  palette?: PaletteName;
  /** パレットの代わりにインデックス→色の関数を渡す場合 */
  colorFn?: (index: number) => string;
  /**
   * X 軸の起点値。デフォルト: 0。
   * 例: 保険普及率のように最小値が 20% 付近の場合は 0 より大きい値を指定すると
   * バーの長さの差異が視覚的に分かりやすくなる。
   */
  xMin?: number;
  /**
   * X 軸・グリッド線・軸ラベルを描画するか。デフォルト: false。
   * xMin を 0 以外に設定する場合など、スケール感を明示したいときに true を指定する。
   */
  showAxis?: boolean;
}

const W = 600;          // 内部座標幅（viewBox）
const DISPLAY_W = 780;  // 表示幅（Obsidian / Markdown での横幅確保のため）
const LABEL_X = 90;     // バー開始 X
const BAR_AREA_W = 470; // バー最大幅
const BAR_H = 18;
const ROW_H = 26;
const SEPARATOR_H = 20; // 区切り行の高さ

/**
 * 横棒グラフ SVG を生成する
 */
export function generateBarChartSvg(items: BarItem[], options: BarChartOptions): string {
  const {
    title,
    subtitle,
    unit,
    ariaLabel = title,
    palette = "red",
    colorFn,
    xMin = 0,
    showAxis = false,
  } = options;

  const firstY = 36;

  // セパレーターを除いた実データから最大値を求める
  const dataItems = items.filter((d) => !d.isSeparator);
  const maxVal = Math.max(...dataItems.map((d) => d.value), xMin + 1);
  const { max: scaleMax, step } = niceScale(maxVal - xMin);

  // xMin を考慮したスケール変換
  const toBarWidth = (v: number) => ((v - xMin) / (scaleMax)) * BAR_AREA_W;

  const getColor = colorFn ?? ((i: number) => colorByIndex(PALETTES[palette], i));

  // 全行の高さを事前に計算（セパレーター行はバー行より短い）
  const rowHeights = items.map((d) => (d.isSeparator ? SEPARATOR_H : ROW_H));
  const totalRowsH = rowHeights.reduce((s, h) => s + h, 0);

  // 各行の Y 座標
  const rowYs = items.map((_, i) => {
    let y = firstY;
    for (let j = 0; j < i; j++) y += rowHeights[j];
    return y;
  });

  const lastRowY = rowYs[rowYs.length - 1] ?? firstY;
  const lastRowH = rowHeights[rowHeights.length - 1] ?? ROW_H;
  const barsBottom = lastRowY + lastRowH;
  const totalH = barsBottom + (showAxis ? 38 : 8);

  // グリッド目盛り（showAxis: true のときのみ生成）
  const gridLines: string[] = [];
  if (showAxis) {
    // xMin の縦線（ゼロ軸）
    gridLines.push(
      `  <line x1="${LABEL_X}" y1="${firstY}" x2="${LABEL_X}" y2="${barsBottom}" stroke="#ccc" stroke-width="1"/>`,
    );
    // scaleMax までの目盛り
    for (let v = step; v <= scaleMax + step * 0.01; v += step) {
      const dataVal = xMin + v;
      const x = (LABEL_X + toBarWidth(dataVal)).toFixed(0);
      gridLines.push(
        `  <line x1="${x}" y1="${firstY}" x2="${x}" y2="${barsBottom}" stroke="#ebebeb" stroke-width="1" stroke-dasharray="4,3"/>`,
        `  <text x="${x}" y="${(barsBottom + 13).toFixed(0)}" text-anchor="middle" font-size="10" fill="#bbb">${formatTick(dataVal, 1)}</text>`,
      );
    }
  }

  // バー・セパレーター行
  let barIndex = 0; // セパレーター除外のインデックス（色計算用）
  const rows: string[] = items.map((d, i) => {
    const y = rowYs[i];

    if (d.isSeparator) {
      const midY = y + SEPARATOR_H / 2;
      return [
        `  <line x1="${LABEL_X}" y1="${midY}" x2="${LABEL_X + BAR_AREA_W}" y2="${midY}" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4 3"/>`,
        `  <text x="${LABEL_X + BAR_AREA_W / 2}" y="${midY + 4}" text-anchor="middle" font-size="9" fill="#9ca3af">…中略…</text>`,
      ].join("\n");
    }

    const idx = barIndex++;
    const w = Math.max(0, Math.round(toBarWidth(d.value)));
    const fill = getColor(idx);
    const midY = y + 13;
    const valX = LABEL_X + w + 4;
    const valStr = formatTick(d.value, 1);
    return [
      `  <rect x="${LABEL_X}" y="${y}" width="${w}" height="${BAR_H}" fill="${fill}" rx="2"/>`,
      `  <text x="${LABEL_X - 5}" y="${midY}" text-anchor="end" font-size="12" fill="#444">${d.label}</text>`,
      `  <text x="${valX}" y="${midY}" font-size="12" fill="#666" font-weight="bold">${valStr}</text>`,
    ].join("\n");
  });

  const titleText = subtitle
    ? `${title}<tspan font-size="10" font-weight="normal" fill="#888">　${subtitle}</tspan>`
    : title;
  const displayH = Math.round((DISPLAY_W / W) * totalH);

  return `<svg width="${DISPLAY_W}" height="${displayH}" viewBox="0 0 ${W} ${totalH}" xmlns="http://www.w3.org/2000/svg" font-family="${FONT_FAMILY}" role="img" aria-label="${ariaLabel}">
  <rect width="${W}" height="${totalH}" fill="#fafafa" rx="6"/>
  <text x="${W / 2}" y="22" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">${titleText}</text>
${gridLines.join("\n")}${showAxis ? `\n  <!-- 軸ラベル -->\n  <text x="${W / 2}" y="${totalH - 4}" text-anchor="middle" font-size="10" fill="#aaa">${unit}</text>` : ""}
${rows.join("\n")}
</svg>`;
}

