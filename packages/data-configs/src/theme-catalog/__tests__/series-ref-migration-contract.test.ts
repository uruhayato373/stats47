import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { requestKey } from "../chart-dependencies";
import { THEME_CATALOGS } from "../index";
import { parseStatSeriesRefs } from "../stat-series-ref";

import migrationContract from "./fixtures/series-ref-migration-contract.json";

const FORBIDDEN_TRANSFORMS = [
  "tabCombination",
  "axisSum",
  "axisRatio",
  "areaAxis",
  "timeScope",
  "valueScale",
] as const;

const NATIONAL_SCOPE_COMPONENTS = new Set([
  "theme-fishery-species-share",
  "theme-fishery-species-trend",
]);

function metricRequestKey(metricKey: string): string {
  const config = getMetricConfig(metricKey);
  expect(config, metricKey).toBeDefined();
  expect(config?.source.kind, metricKey).toBe("estat");
  if (!config || config.source.kind !== "estat") throw new Error(metricKey);
  const source = config.source;
  const filters = Object.fromEntries(
    (["cdCat01", "cdCat02", "cdCat03", "cdCat04", "cdCat05", "cdTab"] as const)
      .flatMap((key) => source[key] ? [[key, source[key]]] : []),
  ) as Record<string, string>;
  return requestKey({ statsDataId: source.statsDataId, filters });
}

function chartRefs(componentType: string, props: Record<string, unknown>) {
  if (componentType === "mixed-chart") {
    return [
      ...(parseStatSeriesRefs(props.columnSeriesRefs) ?? []),
      ...(parseStatSeriesRefs(props.lineSeriesRefs) ?? []),
    ];
  }
  return parseStatSeriesRefs(props.seriesRefs) ?? [];
}

describe("CROSS-PAGE-DATA-SSOT-01 exact migration contract", () => {
  it("54 chart の旧 request は参照先MetricConfigの取得条件と完全一致する", () => {
    expect(migrationContract).toHaveLength(54);
    for (const row of migrationContract) {
      expect(row.rawRequestKeys, row.componentKey).toEqual(
        row.metricKeys.map(metricRequestKey),
      );
      expect(row.rawRequestKeys.some((key) => /cd(?:Area|Time)=/.test(key))).toBe(false);
      expect(row.units, row.componentKey).toEqual(
        row.metricKeys.map((key) => getMetricConfig(key)?.unit),
      );
      for (const key of row.metricKeys) {
        const source = getMetricConfig(key)?.source;
        expect(source?.kind, key).toBe("estat");
        if (!source || source.kind !== "estat") continue;
        for (const transform of FORBIDDEN_TRANSFORMS) {
          expect(source[transform], `${row.componentKey}:${key}:${transform}`).toBeUndefined();
        }
      }
    }
  });

  it("54 chart は明示した全国チャート以外area overrideなしのtyped refsだけを持つ", () => {
    for (const row of migrationContract) {
      const catalog = THEME_CATALOGS[row.themeKey as keyof typeof THEME_CATALOGS];
      const chart = catalog.charts.find((candidate) => candidate.componentKey === row.componentKey);
      expect(chart, `${row.themeKey}:${row.componentKey}`).toBeDefined();
      const props = chart?.componentProps ?? {};
      expect(chartRefs(row.componentType, props).map((ref) => ref.metricKey)).toEqual(row.metricKeys);
      const refs = chartRefs(row.componentType, props);
      expect(refs.every((ref) => ref.year === undefined)).toBe(true);
      expect(refs.map((ref) => ref.area)).toEqual(
        NATIONAL_SCOPE_COMPONENTS.has(row.componentKey)
          ? refs.map(() => "national")
          : refs.map(() => undefined),
      );
      expect(JSON.stringify(props)).not.toMatch(/(?:estatParams|statsDataId|columnParams|lineParams)/);
      if (row.componentType === "composition-chart") expect(props.segments).toBeUndefined();
      if (row.componentType === "donut-chart") expect(props.categories).toBeUndefined();
    }
  });
});
