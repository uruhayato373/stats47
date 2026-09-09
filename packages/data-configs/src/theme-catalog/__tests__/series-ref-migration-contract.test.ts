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

// 移行時の54件は取得条件の歴史記録。概況展開後に残す19件は別に固定し、
// 意図しない図の欠落を「存在するものだけ検査」で見逃さない。
const RETAINED_COMPONENT_KEYS = [
  "cmp-pop-elderly-household",
  "theme-fishery-catch-trend",
  "theme-fishery-aquaculture-mix",
  "theme-foreign-nationality-trend",
  "theme-health-supply-trend",
  "theme-lm-employment-mobility-trend",
  "theme-lw-employment-rate-trend",
  "vacancy-ownership-rate-trend",
  "lh-dwelling-floor-area-trend",
  "theme-industry-structure",
  "theme-le-establishments-trend",
  "theme-lf-fiscal-ratios-trend",
  "manufacturing-establishments-employees-trend",
  "manufacturing-shipment-value-trend",
  "railway-freight-trend",
  "real-income-cpi-breakdown",
  "crime-count-arrest-rate-trend",
  "traffic-accident-deaths-trend",
  "theme-tourism-stay-trend",
];

// 同軸で比較できない系列は別図へ、単年・長期欠測の系列は比較表へ移した。
const RESELECTED_METRIC_KEYS: Record<string, string[]> = {
  "vacancy-ownership-rate-trend": ["vacant-housing-ratio"],
  "lh-dwelling-floor-area-trend": ["floor-area-per-dwelling-rented"],
  "theme-lf-fiscal-ratios-trend": ["fiscal-strength-index-prefecture"],
  "real-income-cpi-breakdown": ["consumer-price-difference-index-overall"],
};

const RESELECTED_COMPONENT_TYPES: Record<string, string> = {
  "theme-fishery-aquaculture-mix": "line-chart",
  "theme-industry-structure": "line-chart",
};

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

  it("存続する19 chartは選定済み系列をtyped refsで持ち、area overrideを追加しない", () => {
    const retained = migrationContract.filter((row) =>
      THEME_CATALOGS[row.themeKey]?.charts.some((chart) => chart.componentKey === row.componentKey),
    );
    expect(retained.map((row) => row.componentKey)).toEqual(RETAINED_COMPONENT_KEYS);
    for (const row of retained) {
      const catalog = THEME_CATALOGS[row.themeKey as keyof typeof THEME_CATALOGS];
      const chart = catalog.charts.find((candidate) => candidate.componentKey === row.componentKey);
      expect(chart, `${row.themeKey}:${row.componentKey}`).toBeDefined();
      const props = chart?.componentProps ?? {};
      const componentType = RESELECTED_COMPONENT_TYPES[row.componentKey] ?? row.componentType;
      expect(chart?.componentType, row.componentKey).toBe(componentType);
      const refs = chartRefs(componentType, props);
      const expectedMetricKeys = RESELECTED_METRIC_KEYS[row.componentKey] ?? row.metricKeys;
      expect(refs.map((ref) => ref.metricKey), row.componentKey).toEqual(expectedMetricKeys);
      for (const key of expectedMetricKeys) expect(row.metricKeys).toContain(key);
      expect(refs.every((ref) => ref.year === undefined)).toBe(true);
      expect(refs.map((ref) => ref.area)).toEqual(
        NATIONAL_SCOPE_COMPONENTS.has(row.componentKey)
          ? refs.map(() => "national")
          : refs.map(() => undefined),
      );
      expect(JSON.stringify(props)).not.toMatch(/(?:estatParams|statsDataId|columnParams|lineParams)/);
      expect(props.segments).toBeUndefined();
      expect(props.categories).toBeUndefined();
    }
  });
});
