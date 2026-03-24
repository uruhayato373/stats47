/**
 * チャートの Y 軸ドメイン（最小値・最大値）を値の範囲に応じて自動計算する。
 *
 * - 値の桁数に応じて丸め単位を自動決定
 * - 上下に padding（データ範囲の 15%）を追加
 * - min は 0 以上を保証（率・量など負にならないデータ向け）
 *
 * Remotion (RankingBoxplot) と Web (BoxplotChart) の両方で使用する。
 */
export interface AxisDomain {
  /** Y 軸の最小値（丸め済み） */
  min: number;
  /** Y 軸の最大値（丸め済み） */
  max: number;
  /** 丸めに使用した単位 */
  step: number;
}

/**
 * 値の範囲に適した丸め単位を決定する。
 *
 * 例:
 * - range 0.5  → step 0.1
 * - range 3    → step 0.5
 * - range 15   → step 5
 * - range 80   → step 10
 * - range 500  → step 100
 */
function computeStep(range: number): number {
  if (range <= 0) return 1;

  // 10 のべき乗で桁を取得（range=80 → magnitude=10）
  const magnitude = 10 ** Math.floor(Math.log10(range));

  // range / magnitude は 1〜10 の間になる
  const normalized = range / magnitude;

  // normalized の大きさに応じて step を決定
  if (normalized <= 2) return magnitude * 0.5;
  if (normalized <= 5) return magnitude;
  return magnitude * 2;
}

export function computeAxisDomain(
  values: number[],
  options?: {
    /** 上下パディングの割合（デフォルト: 0.15） */
    paddingRatio?: number;
    /** min を 0 以上に制約するか（デフォルト: true） */
    clampMinToZero?: boolean;
  },
): AxisDomain {
  const { paddingRatio = 0.15, clampMinToZero = true } = options ?? {};

  if (values.length === 0) {
    return { min: 0, max: 100, step: 10 };
  }

  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  const dataRange = dataMax - dataMin;

  // 全値が同一の場合
  if (dataRange === 0) {
    const step = computeStep(Math.abs(dataMin) || 1);
    const min = clampMinToZero
      ? Math.max(0, Math.floor((dataMin - step) / step) * step)
      : Math.floor((dataMin - step) / step) * step;
    const max = Math.ceil((dataMax + step) / step) * step;
    return { min, max, step };
  }

  const padding = dataRange * paddingRatio;
  const step = computeStep(dataRange);

  const rawMin = dataMin - padding;
  const rawMax = dataMax + padding;

  const min = clampMinToZero
    ? Math.max(0, Math.floor(rawMin / step) * step)
    : Math.floor(rawMin / step) * step;
  const max = Math.ceil(rawMax / step) * step;

  return { min, max, step };
}
