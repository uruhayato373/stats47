import { describe, expect, it } from "vitest";

import type { JapanZueCandidate, JapanZueEvidenceItem } from "../../types";
import { diffEvidenceInventory, findExpressionMatches } from "../audit";

describe("findExpressionMatches", () => {
  it("長い逐語コピーを本文を漏らさず検出する", () => {
    const copied = "地域ごとの違いを読み解くためには複数の指標を同じ期間で比べる必要があります";
    const matches = findExpressionMatches([{ id: "copied", text: copied }], `前文${copied}後文`, 20);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toMatchObject({ publicId: "copied", windowLength: 20 });
    expect(JSON.stringify(matches)).not.toContain("地域ごと");
  });

  it("独立した問いを誤検出しない", () => {
    const matches = findExpressionMatches(
      [{ id: "original", text: "求人が増えても失業率が同じ方向に動かないのはなぜか" }],
      "労働市場に関する年次統計を掲載する。",
      20,
    );
    expect(matches).toEqual([]);
  });
});

describe("diffEvidenceInventory", () => {
  const candidate = (id: string, fingerprint: string, itemNumber = id, edition = "2025-26"): JapanZueCandidate => ({
    id,
    source: { key: "japan-zue", edition, page: 1, kind: "table", itemNumber },
    topicHint: id,
    sourceFingerprint: fingerprint,
    primarySourceOrganizations: [],
    publicationHints: [],
    dataYears: [],
    geoScopes: ["japan"],
    metricCandidates: [],
  });
  const item = (id: string, metricKey: string, itemNumber = id, edition = "2025-26"): JapanZueEvidenceItem => ({
    id,
    source: { key: "japan-zue", edition, page: 1, kind: "table", itemNumber },
    topicHint: id,
    sourceFingerprint: "new",
    resolution: "reuse-existing-metric",
    resolutionReason: "test",
    primarySources: [],
    dataContract: { units: ["人"], geoScopes: ["japan"], dataYears: ["2025"] },
    mapping: { metricKeys: [metricKey], geoScopes: ["japan"] },
    review: { method: "manual-override", reviewedAt: "2026-08-29", policyVersion: 1 },
  });

  it("追加・変更・削除と影響指標を決定的に返す", () => {
    expect(
      diffEvidenceInventory(
        [candidate("same", "a"), candidate("changed", "new"), candidate("added", "x")],
        [candidate("same", "a"), candidate("changed", "old"), candidate("removed", "z")],
        [item("changed", "metric-b"), item("added", "metric-a")],
      ),
    ).toEqual({
      added: ["added"],
      changed: ["changed"],
      removed: ["removed"],
      impactedMetricKeys: ["metric-a", "metric-b"],
      updateQueue: [
        {
          logicalKey: "table:chapter-unknown:item-added",
          changeType: "added",
          currentEvidenceId: "added",
          metricKeys: ["metric-a"],
          contentRoles: [],
          requiredActions: ["review-primary-source", "resolve-lineage", "plan-content-if-eligible"],
        },
        {
          logicalKey: "table:chapter-unknown:item-changed",
          changeType: "changed",
          currentEvidenceId: "changed",
          previousEvidenceId: "changed",
          metricKeys: ["metric-b"],
          contentRoles: [],
          requiredActions: ["revalidate-primary-source", "refresh-observations", "review-impacted-content"],
        },
        {
          logicalKey: "table:chapter-unknown:item-removed",
          changeType: "removed",
          previousEvidenceId: "removed",
          metricKeys: [],
          contentRoles: [],
          requiredActions: ["retire-or-remap-lineage", "review-orphan-content"],
        },
      ],
    });
  });

  it("版名とページが変わっても表番号で同じ論点を更新キューへ載せる", () => {
    const currentId = "japan-zue-2026-27-p031-table01";
    const previousId = "japan-zue-2025-26-p029-table01";
    const diff = diffEvidenceInventory(
      [candidate(currentId, "new", "2-2", "2026-27")],
      [candidate(previousId, "old", "2-2", "2025-26")],
      [item(currentId, "metric-a", "2-2", "2026-27")],
    );
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
    expect(diff.changed).toEqual([currentId]);
    expect(diff.updateQueue[0]).toMatchObject({
      logicalKey: "table:chapter-unknown:item-2-2",
      changeType: "changed",
      currentEvidenceId: currentId,
      previousEvidenceId: previousId,
      metricKeys: ["metric-a"],
    });
  });
});
