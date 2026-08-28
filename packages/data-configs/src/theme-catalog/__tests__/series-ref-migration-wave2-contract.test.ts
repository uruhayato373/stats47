import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { requestKey } from "../chart-dependencies";
import { THEME_CATALOGS } from "../index";
import { parseStatSeriesRefs } from "../stat-series-ref";

import migrationContract from "./fixtures/series-ref-migration-wave2-contract.json";

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

  it("10 chart は表示情報を内包したtyped refsだけを持つ", () => {
    for (const row of migrationContract) {
      const chart = THEME_CATALOGS[row.themeKey]?.charts.find(
        (candidate) => candidate.componentKey === row.componentKey,
      );
      expect(chart, `${row.themeKey}:${row.componentKey}`).toBeDefined();
      const props = chart?.componentProps ?? {};
      const refs = parseStatSeriesRefs(props.seriesRefs) ?? [];
      expect(refs.map((ref) => ref.metricKey)).toEqual(row.metricKeys);
      expect(refs.every((ref) => ref.label && ref.colorRole)).toBe(true);
      expect(JSON.stringify(props)).not.toMatch(/(?:estatParams|statsDataId|categories)/);
    }
  });
});
