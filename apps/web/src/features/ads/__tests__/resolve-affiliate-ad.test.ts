import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock the snapshot reader before importing the service
vi.mock("../repositories/affiliate-ad-snapshot");

import {
  readActiveTextAdByVerticalFromR2,
  readActiveBannersByVerticalsFromR2,
  readActiveTextAdsByVerticalsFromR2,
} from "../repositories/affiliate-ad-snapshot";
import {
  resolveAffiliateAd,
  resolveAffiliateBanners,
  resolveAffiliateTextAdsByTagKeys,
} from "../services/resolve-affiliate-ad";

const mockFindActiveAd = vi.mocked(readActiveTextAdByVerticalFromR2);
const mockFindBanners = vi.mocked(readActiveBannersByVerticalsFromR2);
const mockFindTextAds = vi.mocked(readActiveTextAdsByVerticalsFromR2);

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
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    });

    const result = await resolveAffiliateAd("laborwage");
    expect(result).toEqual({
      id: "test-ad",
      title: "テスト広告",
      href: "https://example.com/ad",
      trackingPixelUrl: null,
    });
  });
});

describe("resolveAffiliateBanners", () => {
  it("マッチするタグがない場合、空配列を返す", async () => {
    const result = await resolveAffiliateBanners(["unknown-tag"]);
    expect(result).toEqual([]);
    expect(mockFindBanners).not.toHaveBeenCalled();
  });

  it("マッチするタグから vertical を収集し一括クエリする", async () => {
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
          createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]);

    const result = await resolveAffiliateBanners(["wages", "employment"]);

    // wages と employment は両方 vertical "labor" → 重複排除で ["labor"] の1つだけ
    // rankingKey 未指定なので第3引数は undefined (非 ranking 文脈)
    expect(mockFindBanners).toHaveBeenCalledTimes(1);
    expect(mockFindBanners).toHaveBeenCalledWith(["labor"], 2, undefined);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "banner-1",
      title: "バナー1",
      href: "https://example.com/banner",
      imageUrl: "https://example.com/img.png",
      trackingPixelUrl: "https://example.com/pixel",
      width: 300,
      height: 250,
      // 描画側が GA4 の affiliate_vertical に送るための意図軸。この広告は vertical 未設定
      // なので categoryKey "laborwage" から CATEGORY_AFFILIATE_MAP 経由で labor に解決される。
      vertical: "labor",
    });
  });

  it("imageUrl がない広告は除外する", async () => {
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
          createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]);

    const result = await resolveAffiliateBanners(["economy"]);
    expect(result).toEqual([]);
  });

  it("trackingPixelUrl が無くても imageUrl があれば含める (ValueCommerce 等・別ピクセル無し)", async () => {
    mockFindBanners.mockResolvedValue([
      {
        id: "banner-vc",
        title: "一休.com",
        htmlContent: "https://ck.jp.ap.valuecommerce.com/servlet/referral?sid=1&pid=2",
        areaCode: null,
        categoryKey: null,
        vertical: "travel",
        locationCode: "blog-bottom",
        isActive: true,
        priority: 90,
        startDate: null,
        endDate: null,
        targetCategories: null,
        adType: "banner",
        imageUrl: "https://ad.jp.ap.valuecommerce.com/servlet/gifbanner?sid=1&pid=2",
        trackingPixelUrl: null,
        width: 300,
        height: 250,
        createdAt: "2026-07-06",
        updatedAt: "2026-07-06",
      },
    ]);

    const result = await resolveAffiliateBanners(["travel"]);
    expect(result).toHaveLength(1);
    expect(result[0].imageUrl).toContain("gifbanner");
    expect(result[0].trackingPixelUrl).toBeNull();
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
          createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]);

    const result = await resolveAffiliateBanners(["economy"]);
    expect(result[0].width).toBe(300);
    expect(result[0].height).toBe(250);
  });
});

describe("resolveAffiliateTextAdsByTagKeys", () => {
  it("tagをverticalへ解決できない場合はeconomyへ推測フォールバックしない", async () => {
    const result = await resolveAffiliateTextAdsByTagKeys(["unknown-tag"]);
    expect(result).toEqual([]);
    expect(mockFindTextAds).not.toHaveBeenCalled();
  });

  it("一致verticalに在庫がなくてもeconomyへ再クエリしない", async () => {
    mockFindTextAds.mockResolvedValue([]);

    const result = await resolveAffiliateTextAdsByTagKeys(["wages"]);

    expect(result).toEqual([]);
    expect(mockFindTextAds).toHaveBeenCalledTimes(1);
    expect(mockFindTextAds).toHaveBeenCalledWith(
      ["labor"],
      "sidebar-bottom",
    );
  });
});
