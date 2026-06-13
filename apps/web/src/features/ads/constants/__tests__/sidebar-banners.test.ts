import { describe, expect, it } from "vitest";

import {
  SIDEBAR_PROMO_BANNERS,
  selectPromoBannerIndexForRanking,
} from "../sidebar-banners";

// index 0 = STRATEGY CAREER (エンジニア転職・targetRankingKeys 付き)
// index 1 = 汎用 (就職エージェント・targetRankingKeys なし)
describe("selectPromoBannerIndexForRanking — 固定サイドバーバナーの文脈出し分け", () => {
  it("IT 職の年収 ranking では STRATEGY CAREER (targetRankingKeys 一致) を選ぶ", () => {
    const idx = selectPromoBannerIndexForRanking("software-engineer-annual-income");
    expect(SIDEBAR_PROMO_BANNERS[idx].id).toBe("strategy-career-300x250");
  });

  it("非 IT 職の年収 ranking では汎用バナーへフォールバック (エンジニア転職を出さない)", () => {
    const idx = selectPromoBannerIndexForRanking("nurse-annual-income");
    expect(SIDEBAR_PROMO_BANNERS[idx].targetRankingKeys).toBeUndefined();
    expect(SIDEBAR_PROMO_BANNERS[idx].id).not.toBe("strategy-career-300x250");
  });

  it("rankingKey 未指定でも汎用バナー (ターゲット広告を出さない)", () => {
    const idx = selectPromoBannerIndexForRanking(undefined);
    expect(SIDEBAR_PROMO_BANNERS[idx].targetRankingKeys).toBeUndefined();
  });
});
