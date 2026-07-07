import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  trackCsvDownload,
  trackAffiliateClick,
  trackRankingView,
  trackYearChange,
  trackAreaTypeChange,
  trackSearch,
  trackShare,
  trackNotFound,
  trackCtaClick,
} from "../events";

describe("GA4 カスタムイベント", () => {
  const mockGtag = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("window", { gtag: mockGtag, location: { pathname: "/test" } });
    vi.stubGlobal("document", { referrer: "https://example.com" });
    mockGtag.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("trackCsvDownload がイベントを送信する", () => {
    trackCsvDownload({ rankingKey: "total-population", yearCode: "2023" });

    expect(mockGtag).toHaveBeenCalledWith("event", "file_download", expect.objectContaining({
      file_name: "total-population-2023.csv",
      file_extension: "csv",
    }));
  });

  it("trackAffiliateClick がイベントを送信する", () => {
    trackAffiliateClick({ category: "furusato", label: "test-ad", position: "sidebar" });

    expect(mockGtag).toHaveBeenCalledWith("event", "affiliate_click", expect.objectContaining({
      event_category: "affiliate",
    }));
  });

  it("trackRankingView がイベントを送信する", () => {
    trackRankingView({ rankingKey: "gdp", title: "GDP" });

    expect(mockGtag).toHaveBeenCalledWith("event", "ranking_view", expect.objectContaining({
      ranking_key: "gdp",
    }));
  });

  it("trackYearChange がイベントを送信する", () => {
    trackYearChange({ rankingKey: "gdp", fromYear: "2022", toYear: "2023" });

    expect(mockGtag).toHaveBeenCalledWith("event", "year_change", expect.objectContaining({
      from_year: "2022",
      to_year: "2023",
    }));
  });

  it("trackAreaTypeChange がイベントを送信する", () => {
    trackAreaTypeChange({ rankingKey: "gdp", areaType: "city" });

    expect(mockGtag).toHaveBeenCalledWith("event", "area_type_change", expect.objectContaining({
      area_type: "city",
    }));
  });

  it("trackSearch がイベントを送信する", () => {
    trackSearch({ searchTerm: "人口", resultsCount: 10 });

    expect(mockGtag).toHaveBeenCalledWith("event", "search", expect.objectContaining({
      search_term: "人口",
    }));
  });

  it("trackShare がイベントを送信する", () => {
    trackShare({ method: "twitter" });

    expect(mockGtag).toHaveBeenCalledWith("event", "share", expect.objectContaining({
      method: "twitter",
    }));
  });

  it("trackNotFound がイベントを送信する", () => {
    trackNotFound();

    expect(mockGtag).toHaveBeenCalledWith("event", "page_not_found", expect.objectContaining({
      page_path: "/test",
    }));
  });

  it("trackCtaClick がイベントを送信する (ranking_key 付き)", () => {
    trackCtaClick({
      ctaId: "ranking_to_komuin_ai_guide",
      label: "公務員AI 完全ガイド",
      position: "ranking-footer",
      rankingKey: "active-job-opening-ratio",
    });

    expect(mockGtag).toHaveBeenCalledWith("event", "cta_click", expect.objectContaining({
      event_category: "cta",
      cta_id: "ranking_to_komuin_ai_guide",
      link_position: "ranking-footer",
      ranking_key: "active-job-opening-ratio",
    }));
  });

  it("trackCtaClick は rankingKey 未指定なら ranking_key を含めない", () => {
    trackCtaClick({ ctaId: "generic_cta", label: "CTA", position: "footer" });

    const params = mockGtag.mock.calls[0][2] as Record<string, unknown>;
    expect(params).not.toHaveProperty("ranking_key");
  });

  it("window.gtag が未定義の場合にイベントを送信しない", () => {
    vi.stubGlobal("window", { gtag: undefined });

    trackCsvDownload({ rankingKey: "test", yearCode: "2023" });
    expect(mockGtag).not.toHaveBeenCalled();
  });
});
