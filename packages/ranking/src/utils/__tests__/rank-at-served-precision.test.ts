import { describe, expect, it } from "vitest";

import { decimalsOf, rankAtServedPrecision } from "../rank-at-served-precision";

describe("rankAtServedPrecision", () => {
  it("丸めて同じ値になった県は同順位にする (配信値の付け方と同じ)", () => {
    const computed = [
      { areaCode: "27000", value: 5.49, rank: 1 },
      { areaCode: "07000", value: 4.24, rank: 2 },
      { areaCode: "44000", value: 4.16, rank: 3 },
      { areaCode: "01000", value: 3.0, rank: 4 },
    ];
    const ranks = rankAtServedPrecision(computed, decimalsOf([5.5, 4.2, 4.2, 3]));
    expect([...ranks.values()].map((r) => r.rank)).toEqual([1, 2, 2, 4]);
    expect(ranks.get("44000")).toEqual({ value: 4.2, rank: 2 });
  });

  it("小さいほど上位の指標は向きを再計算の順位から読み取る", () => {
    const computed = [
      { areaCode: "a", value: 1.04, rank: 1 },
      { areaCode: "b", value: 1.01, rank: 1 },
      { areaCode: "c", value: 2.5, rank: 3 },
    ].map((c, i) => ({ ...c, rank: [2, 1, 3][i] }));
    const ranks = rankAtServedPrecision(computed, 1);
    expect(ranks.get("a")?.rank).toBe(1);
    expect(ranks.get("b")?.rank).toBe(1);
    expect(ranks.get("c")?.rank).toBe(3);
  });
});
