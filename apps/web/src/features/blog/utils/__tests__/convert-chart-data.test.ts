import { describe, expect, it } from "vitest";

import {
  convertToBarData,
  convertToLineData,
  convertToMultiAreaLineData,
  convertToChoroplethData,
  convertToLineDataAuto,
} from "../convert-chart-data";

import type { StatsSchema } from "@stats47/types";


const makeStat = (
  areaCode: string,
  areaName: string,
  yearCode: string,
  value: number,
): StatsSchema => ({
  areaCode,
  areaName,
  yearCode,
  yearName: `${yearCode}年`,
  value,
  unit: "人",
  categoryCode: "C01",
  categoryName: "人口",
});

const sampleData: StatsSchema[] = [
  makeStat("00000", "全国", "2020", 12600),
  makeStat("13000", "東京都", "2020", 1400),
  makeStat("14000", "神奈川県", "2020", 920),
  makeStat("00000", "全国", "2021", 12500),
  makeStat("13000", "東京都", "2021", 1405),
  makeStat("14000", "神奈川県", "2021", 918),
];

describe("convertToBarData", () => {
  it("最新年のデータを返す（全国値除外）", () => {
    const result = convertToBarData(sampleData);
    expect(result).toHaveLength(2);
    expect(result.every((d) => d.code !== "00000")).toBe(true);
    expect(result[0].name).toBe("東京都");
    expect(result[0].value).toBe(1405);
  });

  it("空配列は空配列を返す", () => {
    expect(convertToBarData([])).toEqual([]);
  });
});

describe("convertToLineData", () => {
  it("全国データを優先して年度昇順で返す", () => {
    const result = convertToLineData(sampleData);
    expect(result).toHaveLength(2);
    expect(result[0].category).toBe("2020");
    expect(result[0].value).toBe(12600);
    expect(result[1].category).toBe("2021");
  });

  it("全国データがない場合は全データを使う", () => {
    const prefOnly = sampleData.filter((s) => s.areaCode !== "00000");
    const result = convertToLineData(prefOnly);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("convertToMultiAreaLineData", () => {
  it("年度 × 都道府県のマトリクスを返す", () => {
    const result = convertToMultiAreaLineData(sampleData);
    expect(result).toHaveLength(2);
    expect(result[0]).toHaveProperty("東京都");
    expect(result[0]).toHaveProperty("神奈川県");
    expect(result[0]["東京都"]).toBe(1400);
  });
});

describe("convertToChoroplethData", () => {
  it("最新年の areaCode + value を返す（全国値除外）", () => {
    const result = convertToChoroplethData(sampleData);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ areaCode: "13000", value: 1405 });
  });

  it("空配列は空配列を返す", () => {
    expect(convertToChoroplethData([])).toEqual([]);
  });
});

describe("convertToLineDataAuto", () => {
  it("都道府県が2つ以上あれば複数系列を返す", () => {
    const result = convertToLineDataAuto(sampleData);
    // Multi-area mode: includes area names as keys
    expect(result[0]).toHaveProperty("東京都");
  });

  it("全国データのみなら単一系列を返す", () => {
    const nationalOnly = sampleData.filter((s) => s.areaCode === "00000");
    const result = convertToLineDataAuto(nationalOnly);
    expect(result[0]).toHaveProperty("value");
    expect(result[0]).not.toHaveProperty("東京都");
  });
});
