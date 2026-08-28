import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { OCCUPATION_SALARY_CATALOG } from "../occupation-salary";
import { parseStatSeriesRefs } from "../stat-series-ref";

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

  it("4 chart はraw e-Statでなく正規化済みR2 metricだけを参照する", () => {
    for (const row of contract) {
      const chart = OCCUPATION_SALARY_CATALOG.charts.find(
        (candidate) => candidate.componentKey === row.componentKey,
      );
      expect(chart, row.componentKey).toBeDefined();
      const props = chart?.componentProps ?? {};
      const refs = parseStatSeriesRefs(props.seriesRefs) ?? [];
      expect(refs.map((ref) => ref.metricKey)).toEqual(row.metricKeys);
      expect(refs.every((ref) => ref.label && ref.colorRole)).toBe(true);
      expect(JSON.stringify(props)).not.toContain("estatParams");
    }
  });
});
