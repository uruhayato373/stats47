/**
 * 分布のビン (binMunicipalityValues 由来) の横軸の両端のラベル。
 * ランキングページのヒストグラム (DistributionHistogram) とテーマ一覧カードのミニチャート (MiniDistributionBars) が共用する。
 * 裾を畳んだビンは「N 未満」「N 以上」と書く。
 */

export interface DistributionEdgeBin {
  x0: number;
  x1: number;
  isOverflow: boolean;
  isUnderflow: boolean;
}

// 軸端のスケールラベル。既定丸め (有効 2 桁: 46万 / 2.3万) で十分
const compactFormat = new Intl.NumberFormat("ja-JP", { notation: "compact" });

export function formatDistributionValue(value: number): string {
  return compactFormat.format(value);
}

/** unit は表示用に整えた単位 (formatUnitForDisplay の結果) を渡す。ビンが無ければ null */
export function distributionEdgeLabels(
  bins: readonly DistributionEdgeBin[],
  unit: string,
): { min: string; max: string } | null {
  const first = bins[0];
  const last = bins.at(-1);
  if (!first || !last) return null;
  return {
    min: first.isUnderflow
      ? `${compactFormat.format(first.x1)}${unit} 未満`
      : `${compactFormat.format(first.x0)}${unit}`,
    max: last.isOverflow
      ? `${compactFormat.format(last.x0)}${unit} 以上`
      : `${compactFormat.format(last.x1)}${unit}`,
  };
}
