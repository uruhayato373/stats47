import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RankingItem, RankingValue } from "../../types";
import { computeNormalization } from "../compute-normalization";

vi.mock("../../repositories/ranking-item", () => ({
  findRankingItemByKey: vi.fn(),
}));

vi.mock("../../repositories/ranking-value", () => ({
  listRankingValues: vi.fn(),
}));

import { findRankingItemByKey } from "../../repositories/ranking-item";
import { listRankingValues } from "../../repositories/ranking-value";

const makeValue = (areaCode: string, value: number): RankingValue => ({
  areaCode,
  areaName: `Area ${areaCode}`,
  areaType: "prefecture",
  yearCode: "2020",
  yearName: "2020年",
  categoryCode: "test",
  categoryName: "テスト",
  value,
  unit: "人",
  rank: 1,
});

const baseItem: RankingItem = {
  rankingKey: "crime-count",
  areaType: "prefecture",
  rankingName: "犯罪件数",
  title: "犯罪件数",
  unit: "件",
  dataSourceId: "test",
  isActive: true,
  isFeatured: false,
  featuredOrder: 0,
  calculation: {
    isCalculated: false,
    normalizationOptions: [
      {
        type: "per_population",
        label: "人口10万人あたり",
        unit: "件/10万人",
        scaleFactor: 100000,
      },
      {
        type: "per_area",
        label: "面積1km²あたり",
        unit: "件/km²",
        scaleFactor: 1,
      },
    ],
  },
  createdAt: "",
  updatedAt: "",
};

describe("computeNormalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findRankingItemByKey).mockResolvedValue({
      success: false,
      error: new Error("not found"),
    } as any);
  });

  describe("per_population 正常系", () => {
    it("人口データで正規化し正しい値が返ること", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string) => {
          if (key === "crime-count")
            return { success: true, data: [makeValue("01000",1000), makeValue("02000",500)] };
          if (key === "total-population")
            return { success: true, data: [makeValue("01000",500000), makeValue("02000",200000)] };
          return { success: true, data: [] };
        }
      );

      const result = await computeNormalization(baseItem, "2020", "per_population");

      expect(result).toHaveLength(2);
      // 01: (1000/500000)*100000 = 200
      // 02: (500/200000)*100000 = 250
      const area01 = result.find((r) => r.areaCode === "01000")!;
      const area02 = result.find((r) => r.areaCode === "02000")!;
      expect(area01.value).toBeCloseTo(200);
      expect(area02.value).toBeCloseTo(250);
      expect(area01.unit).toBe("件/10万人");
      // rank は降順で再計算される（02が高い）
      expect(area02.rank).toBeLessThan(area01.rank);
    });
  });

  describe("per_area 正常系", () => {
    it("面積データで正規化し正しい値が返ること", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string) => {
          if (key === "crime-count")
            return { success: true, data: [makeValue("01000",100)] };
          if (key === "total-area-including-northern-territories-and-takeshima")
            return { success: true, data: [makeValue("01000",50)] };
          return { success: true, data: [] };
        }
      );

      const result = await computeNormalization(baseItem, "2020", "per_area");

      expect(result).toHaveLength(1);
      expect(result[0].value).toBeCloseTo(2); // 100/50 * 1
      expect(result[0].unit).toBe("件/km²");
    });
  });

  describe("エラーケース", () => {
    it("正規化オプションが見つからない場合は空配列を返すこと", async () => {
      const result = await computeNormalization(
        baseItem,
        "2020",
        "unknown_type",
      );
      expect(result).toEqual([]);
    });

    it("分子データが空の場合は空配列を返すこと", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string) => {
          if (key === "crime-count") return { success: true, data: [] }; // 分子なし
          if (key === "total-population")
            return { success: true, data: [makeValue("01000",500000)] };
          return { success: true, data: [] };
        }
      );

      const result = await computeNormalization(baseItem, "2020", "per_population");

      expect(result).toEqual([]);
    });

    it("分母データが空の場合は空配列を返すこと", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string) => {
          if (key === "crime-count")
            return { success: true, data: [makeValue("01000",1000)] };
          return { success: true, data: [] }; // 分母なし
        }
      );

      const result = await computeNormalization(baseItem, "2020", "per_population");
      expect(result).toEqual([]);
    });

    it("分母が0のエリアは結果から除外されること", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string) => {
          if (key === "crime-count")
            return { success: true, data: [makeValue("01000",1000), makeValue("02000",500)] };
          if (key === "total-population")
            return {
              success: true,
              data: [makeValue("01000",500000), makeValue("02000",0)], // 02は0
            };
          return { success: true, data: [] };
        }
      );

      const result = await computeNormalization(baseItem, "2020", "per_population");
      expect(result).toHaveLength(1);
      expect(result[0].areaCode).toBe("01000");
    });
  });

  describe("年度ミスマッチフォールバック", () => {
    it("指定年のデータがない場合、分母アイテムのlatestYearにフォールバックすること", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string, _areaType: any, year: string) => {
          if (key === "crime-count")
            return { success: true, data: [makeValue("01000",1000)] };
          if (key === "total-population" && year === "2019")
            return { success: true, data: [makeValue("01000",500000)] };
          return { success: true, data: [] }; // 2020年のデータはない
        }
      );
      vi.mocked(findRankingItemByKey).mockResolvedValue({
        success: true,
        data: { rankingKey: "total-population", latestYear: { yearCode: "2019" } },
      } as any);

      const result = await computeNormalization(baseItem, "2020", "per_population");

      expect(result).toHaveLength(1);
      expect(result[0].value).toBeCloseTo(200); // (1000/500000)*100000
    });
  });

  describe("WELL_KNOWN_DENOMINATORS の解決", () => {
    it("per_population → 'total-population' キーが使われること", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string) => {
          if (key === "crime-count")
            return { success: true, data: [makeValue("01000",1000)] };
          if (key === "total-population")
            return { success: true, data: [makeValue("01000",1000000)] };
          return { success: true, data: [] };
        }
      );

      await computeNormalization(baseItem, "2020", "per_population");

      const calls = vi.mocked(listRankingValues).mock.calls;
      const keys = calls.map((c: any[]) => c[0]);
      expect(keys).toContain("total-population");
    });
  });
});
