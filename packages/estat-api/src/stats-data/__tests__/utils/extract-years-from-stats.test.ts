/**
 * extractYearsFromStats のユニットテスト
 */
import type { StatsSchema } from "@stats47/types";
import { describe, expect, it } from "vitest";
import { extractYearsFromStats } from "../../utils/extract-years-from-stats";

describe("extractYearsFromStats", () => {
  it("StatsSchema配列から年度一覧を抽出する", () => {
    const data: StatsSchema[] = [
      { areaCode: "01000", areaName: "北海道", yearCode: "2020", yearName: "2020年", categoryCode: "A1101", categoryName: "人口", value: 100, unit: "人" },
      { areaCode: "01000", areaName: "北海道", yearCode: "2021", yearName: "2021年", categoryCode: "A1101", categoryName: "人口", value: 101, unit: "人" },
      { areaCode: "02000", areaName: "青森県", yearCode: "2020", yearName: "2020年", categoryCode: "A1101", categoryName: "人口", value: 50, unit: "人" },
      { areaCode: "02000", areaName: "青森県", yearCode: "2021", yearName: "2021年", categoryCode: "A1101", categoryName: "人口", value: 51, unit: "人" },
    ];

    const result = extractYearsFromStats(data);

    expect(result).toEqual([
      { yearCode: "2021", yearName: "2021年" },
      { yearCode: "2020", yearName: "2020年" },
    ]);
  });

  it("年度コードの降順でソートされる", () => {
    const data: StatsSchema[] = [
      { areaCode: "01000", areaName: "北海道", yearCode: "2018", yearName: "2018年", categoryCode: "A1101", categoryName: "人口", value: 100, unit: "人" },
      { areaCode: "01000", areaName: "北海道", yearCode: "2022", yearName: "2022年", categoryCode: "A1101", categoryName: "人口", value: 100, unit: "人" },
      { areaCode: "01000", areaName: "北海道", yearCode: "2020", yearName: "2020年", categoryCode: "A1101", categoryName: "人口", value: 100, unit: "人" },
    ];

    const result = extractYearsFromStats(data);

    expect(result).toEqual([
      { yearCode: "2022", yearName: "2022年" },
      { yearCode: "2020", yearName: "2020年" },
      { yearCode: "2018", yearName: "2018年" },
    ]);
  });

  it("空の配列の場合は空の配列を返す", () => {
    const result = extractYearsFromStats([]);
    expect(result).toEqual([]);
  });

  it("重複する年度は1つにまとめられる", () => {
    const data: StatsSchema[] = [
      { areaCode: "01000", areaName: "北海道", yearCode: "2020", yearName: "2020年", categoryCode: "A1101", categoryName: "人口", value: 100, unit: "人" },
      { areaCode: "02000", areaName: "青森県", yearCode: "2020", yearName: "2020年", categoryCode: "A1101", categoryName: "人口", value: 50, unit: "人" },
      { areaCode: "03000", areaName: "岩手県", yearCode: "2020", yearName: "2020年", categoryCode: "A1101", categoryName: "人口", value: 60, unit: "人" },
    ];

    const result = extractYearsFromStats(data);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ yearCode: "2020", yearName: "2020年" });
  });

  it("yearCodeがundefinedのデータはスキップされる", () => {
    const data = [
      { areaCode: "01000", areaName: "北海道", yearCode: "2020", yearName: "2020年", categoryCode: "A1101", categoryName: "人口", value: 100, unit: "人" },
      { areaCode: "02000", areaName: "青森県", yearCode: undefined as unknown as string, yearName: "不明", categoryCode: "A1101", categoryName: "人口", value: 50, unit: "人" },
    ] as StatsSchema[];

    const result = extractYearsFromStats(data);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ yearCode: "2020", yearName: "2020年" });
  });
});
