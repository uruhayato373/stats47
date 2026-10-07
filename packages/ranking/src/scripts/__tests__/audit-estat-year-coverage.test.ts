import { describe, expect, it } from "vitest";

import {
  classifyYearCoverage,
  countPrefecturesByYear,
  isObservedValue,
  listSingleYearEstatCandidates,
  reclassifyRecorded,
  yearSpecCodes,
  yearSpecCount,
  type YearCoverageResult,
} from "../audit-estat-year-coverage";
import type { MetricConfig } from "@stats47/data-configs";

/**
 * e-Stat 年カバレッジ監査の判定契約。
 *
 * 守りたいのは「config の years が e-Stat の実在年数より狭ければ extend-candidate、
 * 同じか広ければ confirmed-single-year」という比較だけを機械的に行うこと。
 * ネットワーク結果 (nonNullYearCodes) は呼び出し側が渡す前提で、この関数自体は通信しない。
 */

function metric(overrides: Partial<MetricConfig>): MetricConfig {
  return {
    key: "test-metric",
    title: "テスト",
    unit: "人",
    category: "population",
    source: { kind: "estat", statsDataId: "0000000000" },
    entities: ["prefecture"],
    years: { from: 2020, to: 2020 },
    isActive: true,
    ...overrides,
  } as MetricConfig;
}

describe("yearSpecCount", () => {
  it("from/to の範囲を数える", () => {
    expect(yearSpecCount({ from: 2010, to: 2020 })).toBe(11);
  });
  it("years 配列の件数を数える", () => {
    expect(yearSpecCount({ years: [1995, 2000, 2005] })).toBe(3);
  });
  it("'all' は判定不能として null", () => {
    expect(yearSpecCount("all")).toBeNull();
  });
});

describe("classifyYearCoverage", () => {
  it("e-Stat の実在年数が config より多ければ extend-candidate", () => {
    const r = classifyYearCoverage({
      key: "k",
      statsDataId: "0000000000",
      configYears: 1,
      nonNullYearCodes: ["2020", "2021", "2022"],
    });
    expect(r.verdict).toBe("extend-candidate");
    expect(r.estatNonNullYears).toBe(3);
  });

  it("e-Stat の実在年数が config と同じなら confirmed-single-year", () => {
    const r = classifyYearCoverage({
      key: "k",
      statsDataId: "0000000000",
      configYears: 1,
      nonNullYearCodes: ["2022"],
    });
    expect(r.verdict).toBe("confirmed-single-year");
  });

  it("重複した time コードは1年として数える", () => {
    const r = classifyYearCoverage({
      key: "k",
      statsDataId: "0000000000",
      configYears: 1,
      nonNullYearCodes: ["2022", "2022"],
    });
    expect(r.verdict).toBe("confirmed-single-year");
    expect(r.estatNonNullYears).toBe(1);
  });

  it("取得失敗 (null) は fetch-failed", () => {
    const r = classifyYearCoverage({
      key: "k",
      statsDataId: "0000000000",
      configYears: 1,
      nonNullYearCodes: null,
    });
    expect(r.verdict).toBe("fetch-failed");
  });

  it("statsDataId が無ければ no-estat-source", () => {
    const r = classifyYearCoverage({
      key: "k",
      statsDataId: null,
      configYears: 1,
      nonNullYearCodes: ["2022"],
    });
    expect(r.verdict).toBe("no-estat-source");
  });
});

describe("listSingleYearEstatCandidates", () => {
  it("isActive かつ estat かつ単年設定だけを候補にする", () => {
    const registry: Record<string, MetricConfig> = {
      "single-year-estat": metric({ years: { from: 2022, to: 2022 } }),
      "multi-year-estat": metric({ years: { from: 2000, to: 2022 } }),
      "single-year-inactive": metric({ years: { from: 2022, to: 2022 }, isActive: false }),
      "single-year-manual": metric({
        years: { from: 2022, to: 2022 },
        source: { kind: "external", fetcherKey: "manual", config: {} },
      }),
    };
    expect(listSingleYearEstatCandidates(registry)).toEqual(["single-year-estat"]);
  });
});

