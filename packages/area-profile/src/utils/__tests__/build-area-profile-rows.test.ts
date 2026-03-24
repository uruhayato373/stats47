import { describe, expect, it } from "vitest";
import {
  buildAreaProfileRows,
  computePercentile,
  type AreaRankingData,
} from "../build-area-profile-rows";

describe("computePercentile", () => {
  it("1位は100%", () => {
    expect(computePercentile(1)).toBeCloseTo(100);
  });

  it("47位は0%", () => {
    expect(computePercentile(47)).toBeCloseTo(0);
  });

  it("24位は約50%", () => {
    expect(computePercentile(24)).toBeCloseTo(50, 0);
  });
});

describe("buildAreaProfileRows", () => {
  const baseData: AreaRankingData[] = [
    { rankingKey: "pop", indicator: "人口", year: "2023", rank: 1, value: 5000000, unit: "人", areaName: "北海道" },
    { rankingKey: "gdp", indicator: "GDP", year: "2023", rank: 3, value: 200000, unit: "百万円", areaName: "北海道" },
    { rankingKey: "crime", indicator: "犯罪率", year: "2023", rank: 45, value: 80, unit: "件", areaName: "北海道" },
    { rankingKey: "temp", indicator: "気温", year: "2023", rank: 47, value: -5, unit: "℃", areaName: "北海道" },
    { rankingKey: "mid", indicator: "中間指標", year: "2023", rank: 25, value: 100, unit: "件", areaName: "北海道" },
  ];
  const createdAt = "2024-01-01T00:00:00.000Z";

  it("強み（rank<=5）と弱み（rank>=43）を正しく分類する", () => {
    const rows = buildAreaProfileRows("01000", "北海道", baseData, createdAt);

    const strengths = rows.filter((r) => r.type === "strength");
    const weaknesses = rows.filter((r) => r.type === "weakness");

    expect(strengths).toHaveLength(2);
    expect(weaknesses).toHaveLength(2);
  });

  it("中間順位（6〜42位）のデータは含まれない", () => {
    const rows = buildAreaProfileRows("01000", "北海道", baseData, createdAt);
    expect(rows).toHaveLength(4);
  });

  it("areaCode, areaName, createdAtが全行に設定される", () => {
    const rows = buildAreaProfileRows("01000", "北海道", baseData, createdAt);

    for (const row of rows) {
      expect(row.areaCode).toBe("01000");
      expect(row.areaName).toBe("北海道");
      expect(row.createdAt).toBe(createdAt);
    }
  });

  it("percentileが正しく計算される", () => {
    const rows = buildAreaProfileRows("01000", "北海道", baseData, createdAt);

    const rank1 = rows.find((r) => r.rank === 1);
    const rank47 = rows.find((r) => r.rank === 47);

    expect(rank1?.percentile).toBeCloseTo(100);
    expect(rank47?.percentile).toBeCloseTo(0);
  });

  it("strengthsは昇順、weaknessesは降順でソートされる", () => {
    const rows = buildAreaProfileRows("01000", "北海道", baseData, createdAt);

    const strengths = rows.filter((r) => r.type === "strength");
    const weaknesses = rows.filter((r) => r.type === "weakness");

    expect(strengths[0].rank).toBe(1);
    expect(strengths[1].rank).toBe(3);
    expect(weaknesses[0].rank).toBe(47);
    expect(weaknesses[1].rank).toBe(45);
  });

  it("空配列を渡すと空配列が返る", () => {
    const rows = buildAreaProfileRows("01000", "北海道", [], createdAt);
    expect(rows).toHaveLength(0);
  });

  it("元データのフィールドが正しくマッピングされる", () => {
    const rows = buildAreaProfileRows("01000", "北海道", baseData, createdAt);
    const pop = rows.find((r) => r.rankingKey === "pop");

    expect(pop).toMatchObject({
      indicator: "人口",
      year: "2023",
      rank: 1,
      value: 5000000,
      unit: "人",
      type: "strength",
    });
  });
});
