import { describe, expect, it } from "vitest";

import { resolveNationalComparison } from "../national-comparison";

const japan = (sourceMode: "official" | "derived-additive" | "derived-ratio", rows: { yearCode: string; value: number }[]) => ({
  sourceMode,
  rows: rows.map((r) => ({ ...r, yearName: `${r.yearCode}年度`, unit: "倍" })),
});

describe("resolveNationalComparison", () => {
  const prefectures = [1.2, 1.4, 1.6]; // 単純平均 1.4

  it("同じ年の公式の全国値があれば単純平均ではなくそれを使う", () => {
    expect(resolveNationalComparison(prefectures, japan("official", [{ yearCode: "2022", value: 1.31 }]), "2022"))
      .toEqual({ value: 1.31, kind: "national" });
  });

  it("年コードの書式が違っても先頭 4 桁で同じ年として照らす", () => {
    expect(resolveNationalComparison(prefectures, japan("derived-ratio", [{ yearCode: "2022", value: 1.3 }]), "2022100000").kind)
      .toBe("national");
  });

  it("同じ年が無い・合計から作った全国値・全国値なしは 47 都道府県平均にする", () => {
    for (const j of [japan("official", [{ yearCode: "2021", value: 1.16 }]), japan("derived-additive", [{ yearCode: "2022", value: 9 }]), null]) {
      const r = resolveNationalComparison(prefectures, j, "2022");
      expect(r.kind).toBe("prefecture-mean");
      expect(r.value).toBeCloseTo(1.4);
    }
  });
});
