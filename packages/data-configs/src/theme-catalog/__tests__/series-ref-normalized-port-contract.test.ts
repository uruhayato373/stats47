import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { PORTS_CATALOG } from "../ports";
import { parseStatSeriesRefs } from "../stat-series-ref";

describe("CROSS-PAGE-DATA-SSOT-01 normalized port migration", () => {
  it("輸出入カテゴリを保持し、輸送形態合算recipeをMetricConfigに固定する", () => {
    const expected = [
      ["port-cargo-export", "110"],
      ["port-cargo-import", "120"],
    ] as const;
    for (const [metricKey, cdCat01] of expected) {
      const config = getMetricConfig(metricKey);
      expect(config?.source.kind, metricKey).toBe("estat");
      if (!config || config.source.kind !== "estat") continue;
      expect(config.source.statsDataId).toBe("0003130738");
      expect(config.source.cdCat01).toBe(cdCat01);
      expect(config.source.cdCat02).toBe("100");
      expect(config.source.axisSum).toEqual({ axis: "cat03", codes: ["110", "120", "130"] });
      expect(config.unit).toBe("トン");
    }
  });

  it("ports-cargo-trend は正規化済みR2 metricだけを参照する", () => {
    const chart = PORTS_CATALOG.charts.find((candidate) => candidate.componentKey === "ports-cargo-trend");
    const props = chart?.componentProps ?? {};
    expect(parseStatSeriesRefs(props.seriesRefs)?.map((ref) => ref.metricKey)).toEqual([
      "port-cargo-export",
      "port-cargo-import",
    ]);
    expect(JSON.stringify(props)).not.toContain("estatParams");
  });
});
