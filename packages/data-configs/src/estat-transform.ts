/**
 * e-Stat 応答の値を組み立てる純粋関数。
 *
 * I/O (fetch・R2) は `scripts/page-data-batch.ts` が持ち、ここには**算術と欠測の扱い**だけを置く
 * (`shape-gate.ts` と同じ分離)。欠測の扱いは「0 を捏造しない」が全体の方針で、
 * 取り違えると「貨物量 0 トンの県」「空き家率 0% の県」といった実在しない事実を配信してしまう。
 */

/** e-Stat の欠測を表す出力値。page-data-batch の parseEstatValue が null に落とす */
export const MISSING = "-";

/** 小数第 1 位に丸める (元データの精度に合わせ、浮動小数の誤差を落とす) */
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/**
 * 軸メンバーの合算。
 *
 * - 欠測メンバーは **0 扱い** (その県にその区分が無いだけ)
 * - **全メンバーが欠測なら null** (合算せず欠測。0 を捏造しない)
 */
export function sumMembers(values: ReadonlyArray<number | null>): number | null {
  let sum = 0;
  let present = 0;
  for (const v of values) {
    if (v === null) continue;
    sum += v;
    present++;
  }
  return present === 0 ? null : sum;
}

/**
 * 線形結合 (年収 = 月額 × 12 + 賞与 × 1)。
 *
 * **1 つでも欠測なら null**。合算と違い部分和は無意味だから
 * (「賞与だけの年収」を配信してしまう)。
 */
export function combineLinear(
  terms: ReadonlyArray<{ value: number | null; factor: number }>,
): number | null {
  let sum = 0;
  for (const { value, factor } of terms) {
    if (value === null) return null;
    sum += value * factor;
  }
  return round1(sum);
}

/**
 * 率 (分子 / 分母 × 100)。
 *
 * 欠測にするケース:
 *   - 分母が null → 母数不明
 *   - 分母が 0 以下 → 0 除算。「0% の県」を捏造しない
 *   - 分子が null → 分子不明を 0% と言い切らない
 *
 * 分子が分母を超える組み合わせ (取り違え) はここでは弾かない。値域の判定は
 * shape-gate の percent 検査が全県まとめて見る (1 県だけ 100 超の正当なケースと
 * 全県 100 超の取り違えを区別するため)。
 */
export function ratioPercent(numerator: number | null, denominator: number | null): number | null {
  if (denominator === null || denominator <= 0) return null;
  if (numerator === null) return null;
  return round1((numerator / denominator) * 100);
}

/** number | null → e-Stat 出力文字列 */
export function toEstatValue(n: number | null): string {
  return n === null ? MISSING : String(n);
}
