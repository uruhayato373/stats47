/**
 * ミニタイルグリッドSVG生成（サーバーサイド専用）
 *
 * 47都道府県のタイルグリッドを軽量SVG文字列として生成する。
 * DB に登録された色スキームを named import で解決する（d3 barrel 回避）。
 *
 * わかりやすさの設計 (2026-07-11):
 * - 配色は「値」ではなく「順位」ベース。値ベースは外れ値 (例: 東京の人口) で
 *   大半のタイルが最薄色に潰れて差が見えないため、順位パーセンタイルで塗る
 * - 1位の都道府県タイルを金リングで強調 (カードの「1位 ○○」表示と視覚連動)
 * - 下部に「47位 → 1位」の凡例グラデーションを付け、色の意味を自明にする
 */

import {
  interpolateBlues,
  interpolateGreens,
  interpolateOranges,
  interpolatePiYG,
  interpolatePurples,
  interpolateRdBu,
  interpolateRdYlBu,
  interpolateRdYlGn,
  interpolateReds,
} from "d3-scale-chromatic";

import { TILE_GRID_LAYOUT } from "../d3/constants/tile-grid-layout";

const INTERPOLATORS: Record<string, (t: number) => string> = {
  interpolateBlues,
  interpolateGreens,
  interpolateOranges,
  interpolatePiYG,
  interpolatePurples,
  interpolateRdBu,
  interpolateRdYlBu,
  interpolateRdYlGn,
  interpolateReds,
};

const NO_DATA_COLOR = "#e5e7eb";
/** 1位タイル・凡例サンプルの強調リング色 (金メダル連想のアンバー) */
const TOP_RING_COLOR = "#f59e0b";
/** 凡例テキスト色 (ライト/ダーク両モードで可読なミディアムグレー) */
const LEGEND_TEXT_COLOR = "#64748b";
/** 配色の飽和域。最薄側を切り上げて「白に沈んで見えない」タイルをなくす */
const T_MIN = 0.18;
const T_MAX = 0.95;

/**
 * ミニタイルグリッドSVGを生成
 *
 * @param data 47都道府県の値。`rank` があれば順位ベース配色に直接使う
 *             (無ければ value から導出: 降順、isReversed 時は昇順)
 * @param colorScheme d3 interpolator 名 (デフォルト interpolateBlues)
 * @param isReversed rank 導出時の方向反転 (値が小さいほど上位のランキング)
 * @param gradientIdSuffix 凡例 linearGradient の一意 id 用サフィックス
 *                         (同一ページに複数 SVG をインライン展開しても id 衝突しないように
 *                         呼び元が rankingKey を渡す)
 */
export function generateMiniTileSvg(
  data: Array<{ areaCode: string; value: number; rank?: number }>,
  colorScheme?: string,
  isReversed?: boolean,
  gradientIdSuffix?: string,
): string {
  const interpolator =
    INTERPOLATORS[colorScheme ?? "interpolateBlues"] ?? INTERPOLATORS.interpolateBlues;

  // rank 未提供の項目のために値から順位を導出 (1 = 上位)
  const sorted = [...data].sort((a, b) => (isReversed ? a.value - b.value : b.value - a.value));
  const derivedRank = new Map<string, number>();
  sorted.forEach((d, i) => derivedRank.set(d.areaCode, i + 1));

  const n = data.length;

  // areaCode "01000" → prefCode 1、順位パーセンタイル → 色の t 値
  const tMap = new Map<number, number>();
  let topPrefCode: number | undefined;
  for (const d of data) {
    const prefCode = parseInt(d.areaCode.substring(0, 2), 10);
    const rank = d.rank ?? derivedRank.get(d.areaCode) ?? n;
    const rankT = n > 1 ? (n - rank) / (n - 1) : 0.5; // 1位=1 → 最下位=0
    tMap.set(prefCode, T_MIN + rankT * (T_MAX - T_MIN));
    if (rank === 1 && topPrefCode === undefined) topPrefCode = prefCode;
  }

  // セル描画。1位タイルは最後に描いて金リングを他タイルの枠線の上に立たせる
  const rects: string[] = [];
  let topRect = "";
  for (const cell of TILE_GRID_LAYOUT) {
    const t = tMap.get(cell.id);
    const w = cell.w ?? 1;
    const h = cell.h ?? 1;
    const fill = t !== undefined ? interpolator(t) : NO_DATA_COLOR;
    if (cell.id === topPrefCode) {
      topRect = `<rect x="${cell.x}" y="${cell.y}" width="${w}" height="${h}" rx=".12" fill="${fill}" stroke="${TOP_RING_COLOR}" stroke-width=".22"/>`;
    } else {
      rects.push(
        `<rect x="${cell.x}" y="${cell.y}" width="${w}" height="${h}" rx=".12" fill="${fill}" stroke="#fff" stroke-width=".08"/>`,
      );
    }
  }
  if (topRect) rects.push(topRect);

  // 凡例 (47位 → 1位 のグラデーション + 金リング付き1位サンプル)
  const gid = `mtg-${(gradientIdSuffix ?? String(n)).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const stops = [0, 0.25, 0.5, 0.75, 1]
    .map(
      (p) =>
        `<stop offset="${p * 100}%" stop-color="${interpolator(T_MIN + p * (T_MAX - T_MIN))}"/>`,
    )
    .join("");
  const legend =
    `<defs><linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>` +
    `<text x="0" y="17.45" font-size=".72" fill="${LEGEND_TEXT_COLOR}" font-family="sans-serif">47位</text>` +
    `<rect x="2.15" y="16.85" width="8.6" height=".72" rx=".12" fill="url(#${gid})"/>` +
    `<rect x="11.15" y="16.72" width=".95" height=".95" rx=".12" fill="${interpolator(T_MAX)}" stroke="${TOP_RING_COLOR}" stroke-width=".16"/>` +
    `<text x="12.4" y="17.45" font-size=".72" font-weight="bold" fill="${LEGEND_TEXT_COLOR}" font-family="sans-serif">1位</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 16 18.5" preserveAspectRatio="xMidYMid meet">${rects.join("")}${legend}</svg>`;
}
