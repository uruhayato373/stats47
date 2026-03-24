/**
 * 統計計算ユーティリティ
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
}

/**
 * 最小二乗法による単回帰直線を計算する
 * y = slope * x + intercept
 */
export function linearRegression(
  points: ReadonlyArray<{ x: number; y: number }>,
): RegressionResult {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  const sx = points.reduce((s, p) => s + p.x, 0);
  const sy = points.reduce((s, p) => s + p.y, 0);
  const sxy = points.reduce((s, p) => s + p.x * p.y, 0);
  const sx2 = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sx2 - sx * sx;
  if (denom === 0) return { slope: 0, intercept: sy / n };

  const slope = (n * sxy - sx * sy) / denom;
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}
