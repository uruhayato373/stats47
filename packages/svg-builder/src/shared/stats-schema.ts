/**
 * svg-builder 向け StatsSchema 型定義・データ抽出・型変換ユーティリティ
 *
 * packages/types の StatsSchema と同一構造を持つ。
 * svg-builder は依存パッケージを増やさないため、ここで再定義する。
 *
 * ## StatsSchema → 各チャート型への変換
 *
 * ```ts
 * // 横棒グラフ
 * generateBarChartSvg(toSplitItems(data, 5, 5), options);
 *
 * // コロプレス
 * generateChoroplethSvg(toChoroplethItems(data), options);
 *
 * // 散布図（2指標を都道府県コードで結合）
 * generateScatterSvg(joinStats(xData, yData), options);
 * ```
 */

export interface StatsSchema {
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName: string;
  categoryCode: string;
  categoryName: string;
  value: number;
  unit: string;
}

/** StatsSchema の次元キー */
export type DimensionKey = "areaCode" | "yearCode" | "categoryCode";

interface LabeledItem {
  code: string;
  name: string;
}

const NAME_KEY: Record<DimensionKey, "areaName" | "yearName" | "categoryName"> = {
  areaCode: "areaName",
  yearCode: "yearName",
  categoryCode: "categoryName",
};

/**
 * 指定したキーのユニーク値を出現順で返す
 */
export function uniqueDimension(data: StatsSchema[], key: DimensionKey): LabeledItem[] {
  const seen = new Map<string, string>();
  for (const d of data) {
    if (!seen.has(d[key])) seen.set(d[key], d[NAME_KEY[key]]);
  }
  return Array.from(seen.entries()).map(([code, name]) => ({ code, name }));
}

/**
 * xKey × seriesKey → value のルックアップマップを返す
 */
export function buildValueMap(
  data: StatsSchema[],
  xKey: DimensionKey,
  seriesKey: DimensionKey,
): Map<string, Map<string, number>> {
  const map = new Map<string, Map<string, number>>();
  for (const d of data) {
    if (!map.has(d[xKey])) map.set(d[xKey], new Map());
    map.get(d[xKey])!.set(d[seriesKey], d.value);
  }
  return map;
}

// ─── StatsSchema → 各チャート型への変換 ─────────────────────────────────────

/**
 * ワースト N 件（値が大きい順・先頭から）を横棒グラフ用アイテムに変換する
 */
export function toWorstItems(
  data: StatsSchema[],
  n = 10,
): { label: string; value: number }[] {
  return data.slice(0, n).map((d, i) => ({
    label: `${i + 1}位 ${d.areaName}`,
    value: d.value,
  }));
}

/**
 * ベスト N 件（値が小さい順・末尾から）を横棒グラフ用アイテムに変換する
 */
export function toBestItems(
  data: StatsSchema[],
  n = 10,
): { label: string; value: number }[] {
  return [...data]
    .slice(-n)
    .reverse()
    .map((d, i) => ({
      label: `${i + 1}位 ${d.areaName}`,
      value: d.value,
    }));
}

/**
 * ワースト topN 件とベスト bottomN 件をセパレーターで繋いだアイテムリストを生成する
 */
export function toSplitItems(
  data: StatsSchema[],
  topN = 5,
  bottomN = 5,
): { label: string; value: number; isSeparator?: boolean }[] {
  return [
    ...toWorstItems(data, topN),
    { label: "…", value: 0, isSeparator: true },
    ...toBestItems(data, bottomN),
  ];
}

/**
 * StatsSchema[] をコロプレスマップ用アイテムに変換する
 */
export function toChoroplethItems(
  data: StatsSchema[],
): { code: string; name: string; value: number }[] {
  return data.map((d) => ({
    code: d.areaCode,
    name: d.areaName,
    value: d.value,
  }));
}

/**
 * 2 つの StatsSchema[] を都道府県コードで JOIN して散布図用ポイントに変換する
 * （旧: joinRankingData）
 */
export function joinStats(
  xData: StatsSchema[],
  yData: StatsSchema[],
): { name: string; code: string; x: number; y: number }[] {
  const yMap = new Map(yData.map((d) => [d.areaCode, d.value]));
  return xData
    .map((d) => ({ name: d.areaName, code: d.areaCode, x: d.value, y: yMap.get(d.areaCode) }))
    .filter((p): p is { name: string; code: string; x: number; y: number } => p.y !== undefined);
}
