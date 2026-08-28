import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { collectThemeDataDependencies } from "../chart-dependencies";
import { THEME_CATALOGS } from "../index";
import { enumeratePyramidCategoryCodes } from "../population-pyramid-deps";

describe("CROSS-PAGE-DATA-SSOT-01 final typed-reference contract", () => {
  const dependencies = collectThemeDataDependencies(Object.values(THEME_CATALOGS));

  it("ThemeCatalogの生e-Stat requestを0件にする", () => {
    expect(dependencies.totalRequests).toBe(0);
    expect(dependencies.distinctRequests).toEqual([]);
  });

  it("人口ピラミッドは34系列すべてを登録済みMetricConfigで列挙する", () => {
    const expectedCodes = new Set(enumeratePyramidCategoryCodes().map(({ code }) => code));
    const pyramids = dependencies.perChart.filter(
      ({ componentType }) => componentType === "pyramid-chart",
    );

    expect(pyramids).toHaveLength(2);
    for (const pyramid of pyramids) {
      expect(pyramid.requests).toEqual([]);
      expect(pyramid.metricRefs).toHaveLength(expectedCodes.size);
      const actualCodes = new Set(
        pyramid.metricRefs.map((ref) => {
          const config = getMetricConfig(ref.metricKey);
          expect(config?.isActive).toBe(false);
          expect(config?.source.kind).toBe("estat");
          return config?.source.kind === "estat" ? config.source.cdCat01 : undefined;
        }),
      );
      expect(actualCodes).toEqual(expectedCodes);
    }
  });
});
