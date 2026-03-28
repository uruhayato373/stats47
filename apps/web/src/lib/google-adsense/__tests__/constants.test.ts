import { describe, it, expect } from "vitest";

import {
  RANKING_PAGE_TABLE_SIDE,
  RANKING_SIDEBAR_TOP,
  RANKING_PAGE_SIDEBAR,
  MAIN_SIDEBAR,
  RANKING_PAGE_FOOTER,
  COMPARE_PAGE_SIDEBAR,
} from "../constants";

describe("AdSense スロット定数", () => {
  const allSlots = [
    { name: "RANKING_PAGE_TABLE_SIDE", config: RANKING_PAGE_TABLE_SIDE },
    { name: "RANKING_SIDEBAR_TOP", config: RANKING_SIDEBAR_TOP },
    { name: "RANKING_PAGE_SIDEBAR", config: RANKING_PAGE_SIDEBAR },
    { name: "MAIN_SIDEBAR", config: MAIN_SIDEBAR },
    { name: "RANKING_PAGE_FOOTER", config: RANKING_PAGE_FOOTER },
    { name: "COMPARE_PAGE_SIDEBAR", config: COMPARE_PAGE_SIDEBAR },
  ];

  it.each(allSlots)("$name が slotId と format を持つ", ({ config }) => {
    expect(config.slotId).toBeDefined();
    expect(typeof config.slotId).toBe("string");
    expect(config.slotId.length).toBeGreaterThan(0);
    expect(config.format).toBeDefined();
  });

  it("全スロットの format が有効な値", () => {
    const validFormats = ["rectangle", "skyscraper", "leaderboard", "horizontal", "auto"];
    for (const { config } of allSlots) {
      expect(validFormats).toContain(config.format);
    }
  });
});
