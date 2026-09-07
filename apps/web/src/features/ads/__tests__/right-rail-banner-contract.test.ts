import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");

const source = (relativePath: string) =>
  readFileSync(resolve(PROJECT_ROOT, relativePath), "utf8");

function runPlacementGuard(blogPage: string) {
  const require = createRequire(import.meta.url);
  const messages: string[] = [];
  const exit = {};
  let status = 0;
  try {
    runInNewContext(source(".claude/scripts/lib/check-ad-placement.cjs"), {
      require: (id: string) => id === "fs" ? {
        ...require("node:fs"),
        readFileSync: (path: string, encoding: BufferEncoding) =>
          path === resolve(PROJECT_ROOT, "apps/web/src/app/blog/[slug]/page.tsx")
            ? blogPage : readFileSync(path, encoding),
      } : require(id),
      process: { env: { CLAUDE_PROJECT_DIR: PROJECT_ROOT }, exit: (code: number) => { status = code; throw exit; } },
      console: { log: (message: string) => messages.push(message), error: (message: string) => messages.push(message) },
    });
  } catch (error) {
    if (error !== exit) throw error;
  }
  return { status, messages: messages.join("\n") };
}

describe("right rail banner contract", () => {
  it("placement guard accepts contextual image banners and detects their removal", () => {
    const blogPage = source("apps/web/src/app/blog/[slug]/page.tsx");
    expect(runPlacementGuard(blogPage).status).toBe(0);
    const missing = runPlacementGuard(blogPage.replace(/<BannerAd\b/g, "<UnregisteredImage"));
    expect(missing.status).toBe(1);
    expect(missing.messages).toContain("blog 右レールに画像バナーがない");
  });

  it("shared right rails render registered image banners instead of text promo cards", () => {
    const rightRail = source(
      "apps/web/src/components/rail/RightRailWidgets.tsx",
    );

    expect(rightRail).toContain("<SidebarPromoBanner");
    expect(rightRail).not.toContain("TechSchoolPromoCard");
    expect(rightRail).not.toContain("FurusatoNozeiCard");
  });

  it("ranking right rails reject text affiliate fallbacks", () => {
    const rankingRail = source(
      "apps/web/src/features/ranking/components/RankingKeyPage/RankingPageSidebarSection.tsx",
    );

    expect(rankingRail).toContain("<SidebarPromoBanner");
    expect(rankingRail).toContain("bannerOnly");
    expect(rankingRail).toContain(
      "!ADSENSE_DISPLAY_ENABLED && contextualAffiliateBanners",
    );
    expect(
      rankingRail.indexOf("!ADSENSE_DISPLAY_ENABLED && contextualAffiliateBanners"),
    ).toBeLessThan(rankingRail.indexOf("<SidebarPromoBanner"));
    expect(rankingRail).not.toContain("FurusatoNozeiCard");
  });

  it("image affiliate placements do not add PR copy or card chrome", () => {
    const fixedBanner = source("apps/web/src/features/ads/components/SidebarPromoBanner.tsx");
    const affiliateSlot = source("apps/web/src/features/ads/components/AffiliateAdSlot.tsx");
    const bannerBranchStart = affiliateSlot.indexOf("banners.map");
    const bannerBranchEnd = affiliateSlot.indexOf("// 2. テキスト広告");
    const bannerBranch = affiliateSlot.slice(bannerBranchStart, bannerBranchEnd);

    expect(fixedBanner).toContain("<BannerAd");
    expect(fixedBanner).not.toContain("<SurfaceCard");
    expect(fixedBanner).not.toContain(">PR<");
    expect(bannerBranchStart).toBeGreaterThan(-1);
    expect(bannerBranchEnd).toBeGreaterThan(bannerBranchStart);
    expect(bannerBranch).toContain("<BannerAd");
    expect(bannerBranch).not.toContain("<SurfaceCard");
  });

  it("blog right rails contain image promo banners but no text affiliate cards", () => {
    const blogPage = source("apps/web/src/app/blog/[slug]/page.tsx");
    const railStart = blogPage.indexOf("const rail = (");
    const railEnd = blogPage.indexOf("// レール末尾", railStart);
    const railSource = blogPage.slice(railStart, railEnd);

    expect(railStart).toBeGreaterThan(-1);
    expect(railEnd).toBeGreaterThan(railStart);
    expect(railSource).toContain("sidebarBanners.map");
    expect(railSource).toContain("<BannerAd");
    expect(railSource).not.toContain("BlogSidebarTextAds");
    expect(railSource).not.toContain("FurusatoNozeiCard");
  });
});
