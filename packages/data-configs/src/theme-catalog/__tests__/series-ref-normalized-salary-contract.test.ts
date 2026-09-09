import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { OCCUPATION_SALARY_CATALOG } from "../occupation-salary";

import contract from "./fixtures/series-ref-normalized-salary-contract.json";

describe("CROSS-PAGE-DATA-SSOT-01 normalized salary migration", () => {
  it("raw職種コードを保持し、MetricConfigの年収合成・単位正規化を必須にする", () => {
    for (const row of contract) {
      row.metricKeys.forEach((metricKey, index) => {
        const config = getMetricConfig(metricKey);
        expect(config?.source.kind, metricKey).toBe("estat");
        if (!config || config.source.kind !== "estat") return;
        expect(config.source.statsDataId, metricKey).toBe("0003445758");
        expect(config.source.cdCat02, metricKey).toBe(row.rawCategoryCodes[index]);
        expect(config.source.cdCat01, metricKey).toBe("01");
        expect(config.source.valueScale, metricKey).toBe(0.1);
        expect(config.source.tabCombination, metricKey).toEqual([
          { cdTab: "08", factor: 12 },
          { cdTab: "12", factor: 1 },
        ]);
        expect(config.unit, metricKey).toBe("万円");
      });
    }
  });

  it("単年の4推移図を再表示せず、正規化済み指標を比較表と全指標に残す", () => {
    expect(OCCUPATION_SALARY_CATALOG.charts.filter(
      (chart) => chart.componentType !== "markdown-section",
    )).toEqual([]);
    const catalogMetricKeys = OCCUPATION_SALARY_CATALOG.metrics.map((metric) => metric.rankingKey);
    for (const row of contract) {
      for (const metricKey of row.metricKeys) expect(catalogMetricKeys).toContain(metricKey);
    }
    for (const metricKey of [
      "software-engineer-annual-income",
      "truck-driver-annual-income",
      "school-teacher-annual-income",
    ]) {
      expect(OCCUPATION_SALARY_CATALOG.overview?.comparisonRankingKeys).toContain(metricKey);
    }
  });
});
