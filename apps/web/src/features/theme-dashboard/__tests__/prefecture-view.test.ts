import { describe, expect, it } from "vitest";

import { NATIONAL_REGION_LABEL, toPrefectureView } from "../types";

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

  it("県を選んでいないときの地域名は「全国」(テーマは 1 つの地域を見せる。2026-10-31)", () => {
    expect(NATIONAL_REGION_LABEL).toBe("全国");
  });

  it("prefecture-set は e-Stat 全国コード '00000' を一切含まない", () => {
    const view = toPrefectureView(null, null);
    expect(JSON.stringify(view)).not.toContain("00000");
  });
});
