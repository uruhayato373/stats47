import { describe, expect, it } from "vitest";

import { PREFECTURE_SET_LABEL, toPrefectureView } from "../types";

describe("toPrefectureView", () => {
  it("未選択 (null) は prefecture-set になる ('00000' を作らない)", () => {
    const view = toPrefectureView(null, null);
    expect(view).toEqual({ scope: "prefecture-set" });
  });

  it("選択中の都道府県は areaCode をそのまま保持する", () => {
    const view = toPrefectureView("13000", "東京都");
    expect(view).toEqual({ scope: "prefecture", prefectureCode: "13000", prefectureName: "東京都" });
  });

  it("areaName 省略時は '選択地域' にフォールバックする ('全国' にはしない)", () => {
    const view = toPrefectureView("01000", null);
    expect(view.scope).toBe("prefecture");
    if (view.scope === "prefecture") {
      expect(view.prefectureName).toBe("選択地域");
    }
  });

  it("prefecture-set の表示名は「47都道府県」であり「全国」ではない", () => {
    expect(PREFECTURE_SET_LABEL).toBe("47都道府県");
    expect(PREFECTURE_SET_LABEL).not.toContain("全国");
  });

  it("prefecture-set は e-Stat 全国コード '00000' を一切含まない", () => {
    const view = toPrefectureView(null, null);
    expect(JSON.stringify(view)).not.toContain("00000");
  });
});
