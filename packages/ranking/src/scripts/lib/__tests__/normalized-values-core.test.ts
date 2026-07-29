import { describe, expect, it } from "vitest";

import {
  buildDenominatorTable,
  buildNationalTrendSeries,
  buildNormalizedPartitions,
  selectDenominatorForYear,
} from "../normalized-values-core";

import type { RankingValuesKeySnapshot } from "../../../types/snapshot";

const makeValue = (areaCode: string, value: number | null, yearCode = "2015") => ({
  metricKey: "total-population",
  areaType: "prefecture" as const,
  areaCode,
  areaName: `Area ${areaCode}`,
  yearCode,
  yearName: `${yearCode}年`,
  value,
  unit: "人",
  rank: 1,
});

/** 実測値 (R2 app/stats より): 東京・北海道の人口と 100km² 単位の面積 */
const TOKYO_POP_2015 = 13_515_271;
const HOKKAIDO_POP_2015 = 5_381_733;
const TOKYO_AREA_100KM2 = 22;
const HOKKAIDO_AREA_100KM2 = 834.21;

const AREA_ROWS = [
  { areaCode: "13000", yearCode: "2023", value: TOKYO_AREA_100KM2 },
  { areaCode: "01000", yearCode: "2023", value: HOKKAIDO_AREA_100KM2 },
];

const POP_PARTITIONS: RankingValuesKeySnapshot["partitions"] = [
  {
    yearCode: "2015",
    count: 2,
    values: [makeValue("13000", TOKYO_POP_2015), makeValue("01000", HOKKAIDO_POP_2015)],
  },
];

describe("buildDenominatorTable / selectDenominatorForYear", () => {
  it("年ごとに分母を引け、latestYearCode を持つこと", () => {
    const table = buildDenominatorTable([
      { areaCode: "13000", yearCode: "2020", value: 21 },
      { areaCode: "13000", yearCode: "2023", value: 22 },
    ]);
    expect(table.latestYearCode).toBe("2023");
    expect(selectDenominatorForYear(table, "2020")?.usedYearCode).toBe("2020");
  });

  it("対象年に分母が無ければ最新年へフォールバックすること (面積は 2023 のみ)", () => {
    const table = buildDenominatorTable(AREA_ROWS);
    const picked = selectDenominatorForYear(table, "1975");
    expect(picked?.usedYearCode).toBe("2023");
    expect(picked?.rows.find((r) => r.areaCode === "13000")?.value).toBe(TOKYO_AREA_100KM2);
  });

  it("分母が空なら null を返すこと", () => {
    expect(selectDenominatorForYear(buildDenominatorTable([]), "2020")).toBeNull();
  });
});

describe("buildNormalizedPartitions", () => {
  /**
   * 回帰ガード (2026-07-29): 分母 (100km² 単位) を km² へ換算し忘れると値が 100 倍になる。
   * 東京 2015 は 614,330 人/100km² (= 6,143 人/km²) が正。誤値は 61,433,050。
   */
  it("per_area で実測どおりの人口密度になること (100倍バグの回帰ガード)", () => {
    const partitions = buildNormalizedPartitions(POP_PARTITIONS, buildDenominatorTable(AREA_ROWS), {
      metricKey: "total-population",
      unit: "人/100km²",
      scaleFactor: 100,
      valueScaleToBaseUnit: 100,
    });

    expect(partitions).toHaveLength(1);
    const byArea = new Map(partitions[0].values.map((v) => [v.areaCode, v.value as number]));

    expect(byArea.get("13000")).toBeCloseTo(614_330.5, 0);
    expect(byArea.get("01000")).toBeCloseTo(6_451.3, 0);

    // 1km² あたりに直して現実の人口密度レンジに入ること
    expect(byArea.get("13000")! / 100).toBeGreaterThan(4_000);
    expect(byArea.get("13000")! / 100).toBeLessThan(8_000);
    expect(byArea.get("01000")! / 100).toBeGreaterThan(40);
    expect(byArea.get("01000")! / 100).toBeLessThan(100);
  });

  it("rank が値の降順で振られること", () => {
    const partitions = buildNormalizedPartitions(POP_PARTITIONS, buildDenominatorTable(AREA_ROWS), {
      metricKey: "total-population",
      unit: "人/100km²",
      scaleFactor: 100,
      valueScaleToBaseUnit: 100,
    });
    expect(partitions[0].values[0].areaCode).toBe("13000");
    expect(partitions[0].values[0].rank).toBe(1);
    expect(partitions[0].values[1].rank).toBe(2);
  });

  it("分母が null / 0 の地域を除外すること", () => {
    const table = buildDenominatorTable([
      { areaCode: "13000", yearCode: "2015", value: TOKYO_AREA_100KM2 },
      { areaCode: "01000", yearCode: "2015", value: 0 },
      { areaCode: "02000", yearCode: "2015", value: null },
    ]);
    const partitions = buildNormalizedPartitions(
      [
        {
          yearCode: "2015",
          count: 3,
          values: [
            makeValue("13000", TOKYO_POP_2015),
            makeValue("01000", HOKKAIDO_POP_2015),
            makeValue("02000", 1_000_000),
          ],
        },
      ],
      table,
      {
        metricKey: "total-population",
        unit: "人/100km²",
        scaleFactor: 100,
        valueScaleToBaseUnit: 100,
      },
    );
    expect(partitions[0].values.map((v) => v.areaCode)).toEqual(["13000"]);
  });

  it("分母を解決できない年の partition を落とすこと", () => {
    expect(
      buildNormalizedPartitions(POP_PARTITIONS, buildDenominatorTable([]), {
        metricKey: "total-population",
        unit: "人/100km²",
        scaleFactor: 100,
        valueScaleToBaseUnit: 100,
      }),
    ).toEqual([]);
  });
});

describe("buildNationalTrendSeries", () => {
  it("47 県の単純算術平均・合計・件数を年降順で返すこと", () => {
    const series = buildNationalTrendSeries(
      [
        {
          yearCode: "2015",
          count: 2,
          values: [makeValue("13000", 100), makeValue("01000", 200)],
        },
        {
          yearCode: "2024",
          count: 2,
          values: [makeValue("13000", 300, "2024"), makeValue("01000", 500, "2024")],
        },
      ],
      "original",
      "総数",
      "人",
    );

    expect(series.points.map((p) => p.yearCode)).toEqual(["2024", "2015"]);
    expect(series.points[0]).toMatchObject({ average: 400, total: 800, count: 2 });
    expect(series.points[1]).toMatchObject({ average: 150, total: 300, count: 2 });
  });

  it("全国行 (00000) と null を平均から除外すること", () => {
    const series = buildNationalTrendSeries(
      [
        {
          yearCode: "2015",
          count: 3,
          values: [
            makeValue("00000", 999_999),
            makeValue("13000", 100),
            makeValue("01000", null),
          ],
        },
      ],
      "original",
      "総数",
      "人",
    );
    expect(series.points[0]).toMatchObject({ average: 100, total: 100, count: 1 });
  });

  it("有効値が 0 件の年を落とすこと", () => {
    const series = buildNationalTrendSeries(
      [{ yearCode: "2015", count: 1, values: [makeValue("00000", 1)] }],
      "original",
      "総数",
      "人",
    );
    expect(series.points).toEqual([]);
  });
});
