import { describe, expect, it } from "vitest";

import {
  NORMALIZED_FIXTURE_GATES,
  checkFixtureGates,
  fixtureGateRankingKeys,
} from "../normalized-fixtures";

describe("normalized fixture gates", () => {
  it("全ゲートが根拠 (rationale) と妥当なレンジを持つこと", () => {
    expect(NORMALIZED_FIXTURE_GATES.length).toBeGreaterThan(0);
    for (const gate of NORMALIZED_FIXTURE_GATES) {
      expect(gate.rationale.length).toBeGreaterThan(10);
      expect(gate.range[0]).toBeLessThan(gate.range[1]);
      expect(gate.range[0]).toBeGreaterThan(0);
    }
  });

  it("実測どおりの値なら違反ゼロ (東京 2015 = 614,330 人/100km²)", () => {
    expect(
      checkFixtureGates({
        rankingKey: "total-population",
        normType: "per_area",
        yearCode: "2015",
        valuesByAreaCode: new Map([
          ["13000", 614_330.5],
          ["01000", 6_451.3],
        ]),
      }),
    ).toEqual([]);
  });

  /** これが本題: 100 倍過大 (R2 に実在した誤値) を必ず捕まえる */
  it("100 倍過大な値を違反として検出すること", () => {
    const violations = checkFixtureGates({
      rankingKey: "total-population",
      normType: "per_area",
      yearCode: "2015",
      valuesByAreaCode: new Map([
        ["13000", 61_433_050],
        ["01000", 645_129.28],
      ]),
    });
    expect(violations).toHaveLength(2);
    expect(violations[0].message).toContain("期待レンジ");
    expect(violations[0].actual).toBe(61_433_050);
  });

  it("対象県の値が欠落している場合も違反にすること", () => {
    const violations = checkFixtureGates({
      rankingKey: "total-population",
      normType: "per_area",
      yearCode: "2024",
      valuesByAreaCode: new Map([["01000", 6_045.2]]),
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].areaCode).toBe("13000");
    expect(violations[0].actual).toBeNull();
  });

  it("ゲート対象外の key / normType は検査しないこと", () => {
    expect(
      checkFixtureGates({
        rankingKey: "some-other-metric",
        normType: "per_area",
        yearCode: "2024",
        valuesByAreaCode: new Map(),
      }),
    ).toEqual([]);
    expect(
      checkFixtureGates({
        rankingKey: "total-population",
        normType: "per_population",
        yearCode: "2024",
        valuesByAreaCode: new Map(),
      }),
    ).toEqual([]);
  });

  it("fixtureGateRankingKeys が重複なく key を返すこと", () => {
    const keys = fixtureGateRankingKeys();
    expect(keys).toContain("total-population");
    expect(new Set(keys).size).toBe(keys.length);
  });
});
