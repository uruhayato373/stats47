import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DASHBOARD_CATALOG_REL,
  makeDashboardCatalogFixture,
} from "../helpers/dashboard-catalog";
import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

describe("GET /api/research/dashboard-catalog", () => {
  let root = "";

  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("調査カタログをno-storeで返す", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        [DASHBOARD_CATALOG_REL]: makeDashboardCatalogFixture(),
      },
    });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();

    const { GET } = await import("@/app/api/research/dashboard-catalog/route");
    const response = GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(json.summary.resasStories).toBe(40);
    expect(json.stories).toHaveLength(40);
  });

  it("SSOT不在時は詳細を漏らさず500を返す", async () => {
    root = makeFixtureRoot();
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();

    const { GET } = await import("@/app/api/research/dashboard-catalog/route");
    const response = GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: "調査カタログを読み込めません",
    });
  });
});
