import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({ banners: vi.fn(), text: vi.fn(), variants: vi.fn() }));
vi.mock("../../services", () => ({
  resolveAffiliateBannersByVertical: mocks.banners,
  resolveAffiliateTextAdsByVertical: mocks.text,
  resolveExperimentVariantsByCategoryKey: mocks.variants,
}));
vi.mock("@/lib/google-adsense", () => ({ ADSENSE_DISPLAY_ENABLED: false, RANKING_PAGE_FOOTER: {}, RANKING_PAGE_TABLE_SIDE: {} }));
vi.mock("../BannerAd", () => ({ BannerAd: () => null }));
vi.mock("../AdSenseAdWrapper", () => ({ AdSenseAdWrapper: () => null }));
vi.mock("../VariantAdSlot", () => ({ VariantAdSlot: () => null }));
vi.mock("../AffiliateTextAdList", () => ({ AffiliateTextAdList: () => null }));

import { CATEGORY_AFFILIATE_MAP, CATEGORY_PAGE_AFFILIATE_POLICY } from "../../constants/affiliate-category";
import { AffiliateAdSlot } from "../AffiliateAdSlot";
import { SidebarPromoBanner } from "../SidebarPromoBanner";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.banners.mockResolvedValue([]);
  mocks.text.mockResolvedValue([]);
  mocks.variants.mockResolvedValue([]);
});

describe("掲載文脈と本文・レールの重複防止", () => {
  it("nullの掲載停止を実験広告も上書きしない", async () => {
    expect(await AffiliateAdSlot({ categoryKey: "economy", vertical: null })).toBeNull();
    expect(mocks.variants).not.toHaveBeenCalled();
    expect(mocks.banners).not.toHaveBeenCalled();
    expect(mocks.text).not.toHaveBeenCalled();
  });

  it("実験にも解決済みverticalとrankingKeyを渡す", async () => {
    await AffiliateAdSlot({ categoryKey: "economy", vertical: "furusato", rankingKey: "coffee" });
    expect(mocks.variants).toHaveBeenCalledWith("economy", "coffee", "furusato");
  });

  it("本文で使用した案件の別URLも除外してから上限を適用する", async () => {
    mocks.banners.mockResolvedValue([
      { id: "same-program", href: "https://example.com/other", programRef: "a8:used" },
      { id: "same-href", href: "https://example.com/used" },
      { id: "next", href: "https://example.com/next" },
    ]);
    const result = await AffiliateAdSlot({ categoryKey: "economy", bannerOnly: true, bannerLimit: 1,
      excludeAds: [{ href: "https://example.com/used", programRef: "a8:used" }] });
    expect(result?.props.children.map((child: { key: string }) => child.key)).toEqual(["next"]);
  });

  it.each([{}, { rankingKey: "coffee-consumption-quantity", vertical: "furusato" }, { rankingKey: "nurse-annual-income", vertical: "labor", index: 0 }])("固定のIT転職広告を無関係なページへ出さない %j", (props) => {
    expect(SidebarPromoBanner(props)).toBeNull();
  });

  it("IT年収の固定広告は一致時だけ表示し、同じ案件が本文にあれば出さない", () => {
    const props = { rankingKey: "software-engineer-annual-income", vertical: "labor", index: 0 };
    expect(SidebarPromoBanner(props)).not.toBeNull();
    expect(SidebarPromoBanner({ ...props, excludeAds: [{ href: "another-url", programRef: "a8:s00000026573001" }] })).toBeNull();
  });

  it("一覧の17カテゴリはすべて明示方針を持ち、8未掲載軸を無条件で広告ありに変えない", () => {
    expect(Object.keys(CATEGORY_PAGE_AFFILIATE_POLICY).sort()).toEqual(Object.keys(CATEGORY_AFFILIATE_MAP).sort());
    expect(Object.keys(CATEGORY_PAGE_AFFILIATE_POLICY)).toHaveLength(17);
    for (const key of ["educationsports", "safetyenvironment", "commercial", "agriculture", "infrastructure", "ict", "miningindustry", "international", "population", "socialsecurity", "landweather"]) {
      expect(CATEGORY_PAGE_AFFILIATE_POLICY[key]).toBeNull();
    }
    expect(CATEGORY_PAGE_AFFILIATE_POLICY.tourism).toBe("travel");
  });
});
