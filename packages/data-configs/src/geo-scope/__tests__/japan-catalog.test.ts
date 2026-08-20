import { describe, expect, it } from "vitest";

import { getMetricConfig } from "../../registry";
import { JAPAN_CATALOGS, getJapanCatalogTheme, listJapanCatalogThemes } from "../japan-catalog";

describe("JAPAN_CATALOGS (GEO-SCOPE-SEPARATION-01 WP4)", () => {
  it("catalog は空ではない (education-culture pilot が採用されている)", () => {
    expect(listJapanCatalogThemes().length).toBeGreaterThan(0);
  });

  it("全 metricKey が METRICS_REGISTRY に実在する (幽霊キーを持たない)", () => {
    for (const theme of listJapanCatalogThemes()) {
      for (const m of theme.metrics) {
        const config = getMetricConfig(m.metricKey);
        expect(config, `${theme.themeSlug}/${m.metricKey} が registry に無い`).toBeDefined();
      }
    }
  });

  it("全 metricKey が isActive:true である (非公開metricをJapanページに出さない)", () => {
    for (const theme of listJapanCatalogThemes()) {
      for (const m of theme.metrics) {
        const config = getMetricConfig(m.metricKey);
        expect(config?.isActive, `${theme.themeSlug}/${m.metricKey} が isActive:false`).toBe(true);
      }
    }
  });

  it("themeSlug と JAPAN_CATALOGS のキーが一致する (誤配置を防ぐ)", () => {
    for (const [key, theme] of Object.entries(JAPAN_CATALOGS)) {
      expect(theme.themeSlug).toBe(key);
    }
  });

  it("各テーマに metrics が最低1件ある (空カタログを作らない)", () => {
    for (const theme of listJapanCatalogThemes()) {
      expect(theme.metrics.length).toBeGreaterThan(0);
    }
  });

  it("getJapanCatalogTheme: 未登録スラッグは undefined を返す (存在しないふりをしない)", () => {
    expect(getJapanCatalogTheme("not-a-real-theme")).toBeUndefined();
  });

  it("getJapanCatalogTheme: 登録済みスラッグは正しいテーマを返す", () => {
    expect(getJapanCatalogTheme("education-culture")?.title).toBe("教育・文化");
  });
});
