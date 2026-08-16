import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");
const AREA_PAGE = readFileSync(
  resolve(PROJECT_ROOT, "apps/web/src/app/areas/[areaCode]/page.tsx"),
  "utf8",
);

describe("AdSense pause affiliate routing contract", () => {
  it("routes one contextual furusato banner into the vacated area content slot", () => {
    expect(AREA_PAGE).toContain(
      'resolveAffiliateBannersByVertical("furusato", 8)',
    );
    expect(AREA_PAGE).toContain(
      "areaContentBanners.find(isLandscapeBanner)",
    );
    expect(AREA_PAGE).toContain(
      "!ADSENSE_DISPLAY_ENABLED && areaContentBanner",
    );
    expect(AREA_PAGE).toContain('position="area-content"');
  });

  it("preserves the AdSense branch for a one-switch rollback", () => {
    expect(AREA_PAGE).toContain("ADSENSE_DISPLAY_ENABLED && (");
    expect(AREA_PAGE).toContain("<InContentAdSlot slot={HUB_INCONTENT} />");
  });
});
