import { describe, expect, it } from "vitest";

import { buildAffiliatePortfolioViewModel } from "@/lib/server/affiliate-portfolio-view";

describe("affiliate portfolio view model", () => {
  it("二層件数・確定収益・次の1件をstateから畳む", () => {
    const view = buildAffiliatePortfolioViewModel({
      generatedAt: "2026-08-28T00:00:00.000Z",
      gates: { portfolio: { status: "ready", reasons: [] } },
      summary: { offers: 2, ads: 3, unclassified: 0, sharedOutcomePrograms: 0 },
      offers: [
        { programRef: "a8:1", lane: "discovery", portfolioStatus: "active", metrics: { confirmedRevenueYen: { value: 300, unavailableReason: null } } },
        { programRef: "a8:2", lane: "decision", portfolioStatus: "active", metrics: { confirmedRevenueYen: { value: 700, unavailableReason: null } } },
      ],
      recommendedActions: [{ id: "present-one-pilot-candidate", reasons: [] }],
    });
    expect(view.lanes).toEqual([{ lane: "decision", count: 1 }, { lane: "discovery", count: 1 }]);
    expect(view.confirmedRevenueYen).toBe(1000);
    expect(view.nextAction?.id).toBe("present-one-pilot-candidate");
  });

  it("欠損収益を0へ丸めず理由を表示する", () => {
    const view = buildAffiliatePortfolioViewModel({
      offers: [{
        programRef: "a8:1",
        lane: "unknown",
        portfolioStatus: "pending-classification",
        metrics: { confirmedRevenueYen: { value: null, unavailableReason: "a8-shared-account-program" } },
      }],
      recommendedActions: [{ id: "classify-next-offer", reasons: [], programRef: "a8:1" }],
    });
    expect(view.confirmedRevenueYen).toBeNull();
    expect(view.confirmedRevenueUnavailableReason).toBe("a8-shared-account-program");
    expect(view.unclassifiedProgramRefs).toEqual(["a8:1"]);
  });

  it("一部案件だけ収益既知でも全体額として合算しない", () => {
    const view = buildAffiliatePortfolioViewModel({
      offers: [
        { programRef: "a8:1", lane: "discovery", portfolioStatus: "active", metrics: { confirmedRevenueYen: { value: 500, unavailableReason: null } } },
        { programRef: "a8:2", lane: "decision", portfolioStatus: "active", metrics: { confirmedRevenueYen: { value: null, unavailableReason: "outcome-unavailable" } } },
      ],
      recommendedActions: [{ id: "collect-fresh-site-scoped-outcomes", reasons: [] }],
    });
    expect(view.confirmedRevenueYen).toBeNull();
    expect(view.confirmedRevenueUnavailableReason).toBe("outcome-unavailable");
  });
});
