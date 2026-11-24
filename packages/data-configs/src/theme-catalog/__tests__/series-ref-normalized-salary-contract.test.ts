import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { parseStatSeriesRefs } from "../registered-series-ref";

import contract from "./fixtures/series-ref-normalized-salary-contract.json";
import { THEME_CATALOGS } from "..";

const OCCUPATION_SALARY_CATALOG = THEME_CATALOGS["occupation-salary"];

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
          { cdTab: "08,40", factor: 12 },
          { cdTab: "12,44", factor: 1 },
        ]);
        expect(config.unit, metricKey).toBe("万円");
      });
    }
  });

  // 2026-11-24 (METRIC-GATE-FOLLOWUP-02): 4 枚の折れ線は観測年が 2 年 (2020・2023) しか無く推移として読めないので、
  // 同じ正規化済み指標を数値タイル (metricGroups の view: "tiles") に替えた。元の図の key は fixture に記録として残す。
  it("4 組の正規化済みR2 metricは数値タイルのカードに載り、図はraw e-Statを参照しない", () => {
    const groups = OCCUPATION_SALARY_CATALOG.metricGroups ?? [];
    for (const row of contract) {
      expect(
        OCCUPATION_SALARY_CATALOG.charts.some((candidate) => candidate.componentKey === row.componentKey),
        `${row.componentKey} は数値タイルへ替えた`,
      ).toBe(false);
      for (const metricKey of row.metricKeys) {
        const group = groups.find((candidate) => candidate.rankingKeys.includes(metricKey));
        expect(group, metricKey).toBeDefined();
        expect(group?.view, metricKey).toBe("tiles");
      }
    }
    for (const chart of OCCUPATION_SALARY_CATALOG.charts) {
      expect(JSON.stringify(chart.componentProps ?? {}), chart.componentKey).not.toContain("estatParams");
      const refs = parseStatSeriesRefs(chart.componentProps?.seriesRefs) ?? [];
      expect(refs.every((ref) => ref.label && ref.colorRole), chart.componentKey).toBe(true);
    }
  });
});
