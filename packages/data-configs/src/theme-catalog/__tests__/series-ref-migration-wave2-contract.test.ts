import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { requestKey } from "../chart-dependencies";
import { THEME_CATALOGS } from "../index";
import { parseStatSeriesRefs } from "../stat-series-ref";

import migrationContract from "./fixtures/series-ref-migration-wave2-contract.json";

const RETAINED_COMPONENT_KEYS = [
  "birth-death-count-trend",
  "theme-pop-migration-trend",
  "railway-passenger-trend",
];

function metricRequestKey(metricKey: string): string {
  const config = getMetricConfig(metricKey);
  expect(config, metricKey).toBeDefined();
  expect(config?.source.kind, metricKey).toBe("estat");
  if (!config || config.source.kind !== "estat") throw new Error(metricKey);
  const filters = Object.fromEntries(
    (["cdCat01", "cdCat02", "cdCat03", "cdCat04", "cdCat05", "cdTab"] as const)
      .flatMap((key) => config.source.kind === "estat" && config.source[key]
        ? [[key, config.source[key]]]
        : []),
  ) as Record<string, string>;
  return requestKey({ statsDataId: config.source.statsDataId, filters });
}

describe("CROSS-PAGE-DATA-SSOT-01 exact migration wave 2", () => {
  it("10 chart の旧 request・unit は参照先MetricConfigと完全一致する", () => {
    expect(migrationContract).toHaveLength(10);
    for (const row of migrationContract) {
      expect(row.rawRequestKeys, row.componentKey).toEqual(row.metricKeys.map(metricRequestKey));
      expect(row.units, row.componentKey).toEqual(
        row.metricKeys.map((key) => getMetricConfig(key)?.unit),
      );
    }
  });

  it("存続する3 chartは選定済み系列と表示情報をtyped refsだけで持つ", () => {
    const retained = migrationContract.filter((row) =>
      THEME_CATALOGS[row.themeKey]?.charts.some((chart) => chart.componentKey === row.componentKey),
    );
    expect(retained.map((row) => row.componentKey)).toEqual(RETAINED_COMPONENT_KEYS);
    for (const row of retained) {
      const chart = THEME_CATALOGS[row.themeKey]?.charts.find(
        (candidate) => candidate.componentKey === row.componentKey,
      );
      expect(chart, `${row.themeKey}:${row.componentKey}`).toBeDefined();
      expect(chart?.componentType, row.componentKey).toBe(row.componentType);
      const props = chart?.componentProps ?? {};
      const refs = parseStatSeriesRefs(props.seriesRefs) ?? [];
      // JR旅客輸送は単年のため比較表へ残し、推移図は私鉄の時系列だけを描く。
      const expectedMetricKeys = row.componentKey === "railway-passenger-trend"
        ? ["private-railway-passenger-transport"]
        : row.metricKeys;
      expect(refs.map((ref) => ref.metricKey)).toEqual(expectedMetricKeys);
      for (const key of expectedMetricKeys) expect(row.metricKeys).toContain(key);
      expect(refs.every((ref) => ref.label && ref.colorRole)).toBe(true);
      expect(refs.every((ref) => ref.area === undefined && ref.year === undefined)).toBe(true);
      expect(JSON.stringify(props)).not.toMatch(/(?:estatParams|statsDataId|categories)/);
    }
  });
});
