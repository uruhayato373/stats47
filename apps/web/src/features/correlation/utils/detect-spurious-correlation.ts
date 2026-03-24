/**
 * 偏相関係数から疑似相関かどうかを判定する。
 *
 * ピアソン相関が強い（|r| >= 0.7）にもかかわらず、
 * 交絡変数を制御した偏相関係数の最小絶対値が 0.5 未満の場合、
 * 疑似相関の可能性が高い。
 */
export function detectSpuriousCorrelation(
  pearsonR: number,
  partials: (number | null)[],
): boolean {
  const validPartials = partials.filter((v): v is number => v !== null);
  if (validPartials.length === 0) return false;

  const effectiveR = Math.min(...validPartials.map(Math.abs));
  return Math.abs(pearsonR) >= 0.7 && effectiveR < 0.5;
}
