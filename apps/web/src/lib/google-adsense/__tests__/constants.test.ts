import { describe, it, expect } from "vitest";

import * as constants from "../constants";
import { AD_SIZES } from "../types";

import type { AdSlotConfig } from "../constants";

/**
 * スロット定数はモジュールから機械的に列挙する。
 * 旧実装は 6 個を手書きで並べており、定数を足しても検査対象に入らず、
 * 逆に定数を消すとテストが型エラーで落ちるだけで意図が読めなかった。
 */
const allSlots = Object.entries(constants).filter(
  (entry): entry is [string, AdSlotConfig] =>
    typeof entry[1] === "object" &&
    entry[1] !== null &&
    "slotId" in entry[1] &&
    "format" in entry[1],
);

describe("AdSense スロット定数", () => {
  it("スロット定数が 1 つ以上 export されている", () => {
    // 列挙が空振りしていたら、以下の it.each は 0 件で無言 pass してしまう
    expect(allSlots.length).toBeGreaterThan(0);
  });

  it.each(allSlots)("%s が slotId と format を持つ", (_name, config) => {
    expect(typeof config.slotId).toBe("string");
    expect(config.slotId.length).toBeGreaterThan(0);
    expect(config.format).toBeDefined();
  });

  it("全スロットの format が有効な値", () => {
    // 型ソース (AD_SIZES) を単一ソースとして参照し、format リストのドリフトを防ぐ
    const validFormats = Object.keys(AD_SIZES);
    for (const [, config] of allSlots) {
      expect(validFormats).toContain(config.format);
    }
  });
});
