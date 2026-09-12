import { describe, expect, it } from "vitest";

import { resolveBlogRakutenPlacement } from "../blog-rakuten-placement";
import { detectSinglePrefCodeFromText } from "../furusato-nozei";

describe("ブログの楽天導線", () => {
  it("県別食文化記事は品目カードと重ねず、その県の返礼品を選ぶ", () => {
    expect(resolveBlogRakutenPlacement({ title: "秋田の食卓", subtitle: "さんま・みそが日本一", vertical: "furusato" }))
      .toEqual({ kind: "furusato", areaCode: "05000" });
  });

  it("短い主題タイトルに品目がなくても公開副題から商品を解決する", () => {
    expect(resolveBlogRakutenPlacement({ title: "東西で違う食習慣", subtitle: "納豆の消費量を比較", vertical: "furusato" }))
      .toEqual({ kind: "items", sourceText: "東西で違う食習慣\n納豆の消費量を比較" });
  });

  it("比較記事は一方の県の返礼品に寄せず共通の品目を選ぶ", () => {
    expect(resolveBlogRakutenPlacement({ title: "秋田と北海道の食卓", subtitle: "納豆の消費を比較", vertical: "furusato" }))
      .toMatchObject({ kind: "items" });
  });

  it.each([null, "health", "labor", "mobility"] as const)("文脈 %s では品目が一致しても広告を出さない", (vertical) => {
    expect(resolveBlogRakutenPlacement({ title: "コーヒーと健康統計", vertical })).toBeNull();
  });

  it("旅行統計に偶然現れた品目だけでは通販商品を出さない", () => {
    expect(resolveBlogRakutenPlacement({ title: "コーヒー店と観光客数", vertical: "travel" })).toBeNull();
  });

  it.each(["身長が高い県は魚介の漬物も多い?", "コーヒーと平均寿命の関係", "交通事故とパン購入額の相関"])("複数調査の相関記事でも健康・事故の主題には出さない: %s", (title) => {
    expect(resolveBlogRakutenPlacement({ title, vertical: "furusato" })).toBeNull();
  });

  it("品目も返礼品の文脈もなければ空枠を作らない", () => {
    expect(resolveBlogRakutenPlacement({ title: "東京都の財政比較", vertical: "furusato" })).toBeNull();
  });
});

describe("単一県の判定", () => {
  it.each([
    ["東京都の食文化", "13000"], ["京都府の食卓", "26000"],
    ["秋田の食卓、秋田県の特産品", "05000"], ["東京と京都の食文化", null],
    ["全国のふるさと納税", null],
  ])("%s", (text, expected) => expect(detectSinglePrefCodeFromText(text)).toBe(expected));
});
