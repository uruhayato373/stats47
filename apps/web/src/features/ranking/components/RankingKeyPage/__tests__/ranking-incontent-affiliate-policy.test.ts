import { describe, expect, it } from "vitest";

import { shouldShowRankingInContentAffiliate } from "../ranking-incontent-affiliate-policy";

describe("ranking 本文中段アフィリエイトの表示方針", () => {
  it("精神科病床数ランキングでは表示しない", () => {
    expect(shouldShowRankingInContentAffiliate("psychiatric-bed-count")).toBe(false);
  });

  it("抑止対象ではないランキングでは従来どおり表示する", () => {
    expect(shouldShowRankingInContentAffiliate("library-count")).toBe(true);
  });
});
