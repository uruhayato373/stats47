import { describe, expect, it } from "vitest";

import { isSurveyMethodSubtitle } from "../survey-method-subtitle";

/**
 * subtitle は同名の指標を区別する短い定義補足で、調査方法 (対象の都市・世帯・期間) は note が持つ。
 * 家計調査の品目は「調査方法の書き出し + title」の定型文を subtitle に入れていて、
 * 一覧の「title（subtitle）」が「納豆消費支出額（都道府県庁所在市の二人以上世帯の年間納豆消費支出額）」になっていた。
 * 既存の subtitle-redundant は「subtitle が title を包含する」形を定義補足として通すので、この形を別に止める。
 */
describe("isSurveyMethodSubtitle", () => {
  it("調査方法の書き出しに title を続けただけの subtitle を定型文と判定する", () => {
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の年間納豆消費支出額")).toBe(true);
  });

  it("後ろに括弧書きの区別子を足しても、調査方法の書き出しが残るので定型文と判定する", () => {
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の年間ぎょうざ消費支出額（冷凍品を除く）")).toBe(true);
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の年間支出額（固定電話通信料・移動電話通信料の合計）")).toBe(true);
  });

  it("区別子だけの subtitle・subtitle なしは定型文ではない", () => {
    expect(isSurveyMethodSubtitle("冷凍品を除く")).toBe(false);
    expect(isSurveyMethodSubtitle("食パンと他のパンの合計")).toBe(false);
    expect(isSurveyMethodSubtitle(undefined)).toBe(false);
    expect(isSurveyMethodSubtitle(null)).toBe(false);
  });

  it("title を包含するだけの定義補足 (乳用牛(めす)の飼養頭数合計) は定型文ではない", () => {
    expect(isSurveyMethodSubtitle("乳用牛(めす)の飼養頭数合計")).toBe(false);
  });

  it("世帯あたりの額や割合の定義を書いた subtitle は、書き出しが違うので定型文に数えない", () => {
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の1世帯当たり年間消費支出総額")).toBe(false);
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の消費支出に占める教育の割合（用途分類の年平均1か月）")).toBe(false);
  });
});
