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
    const r = classifyUnitComparability("千円", "円");
    expect(r.verdict).toBe("convertible");
    expect(r.factor).toBe(1000);
  });
  it("同一単位は same (factor 1)", () => {
    expect(classifyUnitComparability("人", "人")).toEqual({ verdict: "same", factor: 1 });
  });
});

describe("★比較不能を理由付きで拒否する (1 倍にしない)", () => {
  it("次元違い 人 vs 円 → dimension-mismatch", () => {
    const r = classifyUnitComparability("人", "円");
    expect(r.verdict).toBe("incomparable");
    expect(r.reason).toBe("dimension-mismatch");
  });

  it("％ vs ‰ → dimension-mismatch (10 倍違いを混同しない)", () => {
    const r = classifyUnitComparability("％", "‰");
    expect(r.verdict).toBe("incomparable");
    expect(r.reason).toBe("dimension-mismatch");
  });

  it("人口10万対 vs 素の人 → denominator-mismatch", () => {
    const r = classifyUnitComparability("人（人口10万対）", "人");
    expect(r.verdict).toBe("incomparable");
    expect(r.reason).toBe("denominator-mismatch");
  });

  it("解釈できない単位 → uninterpretable", () => {
    const r = classifyUnitComparability("学級･講座", "円");
    expect(r.verdict).toBe("incomparable");
    expect(r.reason).toBe("uninterpretable");
  });

  it("★月額 vs 年額 (同単位 円) → period-mismatch (単位だけでは同じに見える)", () => {
    // period を渡さなければ同単位として convertible/same になってしまう (単位に期間が出ない)。
    const naive = classifyUnitComparability("円", "円");
    expect(naive.verdict).toBe("same");
    // period を渡すと拒否される。
    const r = classifyUnitComparability("円", "円", { periodA: "monthly", periodB: "annual" });
    expect(r.verdict).toBe("incomparable");
    expect(r.reason).toBe("period-mismatch");
  });

  it("同一 period なら通す (月額 vs 月額)", () => {
    const r = classifyUnitComparability("円", "円", { periodA: "monthly", periodB: "monthly" });
    expect(r.verdict).toBe("same");
  });
});

describe("★再監査で見つけた取りこぼし (2026-08-13 concurrent review)", () => {
  it("分母が両方あるが中身が違う (人口10万対 vs 人口1万対) → denominator-mismatch", () => {
    // 旧実装は hasDenominator の boolean 一致しか見ず、10 倍違う分母を factor 1 で「same」にしていた。
    const r = classifyUnitComparability("人（人口10万対）", "人（人口1万対）");
    expect(r.verdict).toBe("incomparable");
    expect(r.reason).toBe("denominator-mismatch");
  });

  it("分母が両方あって同じ (人口10万対 vs 人口10万対) は通す (誤検出しない)", () => {
    const r = classifyUnitComparability("人（人口10万対）", "人（人口10万対）");
    expect(r.verdict).toBe("same");
  });

  it("片側だけ period を渡した (monthly vs 不明) → period-mismatch (same にしない)", () => {
    // periodB が不明なら「同じ」と確認できない。安全側に倒して拒否する。
    const r = classifyUnitComparability("円", "円", { periodA: "monthly" });
    expect(r.verdict).toBe("incomparable");
    expect(r.reason).toBe("period-mismatch");
    const r2 = classifyUnitComparability("円", "円", { periodB: "annual" });
    expect(r2.verdict).toBe("incomparable");
    expect(r2.reason).toBe("period-mismatch");
  });
});
