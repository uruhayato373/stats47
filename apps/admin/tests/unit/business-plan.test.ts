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
      ].map((path) => [path, "---\nupdated: 2026-08-28\nstatus: active\n---\n"])
    );
    root = makeFixtureRoot({
      stateFiles: {
        ".claude/state/business-plan/latest.json": STATE,
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
      unmeasuredEvents: 7,
    });
    expect(result.state).toMatchObject({
      catalogId: "stats47-business-plan-2026",
    });
    expect(result.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ updated: "2026-08-28", status: "active" }),
      ])
    );
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
