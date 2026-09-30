import { describe, expect, it } from "vitest";

import { AFFILIATE_ADS } from "../../../../../scripts/affiliate-ads-data";
import { resolveContentVertical } from "../affiliate-category";
import { isAffiliateActive, matchesRankingTarget } from "../affiliate-delivery-policy";
import { applyRankingAffiliatePolicy, RANKING_AFFILIATE_POLICY } from "../ranking-affiliate-policy";

import type { AffiliateAd } from "../../types";

describe("RANKING_AFFILIATE_POLICY", () => {
  it("routes the census household growth ranking to housing instead of population", () => {
    const input = applyRankingAffiliatePolicy("census-household-change-rate-5y", {
      surveyIds: ["census"],
      tagKeys: [],
      categoryKey: "population",
    });
    expect(resolveContentVertical(input).vertical).toBe("housing");
  });

  it("leaves rankings without an entry on the normal survey → tag → category chain", () => {
    const input = { surveyIds: ["census"], tagKeys: [], categoryKey: "population" };
    expect(applyRankingAffiliatePolicy("total-population", input)).toBe(input);
  });

  // 指定先の vertical に在庫が無いと、例外を足しても枠は空のまま (人口分類と同じ状態) になる
  it("points every non-null exception at a vertical with deliverable inventory for that ranking", () => {
    for (const [rankingKey, policy] of Object.entries(RANKING_AFFILIATE_POLICY)) {
      expect(policy.reason.trim().length).toBeGreaterThan(20);
      if (!policy.vertical) continue;
      const deliverable = (AFFILIATE_ADS as AffiliateAd[]).filter(
        (ad) => ad.vertical === policy.vertical && isAffiliateActive(ad) && matchesRankingTarget(ad, rankingKey),
      );
      expect(deliverable.length, rankingKey).toBeGreaterThan(0);
    }
  });
});
