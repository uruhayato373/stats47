import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the repository before importing the service
vi.mock("../repositories/affiliate-ad-repository");

import { findActiveAdByCategory, findActiveBannersByCategoryKeys } from "../repositories/affiliate-ad-repository";
import { resolveAffiliateAd, resolveAffiliateBanners } from "../services/resolve-affiliate-ad";

const mockFindActiveAd = vi.mocked(findActiveAdByCategory);
const mockFindBanners = vi.mocked(findActiveBannersByCategoryKeys);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveAffiliateAd", () => {
  it("DB に広告がない場合 null を返す", async () => {
    mockFindActiveAd.mockResolvedValue(null);
    const result = await resolveAffiliateAd("laborwage");
    expect(result).toBeNull();
  });

  it("DB に広告がある場合、title と href を返す", async () => {
    mockFindActiveAd.mockResolvedValue({
      id: "test-ad",
      title: "テスト広告",
      htmlContent: "https://example.com/ad",
      areaCode: null,
      categoryKey: "laborwage",
      locationCode: "sidebar-bottom",
      isActive: true,
      priority: 10,
      startDate: null,
      endDate: null,
      targetCategories: null,
      adType: "text",
      imageUrl: null,
      trackingPixelUrl: null,
      width: null,
      height: null,
      adFileKey: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    });

    const result = await resolveAffiliateAd("laborwage");
    expect(result).toEqual({
      title: "テスト広告",
      href: "https://example.com/ad",
    });
  });
});

describe("resolveAffiliateBanners", () => {
  it("マッチするタグがない場合、空配列を返す", async () => {
    const result = await resolveAffiliateBanners(["unknown-tag"]);
    expect(result).toEqual([]);
    expect(mockFindBanners).not.toHaveBeenCalled();
  });

  it("マッチするタグから categoryKey を収集し一括クエリする", async () => {
    mockFindBanners.mockResolvedValue([
      {
        id: "banner-1",
        title: "バナー1",
        htmlContent: "https://example.com/banner",
        areaCode: null,
        categoryKey: "laborwage",
        locationCode: "article-banner",
        isActive: true,
        priority: 10,
        startDate: null,
        endDate: null,
        targetCategories: null,
        adType: "banner",
        imageUrl: "https://example.com/img.png",
        trackingPixelUrl: "https://example.com/pixel",
        width: 300,
        height: 250,
        adFileKey: null,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]);

    const result = await resolveAffiliateBanners(["wages", "employment"]);

    // wages と employment は両方 "labor" → categoryKey "laborwage"
    // 重複排除されるので categoryKey は ["laborwage"] の1つだけ
    expect(mockFindBanners).toHaveBeenCalledTimes(1);
    expect(mockFindBanners).toHaveBeenCalledWith(["laborwage"], 2);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      title: "バナー1",
      href: "https://example.com/banner",
      imageUrl: "https://example.com/img.png",
      trackingPixelUrl: "https://example.com/pixel",
      width: 300,
      height: 250,
    });
  });

  it("imageUrl または trackingPixelUrl がない広告は除外する", async () => {
    mockFindBanners.mockResolvedValue([
      {
        id: "banner-no-image",
        title: "画像なし",
        htmlContent: "https://example.com",
        areaCode: null,
        categoryKey: "economy",
        locationCode: "article-banner",
        isActive: true,
        priority: 10,
        startDate: null,
        endDate: null,
        targetCategories: null,
        adType: "banner",
        imageUrl: null,
        trackingPixelUrl: null,
        width: null,
        height: null,
        adFileKey: null,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]);

    const result = await resolveAffiliateBanners(["economy"]);
    expect(result).toEqual([]);
  });

  it("width/height が null の場合はデフォルト値 300x250 を使う", async () => {
    mockFindBanners.mockResolvedValue([
      {
        id: "banner-no-size",
        title: "サイズなし",
        htmlContent: "https://example.com",
        areaCode: null,
        categoryKey: "economy",
        locationCode: "article-banner",
        isActive: true,
        priority: 10,
        startDate: null,
        endDate: null,
        targetCategories: null,
        adType: "banner",
        imageUrl: "https://example.com/img.png",
        trackingPixelUrl: "https://example.com/pixel",
        width: null,
        height: null,
        adFileKey: null,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]);

    const result = await resolveAffiliateBanners(["economy"]);
    expect(result[0].width).toBe(300);
    expect(result[0].height).toBe(250);
  });
});
