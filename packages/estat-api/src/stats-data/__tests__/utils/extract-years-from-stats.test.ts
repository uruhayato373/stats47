/**
 * extractYearsFromStats のユニットテスト
 *
 * ★2026-07-31: 全 5 ケースのうち 4 ケースで**入力 fixture が空配列に潰れており**、
 * 実装が正しいのに落ち続けていた (期待値だけが残っていた)。packages/* のテストが
 * CI にも pre-commit にも配線されていなかったため誰も気づかなかった。
 * fixture を期待値から復元し、CI 配線とセットで直す。
 */
import type { StatsSchema } from "@stats47/types";
import { describe, expect, it } from "vitest";
import { extractYearsFromStats } from "../../utils/extract-years-from-stats";

/** 年だけが関心事なので、それ以外の必須フィールドは固定値で埋める。 */
const row = (yearCode: string, yearName = `${yearCode}年`): StatsSchema => ({
  metricKey: "test-metric",
  areaType: "prefecture",
  areaCode: "01000",
  areaName: "北海道",
  yearCode,
  yearName,
  value: 100,
  unit: "人",
});

describe("extractYearsFromStats", () => {
  it("StatsSchema配列から年度一覧を抽出する", () => {
    const data: StatsSchema[] = [row("2020"), row("2021")];

    const result = extractYearsFromStats(data);

    expect(result).toEqual([
      { yearCode: "2021", yearName: "2021年" },
      { yearCode: "2020", yearName: "2020年" },
    ]);
  });

  it("年度コードの降順でソートされる", () => {
    const data: StatsSchema[] = [row("2018"), row("2022"), row("2020")];

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
    // 同じ年で地域が違う行 (47 県分) が来るのが実データの形
    const data: StatsSchema[] = [
      row("2020"),
      { ...row("2020"), areaCode: "13000", areaName: "東京都" },
    ];

    const result = extractYearsFromStats(data);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ yearCode: "2020", yearName: "2020年" });
  });

  it("yearCodeがundefinedのデータはスキップされる", () => {
    const data = [
      { ...row("2020"), yearCode: undefined, yearName: undefined },
      row("2020"),
    ] as unknown as StatsSchema[];

    const result = extractYearsFromStats(data);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ yearCode: "2020", yearName: "2020年" });
  });
});
