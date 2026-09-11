import { describe, expect, it } from "vitest";
import prefectures from "../../../area/src/data/prefectures.json";
import type { SingleEntityRow } from "../../../stats-r2/src/types";
import { mergeOfficialRows, parseAgriculturalHistory } from "./official-release-staging";
import { healthyLifeSource, agriculturalOutputSource } from "./official-theme-releases";

// Synthetic values exercise preservation/coverage; no source observations are stored in git.
const rows = (year: number): SingleEntityRow[] => prefectures.map((pref, index) => ({
  areaCode: pref.prefCode, areaName: pref.prefName, yearCode: String(year), yearName: `${year}年度`,
  value: index + year, unit: "百万円",
}));
const merge = (prior: SingleEntityRow[], input: SingleEntityRow[]) => mergeOfficialRows("synthetic", prior, input, [2023, 2024], "百万円");

describe("official release staging", () => {
  it("preserves every old value and adds exactly 47 new observations, idempotently", () => {
    const result = merge(rows(2023), [...rows(2023), ...rows(2024)]);
    expect(result).toHaveLength(94);
    expect(result.filter((row) => row.yearCode === "2023").map((row) => row.value)).toEqual(rows(2023).map((row) => row.value));
    expect(result[0].yearName).toBe("2023年");
    expect(merge(result, [...rows(2023), ...rows(2024)])).toEqual(result);
  });
  it("stops a later rerun from removing a newer already-staged release", () => {
    expect(() => merge([...rows(2023), ...rows(2025)], [...rows(2023), ...rows(2024)])).toThrow("refusing to remove");
  });
  it("stops source changes from rewriting historical values", () => {
    const changed = rows(2023); changed[0].value! += 1;
    expect(() => merge(rows(2023), [...changed, ...rows(2024)])).toThrow("disagrees with existing history");
  });
  it("rejects duplicate axes, lost prefectures, wrong units and unknown geography", () => {
    expect(() => merge(rows(2023), [...rows(2023), ...rows(2024), rows(2024)[0]])).toThrow("duplicate");
    expect(() => merge(rows(2023), [...rows(2023), ...rows(2024).slice(1)])).toThrow("expected 47");
    const wrongUnit = rows(2024); wrongUnit[0].unit = "億円";
    expect(() => merge(rows(2023), [...rows(2023), ...wrongUnit])).toThrow("invalid unit");
    const wrongCode = rows(2024); wrongCode[0].areaCode = "99999";
    expect(() => merge(rows(2023), [...rows(2023), ...wrongCode])).toThrow("unknown prefecture");
  });
  it("does not expose the historical e-Stat query as the active refresh source", () => {
    for (const source of [healthyLifeSource("male"), healthyLifeSource("female"), agriculturalOutputSource]) {
      expect(source.kind).toBe("external"); expect(source.fetcherKey).toBe("manual");
      expect(source.config.estat).toBeUndefined();
      expect(source.config.statsDataId).toBeUndefined();
    }
  });
});

const response = () => ({ GET_STATS_DATA: { RESULT: { STATUS: 0 }, PARAMETER: { STATS_DATA_ID: "0000010103" },
  STATISTICAL_DATA: { RESULT_INF: { TOTAL_NUMBER: 47, TO_NUMBER: 47 },
    DATA_INF: { VALUE: rows(2023).map((row) => ({ "@cat01": "C3101", "@unit": "百万円", "@area": row.areaCode, "@time": "2023100000", $: String(row.value) })) } } } });

describe("agricultural history parser", () => {
  it("uses only the pinned official series and normalizes annual time codes", () => {
    const parsed = parseAgriculturalHistory(response());
    expect(parsed).toHaveLength(47); expect(parsed[0].yearCode).toBe("2023");
  });
  it("fails on a truncated response, wrong axis, wrong unit or nonannual time", () => {
    const truncated = response(); truncated.GET_STATS_DATA.STATISTICAL_DATA.RESULT_INF.TO_NUMBER = 46;
    expect(() => parseAgriculturalHistory(truncated)).toThrow("truncated");
    for (const [key, value] of [["@cat01", "other"], ["@unit", "億円"], ["@time", "2023010000"]] as const) {
      const raw = response(); raw.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE[0][key] = value;
      expect(() => parseAgriculturalHistory(raw)).toThrow();
    }
  });
});
