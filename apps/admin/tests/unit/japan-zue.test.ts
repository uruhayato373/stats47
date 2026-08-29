import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

const REL = ".claude/state/source-inventory/japan-zue/2025-26/summary.json";
const SUMMARY = JSON.stringify({
  sourceKey: "japan-zue",
  edition: "2025-26",
  candidatesSha256: "abcdef0123456789",
  counts: { table: 757, figure: 201, "text-stat": 458, total: 1416 },
  resolutionCounts: { "reuse-existing-metric": 3, "combined-analysis": 6, "new-metric": 1 },
  resolutionCoverage: 1,
  primarySourceCoverage: 0.35,
  productionReadyCount: 9,
  publicCandidateCount: 10,
  pilotReadyCount: 10,
  manualOverrideCount: 10,
  blockers: { primarySourceUnavailable: 1396, rightsHold: 22, unreviewed: 0 },
});

describe("japan-zue research server", () => {
  let root = "";
  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    delete process.env.STATS47_PROJECT_ROOT;
  });

  it("summaryと人手確認pilot・マスター展開を同じlineageで返す", async () => {
    root = makeFixtureRoot({ stateFiles: { [REL]: SUMMARY } });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    const { japanZueResearchData } = await import("@/lib/server/japan-zue");
    const result = japanZueResearchData();
    expect(result).not.toHaveProperty("error");
    if ("error" in result) return;
    expect(result.summary.counts.total).toBe(1416);
    expect(result.pilot).toHaveLength(10);
    expect(result.masterContent.youtube.experimentId).toBe("EXP-006");
    expect(result.masterContent.youtube.experimentCapacity).toMatchObject({
      maxMasters: 3,
      plannedMasters: 3,
      availableSlots: 0,
      assignment: "unassigned",
    });
    expect(result.masterContent.article.status).toBe("draft-ready-review-pending");
    expect(result.masterContent.article.sections.every((section) => section.body.length >= 100)).toBe(true);
    expect(result.masterContent.derivatives.map((item) => item.platform)).toEqual([
      "instagram", "instagram", "x", "x",
    ]);
  });

  it("state欠損を500にせず読み取り失敗として返す", async () => {
    root = makeFixtureRoot();
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    const { japanZueResearchData } = await import("@/lib/server/japan-zue");
    expect(japanZueResearchData()).toMatchObject({ source: REL });
    expect(japanZueResearchData()).toHaveProperty("error");
  });
});
