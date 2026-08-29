import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

const STATE = JSON.stringify({
  schemaVersion: 1,
  generatedAt: "2026-08-28T00:00:00.000Z",
  catalogId: "stats47-business-plan-2026",
  catalogVersion: "2026-08-28.1",
  sourceSha256: "hash",
  coverage: { decisions: 25 },
  statusCounts: { adopted: 6, adapted: 17, deferred: 2 },
  eventCounts: { measured: 2, "not-instrumented": 7 },
  sourceFreshness: { ga4: null },
  nextActions: [],
  measurementWarning: "未計測を0として扱わない",
});

afterEach(() => {
  delete process.env.STATS47_PROJECT_ROOT;
});

describe("business plan admin server", () => {
  let root: string;
  afterEach(() => root && cleanupFixtureRoot(root));

  it("authored catalogとderived stateを分け、在庫と計測欠損を集計する", async () => {
    const documentFiles = Object.fromEntries(
      [
        "docs/00_プロジェクト管理/01_プロジェクト定義.md",
        "docs/00_プロジェクト管理/02_収益化戦略.md",
        "docs/00_プロジェクト管理/03_マーケティング戦略.md",
        "docs/00_プロジェクト管理/04_ターゲットペルソナ.md",
        "docs/01_技術設計/02_データアーキテクチャ.md",
        "docs/01_技術設計/03_情報設計.md",
        "docs/01_技術設計/04_デザインシステム.md",
        "docs/01_技術設計/06_自動化インベントリ.md",
        ".claude/rules/analytics-event-standards.md",
        ".claude/rules/gis-data.md",
        "docs/02_実装計画/47_GeoAI事業M1実装仕様.md",
      ].map((path) => [path, "---\nupdated: 2026-08-28\nstatus: active\n---\n"])
    );
    root = makeFixtureRoot({
      stateFiles: {
        ".claude/state/business-plan/latest.json": STATE,
        ".claude/state/sns/posts.json": JSON.stringify({
          posts: [
            { platform: "x", content_key: "geo-001-x-01", status: "draft" },
            { platform: "x", content_key: "geo-001-x-02", status: "scheduled" },
            { platform: "instagram", content_key: "geo-001-x-03", status: "draft" },
          ],
        }),
        ...documentFiles,
      },
    });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    const { businessPlanAdminData } =
      await import("@/lib/server/business-plan");
    const result = businessPlanAdminData();

    expect(result.catalog.decisions).toHaveLength(25);
    expect(result.counts).toEqual({
      readyContent: 4,
      gatedInitiatives: 8,
      unmeasuredEvents: 3,
    });
    expect(result.state).toMatchObject({
      catalogId: "stats47-business-plan-2026",
    });
    expect(result.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ updated: "2026-08-28", status: "active" }),
      ])
    );
    expect(result.m1.x).toMatchObject({
      planned: 15,
      registered: 2,
      draft: 1,
      scheduled: 1,
      posted: 0,
    });
    expect("error" in result.m1.x).toBe(false);
    if (!("error" in result.m1.x)) {
      expect(result.m1.x.posts).toHaveLength(15);
      expect(result.m1.x.posts[0]).toMatchObject({
        contentKey: "geo-001-x-01",
        registryStatus: "draft",
        mediaReady: false,
      });
    }
    expect(result.m1.note).toMatchObject({
      planned: 15,
      registered: 15,
      withBody: 0,
    });
    expect(result.m1.note.products).toHaveLength(15);
    expect(result.m1.note.products[0]).toMatchObject({
      articleKey: "d-geo-ipss-municipality-map",
      priceYen: 1980,
      hasBody: false,
      catalogStatus: "draft",
    });
    expect(result.m1.events).toEqual({
      planned: 4,
      codeMapped: 4,
      measured: 0,
      registrationPending: 4,
      items: expect.arrayContaining([
        expect.objectContaining({
          id: "geo-view",
          canonicalEvent: "geo_analysis_view",
          status: "partially-measured",
        }),
      ]),
    });
    expect(result.m1.releaseChecks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "x-drafts", status: "pending" }),
        expect.objectContaining({ id: "note-catalog", status: "pass" }),
        expect.objectContaining({ id: "ga4", status: "pending", external: true }),
      ]),
    );
    expect(result.m1.analyses).toHaveLength(4);
    expect(result.m1.analyses.map((analysis) => analysis.slug)).toEqual([
      "2050-population",
      "population-land-price",
      "population-flood-risk",
      "population-station-access",
    ]);
  });

  it("stateや文書が無い場合もthrowせず、読み取り失敗を表示層へ渡す", async () => {
    root = makeFixtureRoot({});
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    const { businessPlanAdminData } =
      await import("@/lib/server/business-plan");
    const result = businessPlanAdminData();

    expect(result.state).toHaveProperty("error");
    expect(result.documents).toHaveProperty("error");
    expect(result.counts.readyContent).toBe(4);
    expect(result.m1.x).toMatchObject({ planned: 15, registered: 0 });
  });

  it("文書詳細はallowlistのIDだけを読み、frontmatterを本文から除く", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        "docs/00_プロジェクト管理/01_プロジェクト定義.md":
          "---\nupdated: 2026-08-28\nstatus: active\n---\n# 本文\n\n説明",
      },
    });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    const { businessPlanDocument } = await import("@/lib/server/business-plan");

    expect(businessPlanDocument("project-definition")).toMatchObject({
      updated: "2026-08-28",
      status: "active",
      body: "# 本文\n\n説明",
    });
    expect(businessPlanDocument("../../package.json")).toBeNull();
  });
});
