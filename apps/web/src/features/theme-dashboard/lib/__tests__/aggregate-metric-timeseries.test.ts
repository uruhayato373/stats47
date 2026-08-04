import { describe, expect, it } from "vitest";

import {
  aggregateMetricTimeseries,
  type TimeseriesSourceRow,
} from "../aggregate-metric-timeseries";

function row(
  areaCode: string,
  yearCode: string,
  value: number | null,
): TimeseriesSourceRow {
  return { areaCode, yearCode, yearName: `${yearCode}年度`, value };
}

describe("aggregateMetricTimeseries", () => {
  it("全国要求で全国行があれば national と申告し、その値を使う", () => {
    // 実測: 総人口 2024 年の全国は 123,802,000。県平均を採ると 1/47 になる
    const result = aggregateMetricTimeseries(
      [
        row("00000", "2024", 123_802_000),
        row("01000", "2024", 5_000_000),
        row("02000", "2024", 1_000_000),
      ],
      "00000",
    );

    expect(result.source).toBe("national");
    expect(result.points).toEqual([
      { year: "2024", yearName: "2024年度", value: 123_802_000 },
    ]);
  });

  it("全国行が無ければ 47 県平均で埋め、average と申告する", () => {
    const result = aggregateMetricTimeseries(
      [row("01000", "2024", 100), row("02000", "2024", 300)],
      "00000",
    );

    expect(result.source).toBe("average");
    expect(result.points[0].value).toBe(200);
  });

  it("1 年でも平均が混ざれば系列全体を average と申告する (混在を「全国」と呼ばない)", () => {
    const result = aggregateMetricTimeseries(
      [
        row("00000", "2024", 123_802_000), // 2024 は全国行あり
        row("01000", "2023", 100), // 2023 は県のみ → 平均で埋まる
        row("02000", "2023", 300),
      ],
      "00000",
    );

    expect(result.source).toBe("average");
    expect(result.points.map((p) => p.value)).toEqual([200, 123_802_000]);
  });

  it("都道府県指定はその県の値だけを返し、area と申告する", () => {
    const result = aggregateMetricTimeseries(
      [
        row("00000", "2024", 123_802_000),
        row("13000", "2024", 14_000_000),
        row("01000", "2024", 5_000_000),
      ],
      "13000",
    );

    expect(result.source).toBe("area");
    expect(result.points).toEqual([
      { year: "2024", yearName: "2024年度", value: 14_000_000 },
    ]);
  });

  it("年昇順に並べる", () => {
    const result = aggregateMetricTimeseries(
      [
        row("00000", "2024", 3),
        row("00000", "2022", 1),
        row("00000", "2023", 2),
      ],
      "00000",
    );

    expect(result.points.map((p) => p.year)).toEqual(["2022", "2023", "2024"]);
  });

  it("非数値・空入力は none", () => {
    expect(aggregateMetricTimeseries([], "00000").source).toBe("none");
    expect(
      aggregateMetricTimeseries([row("00000", "2024", null)], "00000").source,
    ).toBe("none");
    expect(
      aggregateMetricTimeseries(
        [{ areaCode: "00000", yearCode: "2024", value: Number.NaN }],
        "00000",
      ).source,
    ).toBe("none");
  });

  it("yearName が無ければ yearCode を使う", () => {
    const result = aggregateMetricTimeseries(
      [{ areaCode: "00000", yearCode: "2024", value: 1 }],
      "00000",
    );
    expect(result.points[0].yearName).toBe("2024");
  });
});
