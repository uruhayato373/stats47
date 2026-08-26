import { describe, expect, it } from "vitest";

import { classifyUnitComparability } from "../unit-comparability";

/**
 * WP3 — 単位 classifier の mutation test。
 *
 * ★unit-semantics-standards.md が挙げる比較不能ケースを理由付きで拒否することを両方向で固定する:
 *   %/割合、人口10万対 (分母)、月額/年額 (期間)、分母違い。1 倍フォールバックしないことが芯。
 */

describe("換算可能なケース", () => {
  it("千円 → 円 は convertible (factor 1000)", () => {
    expect(classifyUnitComparability("千円", "円")).toEqual({
      verdict: "convertible",
      factor: 1000,
    });
  });
  it("同一単位は same (factor 1)", () => {
    expect(classifyUnitComparability("人", "人")).toEqual({
      verdict: "same",
      factor: 1,
    });
  });

  it.each([
    ["kg", "g", 1_000],
    ["g", "kg", 0.001],
    ["km", "m", 1_000],
    ["m", "km", 0.001],
    ["l", "ml", 1_000],
    ["ml", "l", 0.001],
    ["kWh", "MWh", 0.001],
    ["MWh", "kWh", 1_000],
  ])("★%s → %s は factor %s", (from, to, factor) => {
    expect(classifyUnitComparability(from, to)).toEqual({
      verdict: "convertible",
      factor,
    });
  });
});

describe("★比較不能を理由付きで拒否する (1 倍にしない)", () => {
  it("次元違い 人 vs 円 → dimension-mismatch", () => {
    expect(classifyUnitComparability("人", "円")).toEqual({
      verdict: "incomparable",
      reason: "dimension-mismatch",
    });
  });

  it("％ vs ‰ → dimension-mismatch (10 倍違いを混同しない)", () => {
    expect(classifyUnitComparability("％", "‰")).toEqual({
      verdict: "incomparable",
      reason: "dimension-mismatch",
    });
  });

  it("人口10万対 vs 素の人 → denominator-mismatch", () => {
    expect(classifyUnitComparability("人（人口10万対）", "人")).toEqual({
      verdict: "incomparable",
      reason: "denominator-mismatch",
    });
  });

  it("解釈できない単位 → uninterpretable", () => {
    expect(classifyUnitComparability("学級･講座", "円")).toEqual({
      verdict: "incomparable",
      reason: "uninterpretable",
    });
  });

  it.each([
    ["件", "校"],
    ["校", "件"],
  ])("★異なる計数単位 %s → %s は base-unit-mismatch", (from, to) => {
    expect(classifyUnitComparability(from, to)).toEqual({
      verdict: "incomparable",
      reason: "base-unit-mismatch",
    });
  });

  it("★月額 vs 年額 (同単位 円) → period-mismatch (単位だけでは同じに見える)", () => {
    // period を渡さなければ同単位として convertible/same になってしまう (単位に期間が出ない)。
    const naive = classifyUnitComparability("円", "円");
    expect(naive.verdict).toBe("same");
    // period を渡すと拒否される。
    expect(
      classifyUnitComparability("円", "円", {
        periodA: "monthly",
        periodB: "annual",
      }),
    ).toEqual({ verdict: "incomparable", reason: "period-mismatch" });
  });

  it("同一 period なら通す (月額 vs 月額)", () => {
    const r = classifyUnitComparability("円", "円", {
      periodA: "monthly",
      periodB: "monthly",
    });
    expect(r.verdict).toBe("same");
  });
});

describe("★再監査で見つけた取りこぼし (2026-08-13 concurrent review)", () => {
  it("分母が両方あるが中身が違う (人口10万対 vs 人口1万対) → denominator-mismatch", () => {
    // 旧実装は hasDenominator の boolean 一致しか見ず、10 倍違う分母を factor 1 で「same」にしていた。
    expect(classifyUnitComparability("人（人口10万対）", "人（人口1万対）")).toEqual({ verdict: "incomparable", reason: "denominator-mismatch" });
  });

  it("分母が両方あって同じ (人口10万対 vs 人口10万対) は通す (誤検出しない)", () => {
    const r = classifyUnitComparability("人（人口10万対）", "人（人口10万対）");
    expect(r.verdict).toBe("same");
  });

  it("片側だけ period を渡した (monthly vs 不明) → period-unknown (same にしない)", () => {
    // periodB が不明なら「同じ」と確認できない。安全側に倒して拒否する。
    expect(classifyUnitComparability("円", "円", { periodA: "monthly" })).toEqual({ verdict: "incomparable", reason: "period-unknown" });
    expect(classifyUnitComparability("円", "円", { periodB: "annual" })).toEqual({ verdict: "incomparable", reason: "period-unknown" });
  });

  it.each([
    ["人口10万対", "人口千対"],
    ["人口千対", "人口10万対"],
  ])("★分母量が違う %s → %s は自動換算しない", (from, to) => {
    expect(classifyUnitComparability(from, to)).toEqual({
      verdict: "incomparable",
      reason: "denominator-mismatch",
    });
  });
});
