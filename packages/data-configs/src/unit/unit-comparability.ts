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

/** 分母つき単位の分母 (括弧内) を取り出す。無ければ null。例 "人（人口10万対）" → "人口10万対"。 */
function extractDenominator(normalized: string): string | null {
  const m = normalized.match(/[（(](.+?)[）)]/);
  return m ? m[1].trim() : null;
}

export type ComparabilityVerdict = "same" | "convertible" | "incomparable";

export type IncomparableReason =
  | "uninterpretable" // どちらかの単位を解釈できない (dimension null)
  | "dimension-mismatch" // 次元が違う (人 vs 円、％ vs ‰ 等)
  | "denominator-mismatch" // 分母の有無が違う (人 vs 人口10万対)
  | "period-mismatch"; // 期間が違う (月額 vs 年額) — period を渡したときのみ

export interface ComparabilityResult {
  verdict: ComparabilityVerdict;
  /** convertible のとき: a の値を b 単位で表す倍率。same なら 1。 */
  factor?: number;
  /** incomparable のとき: なぜ比べられないか。 */
  reason?: IncomparableReason;
}

export interface ComparabilityOptions {
  /** 期間セマンティクス (例 "monthly" / "annual")。両方渡したときだけ突き合わせる。 */
  periodA?: string;
  periodB?: string;
}

/**
 * 単位 a, b を比較/自動換算して良いか判定する (pure)。
 * incomparable は必ず reason 付き。1 倍フォールバックはしない。
 */
export function classifyUnitComparability(
  a: string | null | undefined,
  b: string | null | undefined,
  opts: ComparabilityOptions = {},
): ComparabilityResult {
  const ua = parseUnit(a);
  const ub = parseUnit(b);

  if (ua.dimension === null || ub.dimension === null) {
    return { verdict: "incomparable", reason: "uninterpretable" };
  }
  if (ua.dimension !== ub.dimension) {
    return { verdict: "incomparable", reason: "dimension-mismatch" };
  }
  if (ua.hasDenominator !== ub.hasDenominator) {
    return { verdict: "incomparable", reason: "denominator-mismatch" };
  }
  // ★分母が両方あっても中身が違えば比較不能 (人口10万対 vs 人口1万対 は 10 倍違う)。
  //   hasDenominator の boolean 一致だけでは取りこぼす (2026-08-13 review)。差があれば安全側に拒否する。
  if (ua.hasDenominator && ub.hasDenominator) {
    const da = extractDenominator(ua.normalized);
    const db = extractDenominator(ub.normalized);
    if (da !== null && db !== null && da !== db) {
      return { verdict: "incomparable", reason: "denominator-mismatch" };
    }
  }

  // 期間は単位文字列に出ない。★片側だけ渡された場合は「同じ」と確認できないので安全側に拒否する
  //   (旧実装は両方揃ったときだけ判定し、片側 period を素通しで same にしていた・2026-08-13 review)。
  const hasPeriodA = opts.periodA !== undefined;
  const hasPeriodB = opts.periodB !== undefined;
  if (hasPeriodA || hasPeriodB) {
    if (hasPeriodA !== hasPeriodB || opts.periodA !== opts.periodB) {
      return { verdict: "incomparable", reason: "period-mismatch" };
    }
  }

  const factor = conversionFactor(a, b);
  // dimension/denominator を上で弾いているので factor は非 null のはず (防御的に null 検査)。
  if (factor === null) return { verdict: "incomparable", reason: "dimension-mismatch" };
  return { verdict: factor === 1 ? "same" : "convertible", factor };
}
