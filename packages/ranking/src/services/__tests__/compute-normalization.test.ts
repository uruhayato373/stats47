import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
vi.mock("../../repositories/ranking-item", () => ({
  readRankingItemByKeyFromR2: vi.fn(),
}));
vi.mock("../../repositories/ranking-value", () => ({
  listRankingValues: vi.fn(),
}));
vi.mock("../fetch-ranking-values-on-demand", () => ({
  fetchRankingValuesOnDemand: vi.fn().mockResolvedValue([]),
}));

import type { RankingItem, RankingValue } from "../../types";
import { computeNormalization } from "../compute-normalization";

import { readRankingItemByKeyFromR2 } from "../../repositories/ranking-item";
import { listRankingValues } from "../../repositories/ranking-value";

const makeValue = (areaCode: string, value: number): RankingValue => ({
  areaCode,
  areaName: `Area ${areaCode}`,
  areaType: "prefecture",
  yearCode: "2020",
  yearName: "2020年",
  metricKey: "test",
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
      // 実 config と同じ契約: 分母は km² 前提・scaleFactor 100 で「100km² あたり」
      // (registry の per_area 1,619 件はすべてこの形。テスト用に別の値を置かないこと)
      {
        type: "per_area",
        label: "面積100km²あたり",
        unit: "件/100km²",
        scaleFactor: 100,
      },
    ],
  },
  createdAt: "",
  updatedAt: "",
};

describe("computeNormalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(readRankingItemByKeyFromR2).mockResolvedValue({
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
    /**
     * 分母 total-area-... の R2 値は **100km² 単位** (unit「１００Ｋm2」)。
     * これを km² に直してから scaleFactor(100) を掛けるので、結果は「分子 / 分母の生値」に一致する。
     *   100 / (50 × 100) × 100 = 2
     * 換算を忘れると 100 / 50 × 100 = 200 (100 倍過大) になる。
     */
    it("面積データで正規化し正しい値が返ること", async () => {
      vi.mocked(listRankingValues).mockImplementation(
        async (key: string) => {
          if (key === "crime-count")
            return { success: true, data: [makeValue("01000",100)] };
          if (key === "total-area-including-northern-territories-and-takeshima")
            return { success: true, data: [makeValue("01000",50)] }; // 50 = 5,000km²
          return { success: true, data: [] };
        }
      );

      const result = await computeNormalization(baseItem, "2020", "per_area");

      expect(result).toHaveLength(1);
      expect(result[0].value).toBeCloseTo(2);
      expect(result[0].unit).toBe("件/100km²");
    });

    /**
     * 回帰ガード (2026-07-29): 実データの人口密度が現実的な範囲に収まること。
     *
     * 分母を 100km² 単位のまま割ると値が 100 倍になり、東京が 6,143 人/km² ではなく
     * 614,330 人/km² (地球上に存在しない密度) になる。実測値で固定して再発を止める。
     */
    it("実データの人口密度が現実的な範囲に収まること (100倍バグの回帰ガード)", async () => {
      // 2015 国勢調査ベースの実測値 (R2 app/ranking/*/values.json より)
      const POPULATION = { "13000": 13_515_271, "01000": 5_381_733 };
      const AREA_100KM2 = { "13000": 22, "01000": 834.21 };

      const populationItem: RankingItem = {
        ...baseItem,
        rankingKey: "total-population",
        unit: "人",
        calculation: {
          isCalculated: false,
          normalizationOptions: [
            {
              type: "per_area",
              label: "面積100km²あたり",
              unit: "人/100km²",
              scaleFactor: 100,
            },
          ],
        },
      };

      vi.mocked(listRankingValues).mockImplementation(async (key: string) => {
        if (key === "total-population")
          return {
            success: true,
            data: Object.entries(POPULATION).map(([code, v]) => makeValue(code, v)),
          };
        if (key === "total-area-including-northern-territories-and-takeshima")
          return {
            success: true,
            data: Object.entries(AREA_100KM2).map(([code, v]) => makeValue(code, v)),
          };
        return { success: true, data: [] };
      });

      const result = await computeNormalization(populationItem, "2015", "per_area");
      const per100km2 = Object.fromEntries(result.map((r) => [r.areaCode, r.value as number]));

      // 東京 ≒ 614,331 人/100km² (= 6,143 人/km²)
      expect(per100km2["13000"]).toBeCloseTo(614_330.5, 0);
      // 北海道 ≒ 6,451 人/100km² (= 64.5 人/km²)
      expect(per100km2["01000"]).toBeCloseTo(6_451.3, 0);

      // 1km² あたりに直したとき、現実の都道府県人口密度の範囲に入ること。
      // 100 倍バグでは東京が 614,330 人/km² になりここで落ちる。
      for (const [code, expected] of [["13000", [4_000, 8_000]], ["01000", [40, 100]]] as const) {
        const perKm2 = per100km2[code] / 100;
        expect(perKm2).toBeGreaterThan(expected[0]);
        expect(perKm2).toBeLessThan(expected[1]);
      }
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
      vi.mocked(readRankingItemByKeyFromR2).mockResolvedValue({
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
