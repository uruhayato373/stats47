import { describe, expect, it, vi, beforeEach } from "vitest";

// 完全DBレス: repository は R2 snapshot を読む。snapshot reader と logger をモックして
// targetRankingKeys (ranking-key 単位ターゲティング) のフィルタ挙動を検証する。
// vi.mock は巻き上げられるため、参照する mock は vi.hoisted で先に初期化する。
const { mockLoadSnapshot } = vi.hoisted(() => ({ mockLoadSnapshot: vi.fn() }));

vi.mock("@stats47/r2-storage/server", () => ({
  createSnapshotReader: () => mockLoadSnapshot,
  saveToR2: vi.fn(),
}));

vi.mock("@stats47/logger/server", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import {
  readActiveBannersByVerticalsFromR2,
  readActiveTextAdsByVerticalsFromR2,
  readActiveTextAdByVerticalFromR2,
  readActiveBannersByLocationFromR2,
  readActiveExperimentVariantsByVerticalFromR2,
} from "../affiliate-ad-snapshot";

import type { AffiliateAd } from "../../types";

function banner(overrides: Partial<AffiliateAd>): AffiliateAd {
  return {
    id: "x",
    title: "t",
    htmlContent: `https://example.com/${overrides.id ?? "x"}`,
    areaCode: null,
    categoryKey: "laborwage",
    locationCode: "blog-bottom",
    isActive: true,
    priority: 50,
    startDate: null,
    endDate: null,
    targetCategories: null,
    adType: "banner",
    imageUrl: "https://example.com/img.png",
    trackingPixelUrl: "https://example.com/pixel",
    width: 320,
    height: 100,
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

// エンジニア転職広告 (STRATEGY CAREER 相当): software-engineer 系 ranking のみ対象
const engineerAd = banner({
  id: "strategy-career",
  targetRankingKeys: ["software-engineer-annual-income"],
});
// 汎用転職バナー: 全 laborwage ランキングで文脈一致 (targetRankingKeys なし)
const genericAd = banner({ id: "generic-tenshoku", targetRankingKeys: null });

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadSnapshot.mockResolvedValue({
    generatedAt: "2026-01-01T00:00:00.000Z",
    ads: [engineerAd, genericAd],
  });
});

describe("readActiveBannersByVerticalsFromR2 — targetRankingKeys ターゲティング", () => {
  it("対象 rankingKey 一致時は、ターゲット広告と汎用広告の両方を返す", async () => {
    const result = await readActiveBannersByVerticalsFromR2(
      ["labor"],
      10,
      "software-engineer-annual-income",
    );
    expect(result.map((a) => a.id).sort()).toEqual(["generic-tenshoku", "strategy-career"]);
  });

  it("非対象 rankingKey ではターゲット広告を除外し、汎用広告のみ返す (文脈漏れ防止)", async () => {
    // 看護師年収ページにエンジニア転職広告が漏れていた本番事象の再発防止
    const result = await readActiveBannersByVerticalsFromR2(
      ["labor"],
      10,
      "nurse-annual-income",
    );
    expect(result.map((a) => a.id)).toEqual(["generic-tenshoku"]);
  });

  it("rankingKey 未指定の非ranking文脈ではranking専用広告を除外する", async () => {
    const result = await readActiveBannersByVerticalsFromR2(["labor"], 10);
    expect(result.map((a) => a.id)).toEqual(["generic-tenshoku"]);
  });
});

describe("readActiveTextAdsByVerticalsFromR2 — targetRankingKeys ターゲティング (text 広告)", () => {
  const engineerText = banner({
    id: "strategy-career-text",
    adType: "text",
    imageUrl: null,
    locationCode: "sidebar-bottom",
    targetRankingKeys: ["software-engineer-annual-income"],
  });
  const genericText = banner({
    id: "generic-text",
    adType: "text",
    imageUrl: null,
    locationCode: "sidebar-bottom",
    targetRankingKeys: null,
  });

  beforeEach(() => {
    mockLoadSnapshot.mockResolvedValue({
      generatedAt: "2026-01-01T00:00:00.000Z",
      ads: [engineerText, genericText],
    });
  });

  it("対象 rankingKey 一致時は両方返す", async () => {
    const r = await readActiveTextAdsByVerticalsFromR2(
      ["labor"],
      "sidebar-bottom",
      10,
      "software-engineer-annual-income",
    );
    expect(r.map((a) => a.id).sort()).toEqual(["generic-text", "strategy-career-text"]);
  });

  it("非対象 rankingKey ではエンジニア転職 text を除外し汎用のみ返す", async () => {
    const r = await readActiveTextAdsByVerticalsFromR2(
      ["labor"],
      "sidebar-bottom",
      10,
      "nurse-annual-income",
    );
    expect(r.map((a) => a.id)).toEqual(["generic-text"]);
  });

  it("rankingKey 未指定の非ranking文脈でもtargetRankingKeysを無視しない", async () => {
    const r = await readActiveTextAdsByVerticalsFromR2(
      ["labor"],
      "sidebar-bottom",
      10,
    );
    expect(r.map((a) => a.id)).toEqual(["generic-text"]);
  });
});

describe("配信安全ゲート・案件重複", () => {
  const setAds = (ads: AffiliateAd[]) => mockLoadSnapshot.mockResolvedValue({ generatedAt: "2026-09-01T00:00:00Z", ads });

  it("古いsnapshotのactive=trueでも、未提携3案件をad IDとprogramRefの双方で止める", async () => {
    setAds([
      banner({ id: "af_classpass_001" }),
      banner({ id: "af_housing_banner_001" }),
      banner({ id: "af_maca_emperor_001" }),
      banner({ id: "other-creative", programRef: "a8:s00000026970001" }),
      genericAd,
    ]);
    expect((await readActiveBannersByVerticalsFromR2(["labor"], 20)).map((ad) => ad.id)).toEqual([genericAd.id]);
  });

  it("同一案件の別リンク・別IDの同じリンクをlimit適用前に除き、優先順位の高い1件だけ返す", async () => {
    setAds([
      banner({ id: "a", programRef: "a8:program", priority: 100 }),
      banner({ id: "a-size2", programRef: "a8:program", priority: 90 }),
      banner({ id: "b", htmlContent: "https://example.com/a", priority: 80 }),
      banner({ id: "c", priority: 70 }),
    ]);
    expect((await readActiveBannersByVerticalsFromR2(["labor"], 2)).map((ad) => ad.id)).toEqual(["a", "c"]);
  });

  it.each(["health", "population"] as const)("%sの分類だけで行動広告を出さない", async (vertical) => {
    setAds([banner({ id: "generic", vertical }), banner({ id: "targeted", vertical, targetRankingKeys: ["explicit-context"] })]);
    expect(await readActiveBannersByVerticalsFromR2([vertical], 10)).toEqual([]);
    expect(await readActiveBannersByVerticalsFromR2([vertical], 10, "elderly-population-ratio")).toEqual([]);
    expect((await readActiveBannersByVerticalsFromR2([vertical], 10, "explicit-context")).map((ad) => ad.id)).toEqual(["targeted"]);
  });

  it("単一text・area固定枠・実験もtargetRankingKeysを迂回しない", async () => {
    setAds([
      banner({ id: "text", adType: "text", locationCode: "sidebar-bottom", targetRankingKeys: ["it"] }),
      banner({ id: "area", locationCode: "area-sidebar", targetRankingKeys: ["it"] }),
      banner({ id: "variant", experimentId: "test", variantId: "a", targetRankingKeys: ["it"] }),
    ]);
    expect(await readActiveTextAdByVerticalFromR2("labor")).toBeNull();
    expect(await readActiveBannersByLocationFromR2("area-sidebar")).toEqual([]);
    expect(await readActiveExperimentVariantsByVerticalFromR2("labor")).toEqual([]);
    expect((await readActiveExperimentVariantsByVerticalFromR2("labor", "it")).map((ad) => ad.id)).toEqual(["variant"]);
  });

  it("paused/blockedと期間外は配信しない。未分類を承認済みへ書き換えない", async () => {
    const profile = { lane: "unknown", actionType: "unknown", frictionTier: "unknown", allowedPageTypes: [] } as const;
    setAds([
      banner({ id: "paused", offerProfile: { ...profile, allowedPageTypes: [], portfolioStatus: "paused" } }),
      banner({ id: "blocked", offerProfile: { ...profile, allowedPageTypes: [], portfolioStatus: "blocked" } }),
      banner({ id: "future", startDate: "2999-01-01" }),
      banner({ id: "expired", endDate: "2000-01-01" }),
      genericAd,
    ]);
    expect((await readActiveBannersByVerticalsFromR2(["labor"], 10)).map((ad) => ad.id)).toEqual([genericAd.id]);
  });
});
