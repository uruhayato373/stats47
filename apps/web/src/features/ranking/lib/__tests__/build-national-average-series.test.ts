import { describe, expect, it } from "vitest";

import {
  buildNationalAverageSeries,
  computeNationalAveragePeriodChange,
} from "../build-national-average-series";

import type { RankingValue } from "@stats47/ranking";

const makeValue = (
  areaCode: string,
  yearCode: string,
  value: number | null,
  unit = "人",
): RankingValue => ({
  metricKey: "test",
  areaCode,
  areaName: `Area${areaCode}`,
  yearCode,
  yearName: `${yearCode.slice(0, 4)}年`,
  value,
  rank: 1,
  unit,
});

/** count が 47 になる 1 年分。全県同値なので平均 = value */
const makeFullYear = (yearCode: string, value: number): RankingValue[] =>
  Array.from({ length: 47 }, (_, i) =>
    makeValue(String(i + 1).padStart(2, "0") + "000", yearCode, value),
  );

describe("buildNationalAverageSeries", () => {
  it("全国行 (00000) を平均から除外する", () => {
    const series = buildNationalAverageSeries([
      makeValue("00000", "2020", 1000),
      makeValue("13000", "2020", 100),
      makeValue("14000", "2020", 200),
    ]);
    expect(series).toHaveLength(1);
    expect(series[0].value).toBe(150);
    expect(series[0].count).toBe(2);
  });

  it("value が null の行を平均にも母数にも含めない", () => {
    const series = buildNationalAverageSeries([
      makeValue("13000", "2020", 100),
      makeValue("14000", "2020", null),
      makeValue("15000", "2020", 200),
    ]);
    expect(series[0].value).toBe(150);
    expect(series[0].count).toBe(2);
  });

  it("非有限値 (NaN / Infinity) を除外する", () => {
    const series = buildNationalAverageSeries([
      makeValue("13000", "2020", Number.NaN),
      makeValue("14000", "2020", Number.POSITIVE_INFINITY),
      makeValue("15000", "2020", 300),
    ]);
    expect(series[0].value).toBe(300);
    expect(series[0].count).toBe(1);
  });

  it("年を昇順に並べる (入力順に依存しない)", () => {
    const series = buildNationalAverageSeries([
      makeValue("13000", "2022", 300),
      makeValue("13000", "2020", 100),
      makeValue("13000", "2021", 200),
    ]);
    expect(series.map((p) => p.year)).toEqual([2020, 2021, 2022]);
  });

  it("10 桁のフルタイムコードを 4 桁年に正規化する", () => {
    const series = buildNationalAverageSeries([
      makeValue("13000", "2009100000", 100),
    ]);
    expect(series[0].year).toBe(2009);
    expect(series[0].yearCode).toBe("2009100000");
  });

  it("単年しかない指標は 1 点だけ返す", () => {
    expect(buildNationalAverageSeries(makeFullYear("2024", 10))).toHaveLength(1);
  });

  it("全行が null の年は系列に出さない", () => {
    const series = buildNationalAverageSeries([
      makeValue("13000", "2019", null),
      makeValue("14000", "2019", null),
      makeValue("13000", "2020", 100),
    ]);
    expect(series.map((p) => p.year)).toEqual([2020]);
  });

  it("空配列は空配列を返す", () => {
    expect(buildNationalAverageSeries([])).toEqual([]);
  });
});

describe("computeNationalAveragePeriodChange", () => {
  it("実測の両端年と変化率を返す (固定窓を使わない)", () => {
    const series = buildNationalAverageSeries([
      ...makeFullYear("2007", 1000),
      ...makeFullYear("2024", 1084),
    ]);
    expect(computeNationalAveragePeriodChange(series, "時間")).toEqual({
      fromYear: 2007,
      toYear: 2024,
      text: "+8.4%",
    });
  });

  it("減少はマイナス符号で返す", () => {
    const series = buildNationalAverageSeries([
      ...makeFullYear("2015", 200),
      ...makeFullYear("2024", 180),
    ]);
    expect(computeNationalAveragePeriodChange(series, "人")?.text).toBe("−10%");
  });

  it("単位が % の指標は率ではなくポイント差で返す", () => {
    const series = buildNationalAverageSeries([
      ...makeFullYear("2015", 20),
      ...makeFullYear("2024", 22.3),
    ]);
    expect(computeNationalAveragePeriodChange(series, "%")?.text).toBe("+2.3pt");
  });

  it("端点の母数が 47 未満なら null (平均どうしを比較できない)", () => {
    const series = buildNationalAverageSeries([
      makeValue("13000", "2015", 100),
      ...makeFullYear("2024", 120),
    ]);
    expect(computeNationalAveragePeriodChange(series, "人")).toBeNull();
  });

  it("系列が 1 点以下なら null", () => {
    const series = buildNationalAverageSeries(makeFullYear("2024", 10));
    expect(computeNationalAveragePeriodChange(series, "人")).toBeNull();
    expect(computeNationalAveragePeriodChange([], "人")).toBeNull();
  });

  it("始点が 0 以下なら変化率を出さない", () => {
    const series = buildNationalAverageSeries([
      ...makeFullYear("2015", 0),
      ...makeFullYear("2024", 120),
    ]);
    expect(computeNationalAveragePeriodChange(series, "人")).toBeNull();
  });
});
