import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");

const source = (relativePath: string) =>
  readFileSync(resolve(PROJECT_ROOT, relativePath), "utf8");

describe("right rail banner contract", () => {
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
    expect(rankingRail).not.toContain("FurusatoNozeiCard");
  });

  it("blog right rails contain image promo banners but no text affiliate cards", () => {
    const blogPage = source("apps/web/src/app/blog/[slug]/page.tsx");
    const railStart = blogPage.indexOf("const rail = (");
    const railEnd = blogPage.indexOf("// レール末尾", railStart);
    const railSource = blogPage.slice(railStart, railEnd);

    expect(railStart).toBeGreaterThan(-1);
    expect(railEnd).toBeGreaterThan(railStart);
    expect(railSource).toContain("<SidebarPromoBanner");
    expect(railSource).not.toContain("BlogSidebarTextAds");
    expect(railSource).not.toContain("FurusatoNozeiCard");
  });
});
