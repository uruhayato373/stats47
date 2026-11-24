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

  // 2026-11-24 (METRIC-SUBTITLE-KAKEI-NOTE-01 の残り 25 指標): 書き出しが「…の年間」でない形も調査方法を書いていた。
  // 旧実装はこの 2 文を「定型文に数えない」と固定していたので、lint をすり抜けていた。
  it("家計調査の取得レシピの指標は、1世帯当たりの額・割合・現在高の書き出しも定型文と判定する", () => {
    const kakei = { sourceKind: "kakei-chousa" };
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の1世帯当たり年間消費支出総額", kakei)).toBe(true);
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の消費支出に占める教育の割合（用途分類の年平均1か月）", kakei)).toBe(true);
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の1世帯当たりの負債現在高", kakei)).toBe(true);
    expect(isSurveyMethodSubtitle("家計調査（二人以上世帯）の調査世帯に占める持家世帯の割合", kakei)).toBe(true);
    expect(isSurveyMethodSubtitle("家賃・設備修繕など住居への支出総額", kakei)).toBe(false);
  });

  it("家計調査から計算する external の指標 (エンゲル係数) は、広い書き出しでは止めない (図の表記の読み手が subtitle を見る)", () => {
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の消費支出に占める食料費の割合", { sourceKind: "external" })).toBe(false);
    expect(isSurveyMethodSubtitle("都道府県庁所在市の二人以上世帯の年間納豆消費支出額", { sourceKind: "external" })).toBe(true);
  });
});
