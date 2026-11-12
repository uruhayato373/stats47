import { describe, expect, it } from "vitest";

import {
  buildNationalAverageSeries,
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
  it("全国行 (00000) があれば単純平均ではなく公表の全国値を系列に使う", () => {
    const series = buildNationalAverageSeries([
      makeValue("00000", "2020", 1000),
      makeValue("13000", "2020", 100),
      makeValue("14000", "2020", 200),
    ]);
    expect(series).toHaveLength(1);
    expect(series[0].value).toBe(1000);
    expect(series[0].kind).toBe("national-value");
  });

  it("mutation: 00000 行を除くと同じ年が単純平均の点に戻る", () => {
    const series = buildNationalAverageSeries([
      makeValue("13000", "2020", 100),
      makeValue("14000", "2020", 200),
    ]);
    expect(series[0].value).toBe(150);
    expect(series[0].count).toBe(2);
    expect(series[0].kind).toBe("simple-mean");
  });

  it("公表値の年と単純平均の年を 1 本の線につながない (公表値の年だけ残す)", () => {
    const series = buildNationalAverageSeries([
      ...makeFullYear("2019", 10),
      makeValue("00000", "2020", 12),
      ...makeFullYear("2020", 11),
    ]);
    expect(series.map((p) => p.year)).toEqual([2020]);
    expect(series[0].value).toBe(12);
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

describe("台帳で許可した合計と単純平均", () => {
  it("未指定では47県がそろっていても合計を公開しない", () => {
    expect(buildNationalAverageSeries(makeFullYear("2024", 10))[0]).toMatchObject({ mean: 10, total: null });
  });
  it("許可された合計にも平均にも全国行・市区町村行を二重計上しない", () => {
    const series = buildNationalAverageSeries([
      ...makeFullYear("2024", 10),
      makeValue("00000", "2024", 470),
      makeValue("13101", "2024", 9999),
    ], { showTotal: true });
    expect(series[0]).toMatchObject({ value: 470, kind: "national-total", mean: 10, total: 470, count: 47 });
  });
  it("欠測年と重複で47件になった年を全国合計として出さない", () => {
    const incomplete = makeFullYear("2024", 10).slice(1);
    expect(buildNationalAverageSeries(incomplete, { showTotal: true })[0].total).toBeNull();
    const duplicated = [...incomplete, incomplete[0]];
    expect(buildNationalAverageSeries(duplicated, { showTotal: true })[0].total).toBeNull();
  });
  it("実測のゼロを欠測にせず合計0と平均0を保持する", () => {
    expect(buildNationalAverageSeries(makeFullYear("2024", 0), { showTotal: true })[0]).toMatchObject({ total: 0, mean: 0 });
  });
  it("合計と平均を分けて描くときは、公表の全国行が無い年も残す", () => {
    const series = buildNationalAverageSeries([
      ...makeFullYear("2020", 10), ...makeFullYear("2024", 12),
      makeValue("00000", "2022", 550),
      makeValue("00000", "2024", 564),
    ], { showTotal: true });
    expect(series.map((point) => point.year)).toEqual([2020, 2022, 2024]);
    expect(series.map((point) => point.mean)).toEqual([10, null, 12]);
    expect(series.map((point) => point.total)).toEqual([470, null, 564]);
  });
});
