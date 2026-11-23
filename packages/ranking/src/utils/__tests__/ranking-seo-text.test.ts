import { describe, expect, it } from "vitest";

import { buildRankingSeoText, type SeoValueRow } from "../ranking-seo-text";

/**
 * 守る意図: ランキングの題と説明文が、指標の定義に手で書いた古い年ではなく最新年の観測値を語ること
 * (2026-11-23 に医療施設の 6 指標で、2024 年を取り込んだ後も題が「【2023年】」のまま残った)。
 */
const item = { title: "一般病院数", unit: "施設", valueDisplay: undefined } as const;

const row = (areaCode: string, areaName: string, value: number | null, rank: number | null): SeoValueRow => ({
  areaCode,
  areaName,
  value,
  rank,
});

describe("buildRankingSeoText", () => {
  it("最新年と、順位 1 位・最下位の値で題と説明文を作る", () => {
    const text = buildRankingSeoText(item, "2024年", [
      row("01000", "北海道", 480, 2),
      row("13000", "東京都", 590, 1),
      row("32000", "島根県", 38, 3),
    ]);
    expect(text).toEqual({
      seoTitle: "一般病院数ランキング都道府県【2024年】｜1位東京都（590施設）",
      seoDescription:
        "2024年の一般病院数の都道府県別ランキング。1位東京都（590施設）、最下位島根県（38施設）で15.5倍の格差。地図やグラフで3都道府県を比較。",
    });
  });

  it("少ないほど上位の指標でも、1 位と最下位は値の大小ではなく順位で決める", () => {
    const text = buildRankingSeoText({ title: "完全失業率", unit: "%", valueDisplay: undefined }, "2023年", [
      row("01000", "北海道", 3.1, 46),
      row("18000", "福井県", 1.4, 1),
      row("47000", "沖縄県", 3.8, 47),
    ]);
    expect(text?.seoTitle).toBe("完全失業率ランキング都道府県【2023年】｜1位福井県（1.4%）");
    expect(text?.seoDescription).toContain("最下位沖縄県（3.8%）で2.7倍の格差");
  });

  it("0 や負の値を含むとき、開きが小さいときは倍率を書かない", () => {
    const signed = buildRankingSeoText({ title: "人口増減率", unit: "%", valueDisplay: undefined }, "2023年", [
      row("13000", "東京都", 0.3, 1),
      row("05000", "秋田県", -1.7, 2),
    ]);
    expect(signed?.seoDescription).toContain("最下位秋田県（-1.7%）。地図やグラフで");
    expect(signed?.seoDescription).not.toContain("倍");

    const flat = buildRankingSeoText({ title: "平均身長", unit: "cm", valueDisplay: undefined }, "2023年", [
      row("05000", "秋田県", 163.6, 1),
      row("39000", "高知県", 159.7, 2),
    ]);
    expect(flat?.seoDescription).not.toContain("倍");
  });

  it("県庁所在市の値の指標は、県名を市の名前にして「都道府県」と書かない", () => {
    const text = buildRankingSeoText({ title: "うどん・そば外食費", unit: "円", valueDisplay: undefined }, "2024年", [
      row("37000", "香川県", 9000, 1),
      row("47000", "沖縄県", 2000, 2),
    ], { capitalCities: true });
    expect(text?.seoTitle).toBe("うどん・そば外食費ランキング県庁所在市【2024年】｜1位高松市（9,000円）");
    expect(text?.seoDescription).toContain("県庁所在市別ランキング");
    expect(text?.seoDescription).toContain("2市を比較");
  });

  it("指標の定義の断りの文 (seoNote) は説明文の後ろに付け、題には付けない", () => {
    const text = buildRankingSeoText({ title: "登録・相当動物園数", unit: "館", valueDisplay: undefined }, "2015年", [
      row("14000", "神奈川県", 4, 1),
      row("31000", "鳥取県", 1, 2),
    ], { note: "博物館類似施設は含みません。" });
    expect(text?.seoDescription.endsWith("地図やグラフで2都道府県を比較。博物館類似施設は含みません。")).toBe(true);
    expect(text?.seoTitle).not.toContain("博物館類似施設");
  });

  it("順位の付いた値が 2 つ未満なら作らない (指標の名前だけの題に戻す)", () => {
    expect(buildRankingSeoText(item, "2024年", [row("13000", "東京都", 590, 1), row("01000", "北海道", null, null)])).toBeNull();
    expect(buildRankingSeoText(item, "2024年", [])).toBeNull();
  });
});
