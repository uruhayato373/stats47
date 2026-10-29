import { describe, expect, it } from "vitest";

import { isAdFreePath } from "../constants";

/**
 * 非商用の利用条件の原典 (国土数値情報の時系列 N05/N06) を描く交通網の変遷ページでは
 * AdSense の script を読まない。接頭辞の一致を緩めると別のページまで広告が消えるので境界も固定する。
 */
describe("isAdFreePath", () => {
  it("交通網の変遷の一覧・路線網・範囲のページは広告なし", () => {
    expect(isAdFreePath("/geo/history")).toBe(true);
    expect(isAdFreePath("/geo/history/railway")).toBe(true);
    expect(isAdFreePath("/geo/history/expressway/kanto")).toBe(true);
    expect(isAdFreePath("/geo/history/expressway/28")).toBe(true);
  });

  it("同じ接頭辞で始まる別のページや他の地域分析には影響しない", () => {
    expect(isAdFreePath("/geo/historyx")).toBe(false);
    expect(isAdFreePath("/geo/population-station-access")).toBe(false);
    expect(isAdFreePath("/themes/roads")).toBe(false);
    expect(isAdFreePath(null)).toBe(false);
  });
});
