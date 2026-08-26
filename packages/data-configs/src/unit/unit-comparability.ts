/**
 * 単位の比較可否 classifier (CROSS-PAGE-DATA-SSOT-01 WP3)
 *
 * 2 系列を同じ軸に載せて良いか / 自動換算して良いかを **理由付きで** 判定する。
 * 単位の解釈 (次元・スケール・分母) は `unit-semantics.ts` が正典。ここはその上に
 * 「比較不能なら黙って 1 倍にせず、理由を返して呼び出し側に諦めさせる」層を足す。
 *
 * ★背景 (unit-semantics-standards.md): 換算不能を 1 倍にフォールバックすると桁違いの値が
 *   「一致」と判定され監査が全 PASS で意味を失う。ここは必ず reason 付きで incomparable を返す。
 *
 * 期間 (月額/年額) は**単位文字列に出ない** (subtitle / periodAlign が持つ) ので、
 * 呼び出し側が period を渡したときだけ突き合わせる。円(月額) と 円(年額) は同次元・同スケールで
 * conversionFactor は 1 を返すが、period が違えば比較不能 (12 倍ずれ) — これを classifier が拒否する。
 */
import { conversionFactor, parseUnit } from "./unit-semantics";

export type ComparabilityVerdict = "same" | "convertible" | "incomparable";

export type IncomparableReason =
  | "uninterpretable" // どちらかの単位を解釈できない (dimension null)
  | "dimension-mismatch" // 次元が違う (人 vs 円、％ vs ‰ 等)
  | "base-unit-mismatch" // 同じ count 次元でも計数対象が違う (件 vs 校)
  | "denominator-mismatch" // 分母の有無が違う (人 vs 人口10万対)
  | "period-unknown" // 片側の期間だけ不明
  | "period-mismatch"; // 期間が違う (月額 vs 年額) — period を渡したときのみ

export type ComparabilityResult = { verdict: "same"; factor: 1 } | { verdict: "convertible"; factor: number } | { verdict: "incomparable"; reason: IncomparableReason };

export interface ComparabilityOptions {
  /** 期間セマンティクス (例 "monthly" / "annual")。両方渡したときだけ突き合わせる。 */
  periodA?: string;
  periodB?: string;
}

/**
 * 単位 a, b を比較/自動換算して良いか判定する (pure)。
 * incomparable は必ず reason 付き。1 倍フォールバックはしない。
 */
export function classifyUnitComparability(a: string | null | undefined, b: string | null | undefined, opts: ComparabilityOptions = {}): ComparabilityResult {
  const ua = parseUnit(a);
  const ub = parseUnit(b);

  if (ua.dimension === null || ub.dimension === null) {
    return { verdict: "incomparable", reason: "uninterpretable" };
  }
  if (ua.dimension !== ub.dimension) {
    return { verdict: "incomparable", reason: "dimension-mismatch" };
  }
  if (ua.baseUnit !== ub.baseUnit) {
    return { verdict: "incomparable", reason: "base-unit-mismatch" };
  }
  if (ua.hasDenominator !== ub.hasDenominator) {
    return { verdict: "incomparable", reason: "denominator-mismatch" };
  }
  // 分母の母集団・量のどちらかが違えば自動換算しない。
  if (ua.hasDenominator && ub.hasDenominator) {
    if (ua.denominator?.population !== ub.denominator?.population || ua.denominator?.quantity !== ub.denominator?.quantity) {
      return { verdict: "incomparable", reason: "denominator-mismatch" };
    }
  }

  // 期間は単位文字列に出ない。★片側だけ渡された場合は「同じ」と確認できないので安全側に拒否する
  //   (旧実装は両方揃ったときだけ判定し、片側 period を素通しで same にしていた・2026-08-13 review)。
  const hasPeriodA = opts.periodA !== undefined;
  const hasPeriodB = opts.periodB !== undefined;
  if (hasPeriodA || hasPeriodB) {
    if (hasPeriodA !== hasPeriodB) {
      return { verdict: "incomparable", reason: "period-unknown" };
    }
    if (opts.periodA !== opts.periodB) {
      return { verdict: "incomparable", reason: "period-mismatch" };
    }
  }

  const factor = conversionFactor(a, b);
  // dimension/denominator を上で弾いているので factor は非 null のはず (防御的に null 検査)。
  if (factor === null) return { verdict: "incomparable", reason: "dimension-mismatch" };
  if (factor === 1) return { verdict: "same", factor: 1 };
  return { verdict: "convertible", factor };
}
