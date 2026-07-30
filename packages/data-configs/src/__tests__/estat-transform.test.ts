import { describe, expect, it } from "vitest";

import { combineLinear, ratioPercent, round1, sumMembers, toEstatValue } from "../estat-transform";

describe("sumMembers — 合算 (欠測メンバーは 0 扱い)", () => {
  it("全部そろっていれば単純な和", () => {
    expect(sumMembers([10, 20, 5])).toBe(35);
  });

  it("★一部欠測は 0 扱いで合算する (その県にその区分が無いだけ)", () => {
    // 港湾: 岩手は一般貨物のみで自動車航送船が無い。足せば全県そろう
    expect(sumMembers([10, null])).toBe(10);
  });

  it("★全メンバー欠測なら null (0 を捏造しない)", () => {
    // 0 にすると「貨物量 0 トンの県」という実在しない事実を配信してしまう
    expect(sumMembers([null, null])).toBeNull();
  });

  it("実値の 0 と欠測を区別する", () => {
    expect(sumMembers([0, null])).toBe(0);
    expect(sumMembers([null])).toBeNull();
  });

  it("空配列は null", () => {
    expect(sumMembers([])).toBeNull();
  });
});

describe("combineLinear — 線形結合 (部分和を配信しない)", () => {
  it("年収 = 月額 × 12 + 賞与", () => {
    expect(combineLinear([
      { value: 307.6, factor: 12 },
      { value: 375.4, factor: 1 },
    ])).toBe(4066.6);
  });

  it("★浮動小数の誤差を落とす (4066.6000000000004 にしない)", () => {
    const v = combineLinear([{ value: 307.6, factor: 12 }, { value: 375.4, factor: 1 }]);
    expect(String(v)).toBe("4066.6");
  });

  it("★1 つでも欠測なら null (合算と違い部分和は無意味)", () => {
    // 賞与だけの「年収」を配信してしまうため
    expect(combineLinear([{ value: 307.6, factor: 12 }, { value: null, factor: 1 }])).toBeNull();
    expect(combineLinear([{ value: null, factor: 12 }, { value: 375.4, factor: 1 }])).toBeNull();
  });
});

describe("ratioPercent — 率", () => {
  it("空き家率 (実測値と一致): 9,001,600 / 65,046,700 → 13.8%", () => {
    expect(ratioPercent(9_001_600, 65_046_700)).toBe(13.8);
  });

  it("非正規率 (部分 / 部分の合計): 21,110,300 / (36,114,600 + 21,110,300) → 36.9%", () => {
    const den = sumMembers([36_114_600, 21_110_300]);
    expect(ratioPercent(21_110_300, den)).toBe(36.9);
  });

  it("★分母 0 は欠測 (0% の県を捏造しない)", () => {
    expect(ratioPercent(5, 0)).toBeNull();
  });

  it("★分母が負でも欠測", () => {
    expect(ratioPercent(5, -1)).toBeNull();
  });

  it("★分母不明は欠測", () => {
    expect(ratioPercent(5, null)).toBeNull();
  });

  it("★分子不明は欠測 (0% と言い切らない)", () => {
    expect(ratioPercent(null, 100)).toBeNull();
  });

  it("分子が実値 0 なら 0% (欠測ではない)", () => {
    expect(ratioPercent(0, 100)).toBe(0);
  });

  it("★分子分母を取り違えても throw せず値を返す (値域判定は shape-gate の担当)", () => {
    // 全県まとめて見ないと「1 県だけ 100 超の正当なケース」と区別できないため、
    // ここでは弾かない。実測: 空き家率の分子分母を入れ替えると 723%
    expect(ratioPercent(65_046_700, 9_001_600)).toBeCloseTo(722.6, 1);
  });
});

describe("round1 / toEstatValue", () => {
  it("小数第 1 位に丸める", () => {
    expect(round1(13.7549)).toBe(13.8);
    expect(round1(4066.6000000000004)).toBe(4066.6);
  });

  it("null は欠測記号", () => {
    expect(toEstatValue(null)).toBe("-");
    expect(toEstatValue(13.8)).toBe("13.8");
  });
});