describe("年の集合で比べる (指標ごとの年の確認記録)", () => {
  const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

  it("飛び飛びの config (2009〜2014・2024) に無い実在年があれば extend-candidate", () => {
    const r = classifyYearCoverage({
      key: "room-utilization-rate",
      statsDataId: "0000010207",
      configYears: 7,
      configYearCodes: yearSpecCodes({ years: [2009, 2010, 2011, 2012, 2013, 2014, 2024] }),
      nonNullYearCodes: range(2009, 2024),
    });
    expect(r.verdict).toBe("extend-candidate");
  });

  it("複数年の config が実在年をすべて含めば config-covers", () => {
    const r = classifyYearCoverage({
      key: "room-utilization-rate",
      statsDataId: "0000010207",
      configYears: 16,
      configYearCodes: yearSpecCodes({ from: 2009, to: 2024 }),
      nonNullYearCodes: range(2009, 2024),
    });
    expect(r.verdict).toBe("config-covers");
  });

  it("単年の config でも、登録した年と実在年が違えば extend-candidate (年数が同じでも見逃さない)", () => {
    const r = classifyYearCoverage({
      key: "k",
      statsDataId: "0000000000",
      configYears: 1,
      configYearCodes: ["2020"],
      nonNullYearCodes: ["2022"],
    });
    expect(r.verdict).toBe("extend-candidate");
  });
});

describe("countPrefecturesByYear", () => {
  it("年ごとに実データがある都道府県を数え、全国・市区町村・欠測記号は数えない", () => {
    const counts = countPrefecturesByYear([
      { "@area": "01000", "@time": "2023100000", $: "10" },
      { "@area": "13000", "@time": "2023100000", $: "20" },
      { "@area": "13000", "@time": "2023100000", $: "21" },
      { "@area": "00000", "@time": "2023100000", $: "99" },
      { "@area": "13101", "@time": "2023100000", $: "5" },
      { "@area": "47000", "@time": "2023100000", $: "-" },
      { "@area": "47000", "@time": "2024100000", $: "…" },
      { "@area": "47000", "@time": "2022100000", $: "7" },
    ]);
    expect(counts).toEqual({ "2022": 1, "2023": 2 });
  });

  it("欠測・秘匿の記号は実データとして数えない", () => {
    for (const mark of ["", "-", "…", "***", "x", "X", null, undefined]) {
      expect(isObservedValue(mark)).toBe(false);
    }
    expect(isObservedValue("0")).toBe(true);
  });
});

describe("reclassifyRecorded", () => {
  const recorded: YearCoverageResult = {
    key: "k",
    statsDataId: "0000000000",
    configYears: 1,
    estatNonNullYears: 3,
    availableYearCodes: ["2020", "2021", "2022"],
    verdict: "extend-candidate",
    checkedAt: "2026-09-19T00:00:00.000Z",
  };

  it("config の years を広げた指標は、通信せずに config-covers へ付け直す (記録は消さない)", () => {
    const r = reclassifyRecorded(recorded, metric({ years: { from: 2020, to: 2022 } }));
    expect(r.verdict).toBe("config-covers");
    expect(r.configYears).toBe(3);
    expect(r.availableYearCodes).toEqual(["2020", "2021", "2022"]);
    expect(r.checkedAt).toBe(recorded.checkedAt);
  });

  it("広げ足りなければ extend-candidate のまま", () => {
    const r = reclassifyRecorded(recorded, metric({ years: { from: 2021, to: 2022 } }));
    expect(r.verdict).toBe("extend-candidate");
  });

  it("取得失敗の記録は付け直さない (次の巡回で再試行させる)", () => {
    const failed = { ...recorded, verdict: "fetch-failed" as const, availableYearCodes: [] };
    expect(reclassifyRecorded(failed, metric({ years: { from: 2020, to: 2022 } })).verdict).toBe("fetch-failed");
  });
});
