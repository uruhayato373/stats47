import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  trackCsvDownload,
  trackAffiliateClick,
  trackHomeFeaturedImpression,
  trackHomeFeaturedClick,
  trackRankingView,
  trackYearChange,
  trackAreaTypeChange,
  trackSearch,
  trackShare,
  trackNotFound,
  trackCtaClick,
  trackNavClick,
  trackGeoAnalysisView,
  trackGeoMapInteraction,
  trackGeoRegionSelect,
  trackGeoCompareAdd,
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

  it("Geo分析の4イベントが共通識別子と決定的パラメータを送信する", () => {
    const common = {
      analysisId: "m1-analysis-population-2050",
      analysisSlug: "2050-population",
      geography: "prefecture" as const,
      dataVersion: "2050",
    };

    trackGeoAnalysisView(common);
    trackGeoMapInteraction({
      ...common,
      interactionType: "select-prefecture",
      areaCode: "13000",
    });
    trackGeoRegionSelect({ ...common, areaCode: "27000" });
    trackGeoCompareAdd({ ...common, areaCode: "01000", comparisonSize: 2 });
    trackGeoMapInteraction({
      ...common,
      interactionType: "stage-overlap",
      areaCode: "13000",
    });

    expect(mockGtag).toHaveBeenNthCalledWith(1, "event", "geo_analysis_view", {
      analysis_id: "m1-analysis-population-2050",
      analysis_slug: "2050-population",
      geography: "prefecture",
      data_version: "2050",
    });
    expect(mockGtag).toHaveBeenNthCalledWith(
      2,
      "event",
      "geo_map_interaction",
      expect.objectContaining({
        interaction_type: "select-prefecture",
        area_code: "13000",
      })
    );
    expect(mockGtag).toHaveBeenNthCalledWith(
      3,
      "event",
      "geo_region_select",
      expect.objectContaining({ area_code: "27000" })
    );
    expect(mockGtag).toHaveBeenNthCalledWith(
      4,
      "event",
      "geo_compare_add",
      expect.objectContaining({ area_code: "01000", comparison_size: 2 })
    );
    expect(mockGtag).toHaveBeenNthCalledWith(
      5,
      "event",
      "geo_map_interaction",
      expect.objectContaining({ interaction_type: "stage-overlap" })
    );
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

  it("trackNavClick が /areas の areas_search surface を送信する", () => {
    trackNavClick({
      label: "東京都",
      href: "/areas/13000",
      surface: "areas_search",
    });

    expect(mockGtag).toHaveBeenCalledWith("event", "nav_click", expect.objectContaining({
      event_category: "navigation",
      nav_label: "東京都",
      nav_href: "/areas/13000",
      nav_surface: "areas_search",
    }));
  });

  it("trackNavClick が areas_map / areas_list surface を受け付ける", () => {
    trackNavClick({ label: "大阪府", href: "/areas/27000", surface: "areas_map" });
    trackNavClick({ label: "京都府", href: "/areas/26000", surface: "areas_list" });

    expect(mockGtag).toHaveBeenNthCalledWith(1, "event", "nav_click", expect.objectContaining({
      nav_surface: "areas_map",
    }));
    expect(mockGtag).toHaveBeenNthCalledWith(2, "event", "nav_click", expect.objectContaining({
      nav_surface: "areas_list",
    }));
  });

  it("共通都道府県ナビの配置・導線別 surface を受け付ける", () => {
    trackNavClick({ label: "大阪府", href: "/areas/27000", surface: "home_area_map" });
    trackNavClick({ label: "京都府", href: "/areas/26000", surface: "category_area_list" });

    expect(mockGtag).toHaveBeenNthCalledWith(1, "event", "nav_click", expect.objectContaining({
      nav_surface: "home_area_map",
    }));
    expect(mockGtag).toHaveBeenNthCalledWith(2, "event", "nav_click", expect.objectContaining({
      nav_surface: "category_area_list",
    }));
  });

  // ─── ホーム注目ランキング ───

  it("trackHomeFeaturedImpression が全 parameter を送信する", () => {
    trackHomeFeaturedImpression({
      rankingKey: "annual-sunshine-duration",
      cardVariant: "geographic",
      slot: 1,
      experimentId: "home-featured-v1",
      experimentVariant: "editorial",
    });

    expect(mockGtag).toHaveBeenCalledWith("event", "home_featured_impression", {
      ranking_key: "annual-sunshine-duration",
      card_variant: "geographic",
      slot: 1,
      experiment_id: "home-featured-v1",
      experiment_variant: "editorial",
      link_position: "home_featured",
    });
  });

  it("trackHomeFeaturedClick が採用後の固定 experiment parameter を送信する", () => {
    trackHomeFeaturedClick({
      rankingKey: "total-population",
      cardVariant: "geographic",
      slot: 2,
      experimentId: "home-featured-v1",
      experimentVariant: "editorial",
    });

    expect(mockGtag).toHaveBeenCalledWith("event", "home_featured_click", {
      ranking_key: "total-population",
      card_variant: "geographic",
      slot: 2,
      experiment_id: "home-featured-v1",
      experiment_variant: "editorial",
      link_position: "home_featured",
    });
  });

  it("home featured イベントは gtag 未定義で noop", () => {
    vi.stubGlobal("window", { gtag: undefined });

    trackHomeFeaturedImpression({
      rankingKey: "k", cardVariant: "geographic", slot: 1,
      experimentId: "home-featured-v1", experimentVariant: "editorial",
    });
    trackHomeFeaturedClick({
      rankingKey: "k", cardVariant: "geographic", slot: 1,
      experimentId: "home-featured-v1", experimentVariant: "editorial",
    });
    expect(mockGtag).not.toHaveBeenCalled();
  });

  it("window.gtag が未定義の場合にイベントを送信しない", () => {
    vi.stubGlobal("window", { gtag: undefined });

    trackCsvDownload({ rankingKey: "test", yearCode: "2023" });
    expect(mockGtag).not.toHaveBeenCalled();
  });
});
