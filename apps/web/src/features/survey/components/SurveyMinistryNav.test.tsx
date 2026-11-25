// @vitest-environment node
/**
 * 調査一覧の「府省庁から探す」で、今いる府省庁を選ぶ規則 (2026-11-26)。
 * 本文の府省庁の見出しを画面から消したので、どこを見ているかはこの強調だけが示す。
 */
import { describe, expect, it } from "vitest";

import { selectActiveSection } from "./SurveyMinistryNav";

describe("selectActiveSection", () => {
  it("どの節の頭もまだ基準の線に届いていなければ先頭の府省庁", () => {
    expect(selectActiveSection([300, 2000, 4000], 120)).toBe(0);
  });

  it("頭が基準の線より上に来た節のうち最後のものを選ぶ", () => {
    expect(selectActiveSection([-3000, -200, 110, 900], 120)).toBe(2);
  });

  it("ページの見つからない節 (無限大) は選ばない", () => {
    expect(selectActiveSection([-500, Number.POSITIVE_INFINITY], 120)).toBe(0);
  });
});
