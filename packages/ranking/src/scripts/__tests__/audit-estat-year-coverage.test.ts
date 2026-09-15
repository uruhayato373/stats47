import { describe, expect, it } from "vitest";

import {
  classifyYearCoverage,
  listSingleYearEstatCandidates,
  yearSpecCount,
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
