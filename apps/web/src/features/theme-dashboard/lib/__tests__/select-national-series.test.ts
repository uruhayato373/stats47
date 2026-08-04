import { describe, expect, it } from "vitest";

import { selectNationalSeries } from "../select-national-series";

import type { StatsSchema } from "@stats47/types";

function row(areaCode: string, yearCode: string, value: number | null): StatsSchema {
  return {
    areaCode,
    areaName: areaCode === "00000" ? "全国" : `area-${areaCode}`,
    yearCode,
    yearName: `${yearCode}年度`,
    metricKey: "total-population",
    value,
    unit: "人",
  } as StatsSchema;
}

/** 47 都道府県分の行 */
function prefectureRows(yearCode: string, value: number): StatsSchema[] {
  return Array.from({ length: 47 }, (_, i) =>
    row(`${String(i + 1).padStart(2, "0")}000`, yearCode, value),
  );
}

describe("selectNationalSeries", () => {
  it("全国行があれば 47 県平均ではなく全国行を返す", () => {
    // 実測値: 総人口 2024 年の全国は 123,802,000 人。県平均を採ると 1/47 になる
    const result = selectNationalSeries([
      row("00000", "2024", 123_802_000),
      ...prefectureRows("2024", 2_634_106),
    ]);

    expect(result).toHaveLength(1);
    expect(result?.[0].value).toBe(123_802_000);
    expect(result?.[0].areaName).toBe("全国");
  });

  it("全国行が複数年あれば全年分を返す", () => {
    const result = selectNationalSeries([
      row("00000", "2023", 124_352_000),
      row("00000", "2024", 123_802_000),
      ...prefectureRows("2024", 1),
    ]);

    expect(result?.map((r) => r.value)).toEqual([124_352_000, 123_802_000]);
  });

  it("全国行が無い統計表では 47 県平均へフォールバックし、areaName で平均だと申告する", () => {
    const result = selectNationalSeries([
      row("01000", "2024", 100),
      row("02000", "2024", 300),
    ]);

    expect(result).toHaveLength(1);
    expect(result?.[0].value).toBe(200);
    // ★「全国」と名乗らせない。呼び出し側がラベルを出し分ける根拠になる
    expect(result?.[0].areaName).toBe("全国平均");
    expect(result?.[0].areaCode).toBe("00000");
  });

  it("市区町村行は平均の母数に入れない (都道府県コードのみ)", () => {
    const result = selectNationalSeries([
      row("01000", "2024", 100),
      row("01100", "2024", 999_999), // 札幌市: 5 桁だが末尾 000 でない
      row("02000", "2024", 300),
    ]);

    expect(result?.[0].value).toBe(200);
  });

  it("データが無ければ null", () => {
    expect(selectNationalSeries([])).toBeNull();
    expect(selectNationalSeries([row("01100", "2024", 1)])).toBeNull();
  });

  it("年ごとに平均する (年を跨いで混ぜない)", () => {
    const result = selectNationalSeries([
      row("01000", "2023", 10),
      row("02000", "2023", 20),
      row("01000", "2024", 100),
      row("02000", "2024", 200),
    ]);

    const byYear = Object.fromEntries(
      (result ?? []).map((r) => [r.yearCode, r.value]),
    );
    expect(byYear).toEqual({ "2023": 15, "2024": 150 });
  });
});
