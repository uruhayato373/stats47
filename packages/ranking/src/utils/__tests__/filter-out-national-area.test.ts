import type { StatsSchema } from "@stats47/types";
import { describe, expect, it } from "vitest";
import { filterOutNationalArea } from "../filter-out-national-area";

describe("filterOutNationalArea", () => {
  const base = { value: 100, yearCode: "2020", yearName: "2020", categoryCode: "C", categoryName: "C", unit: "U" };

  it("5桁コード: 全国 (00000) を除外し都道府県 (XX000) を残すこと", () => {
    const data: StatsSchema[] = [
      { ...base, areaCode: "00000", areaName: "全国" },
      { ...base, areaCode: "01000", areaName: "北海道" },
      { ...base, areaCode: "13000", areaName: "東京都" },
    ];
    const result = filterOutNationalArea(data);
    expect(result).toHaveLength(2);
    expect(result.find(d => d.areaCode === "00000")).toBeUndefined();
  });

  it("2桁コード: 全国 (00) を除外し都道府県 (01-47) を残すこと", () => {
    const data: StatsSchema[] = [
      { ...base, areaCode: "00", areaName: "全国" },
      { ...base, areaCode: "01", areaName: "北海道" },
      { ...base, areaCode: "47", areaName: "沖縄県" },
    ];
    const result = filterOutNationalArea(data);
    expect(result).toHaveLength(2);
    expect(result.find(d => d.areaCode === "00")).toBeUndefined();
  });

  it("市区町村コード (5桁で非XX000) を除外すること", () => {
    const data: StatsSchema[] = [
      { ...base, areaCode: "01", areaName: "北海道" },
      { ...base, areaCode: "01100", areaName: "札幌市" },
      { ...base, areaCode: "13100", areaName: "特別区部" },
      { ...base, areaCode: "13000", areaName: "東京都" },
    ];
    const result = filterOutNationalArea(data);
    expect(result).toHaveLength(2);
    expect(result.map(d => d.areaCode)).toEqual(["01", "13000"]);
  });

  it("空配列の場合、空配列を返すこと", () => {
    expect(filterOutNationalArea([])).toEqual([]);
  });
});
