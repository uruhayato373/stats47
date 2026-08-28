import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";
import {
  DASHBOARD_CATALOG_REL,
  makeDashboardCatalogFixture,
} from "../helpers/dashboard-catalog";

describe("dashboard catalog mirror", () => {
  let root = "";

  afterEach(() => {
    vi.useRealTimers();
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  async function collect(catalog: string) {
    root = makeFixtureRoot({
      stateFiles: { [DASHBOARD_CATALOG_REL]: catalog },
    });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    const { dashboardCatalog } = await import("@/lib/server/dashboard-catalog");
    return dashboardCatalog();
  }

  it("SSOTを集計し、現行テーマ名と基本監査を返す", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T03:00:00Z"));

    const result = await collect(makeDashboardCatalogFixture());

    expect(result.summary).toMatchObject({
      dashboards: 2,
      localDashboards: 1,
      stories: 40,
      resasStories: 40,
      coveredThemes: 20,
      declaredThemes: 20,
      partialDashboards: 1,
      staleStories: 0,
    });
    expect(result.audit.errors).toEqual([]);
    expect(result.audit.warnings).toContain("部分確認: 自治体ダッシュボード");
    expect(result.filters.themes).toContainEqual({
      key: "population-dynamics",
      label: "人口動態",
      count: 1,
    });
  });

  it("重複IDと現行テーマ欠落をFAILにする", async () => {
    const result = await collect(
      makeDashboardCatalogFixture({
        duplicateStoryId: true,
        omitTheme: "ports",
      })
    );

    expect(result.audit.status).toBe("fail");
    expect(result.audit.errors).toContain("ストーリーIDが重複: resas-story-0");
    expect(result.audit.errors).toContain(
      "現行テーマがカタログ宣言にない: ports"
    );
  });
});
