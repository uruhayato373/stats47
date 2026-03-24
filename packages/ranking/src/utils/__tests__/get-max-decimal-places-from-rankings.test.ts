import { describe, expect, it } from "vitest";

import type { RankingValue } from "../../types";
import { getMaxDecimalPlacesFromRankings } from "../get-max-decimal-places-from-rankings";

const createMockRankingValue = (value: number): RankingValue => ({
  rank: 1,
  areaCode: "01000",
  areaName: "北海道",
  yearCode: "2020",
  yearName: "2020年",
  categoryCode: "A",
  categoryName: "テスト",
  value,
  unit: "人",
});

describe("getMaxDecimalPlacesFromRankings", () => {
  it("空配列の場合は 0 を返す", () => {
    expect(getMaxDecimalPlacesFromRankings([])).toBe(0);
  });

  it("整数のみの場合は 0 を返す", () => {
    const data = [
      createMockRankingValue(100),
      createMockRankingValue(200),
      createMockRankingValue(300),
    ];
    expect(getMaxDecimalPlacesFromRankings(data)).toBe(0);
  });

  it("小数点以下の最大桁数を返す", () => {
    const data = [
      createMockRankingValue(1.5),
      createMockRankingValue(2.345),
      createMockRankingValue(3),
    ];
    expect(getMaxDecimalPlacesFromRankings(data)).toBe(3);
  });

  it("全て同じ桁数の場合はその桁数を返す", () => {
    const data = [
      createMockRankingValue(1.12),
      createMockRankingValue(2.34),
      createMockRankingValue(5.67),
    ];
    expect(getMaxDecimalPlacesFromRankings(data)).toBe(2);
  });

  it("単一要素の配列を正しく処理する", () => {
    const data = [createMockRankingValue(3.14159)];
    expect(getMaxDecimalPlacesFromRankings(data)).toBe(5);
  });
});
