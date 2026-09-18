import { describe, expect, it } from "vitest";

import { resolveBlogRakutenPlacement } from "../blog-rakuten-placement";
import { deriveProductTermsFromTitles, isCanonicalProductTitle } from "../product-keyword-derivation";
import { detectProductKeyword } from "../product-keywords";

describe("品目語の導出 (metric title → 辞書)", () => {
  it("「飲料・調味料・材料」は「料」で終わっても商品として残し、料金の費目は落とす", () => {
    expect(
      deriveProductTermsFromTitles([
        "炭酸飲料消費支出額",
        "風味調味料消費支出額",
        "修繕材料消費支出額",
        "宿泊料消費支出額",
        "医療保険料消費支出額",
        "電気代消費支出額",
      ]),
    ).toEqual(["炭酸飲料", "風味調味料", "修繕材料"]);
  });

  it("1 文字の品目も辞書に入れる (採用可否は実行時の完全一致で決める)", () => {
    expect(deriveProductTermsFromTitles(["桃消費支出額", "米消費量", "うどん・そば消費支出額"]))
      .toEqual(["桃", "米", "うどん", "そば"]);
  });

  it("完全一致の判定は「{品目}{接尾辞}」だけを真にする", () => {
    expect(isCanonicalProductTitle("桃消費支出額", "桃")).toBe(true);
    expect(isCanonicalProductTitle("桃の消費支出額ランキング", "桃")).toBe(false);
    expect(isCanonicalProductTitle("山梨県の果物", "梨")).toBe(false);
  });
});

describe("品目の検出 (実行時)", () => {
  it.each(["桃消費支出額", "梨消費量", "米消費支出額", "傘消費量", "酢消費支出額"])(
    "ランキング名 %s (正準 title) では 1 文字品目を検出する",
    (rankingName) => {
      expect(detectProductKeyword(rankingName)?.term).toBe(rankingName[0]);
    },
  );

  it.each(["山梨県の果物事情", "米国と日本の物価比較", "梨の産地を巡る旅", "桃の消費支出額ランキング"])(
    "記事タイトル %s では 1 文字品目を部分一致で拾わない",
    (title) => {
      const hit = detectProductKeyword(title);
      expect(hit === null || hit.term.length >= 2).toBe(true);
      expect(["桃", "梨", "米"]).not.toContain(hit?.term);
    },
  );

  it("「料」で終わる商品はランキング名でも記事タイトルでも検出する", () => {
    expect(detectProductKeyword("炭酸飲料消費支出額")?.term).toBe("炭酸飲料");
    expect(detectProductKeyword("夏に炭酸飲料をよく買う県はどこか")?.term).toBe("炭酸飲料");
  });

  it("ブログ側の解決は副題込みのテキストなので 1 文字品目で商品カードを作らない", () => {
    expect(resolveBlogRakutenPlacement({ title: "山梨県の暮らし", subtitle: "梨の消費量を比較", vertical: "economy" }))
      .toBeNull();
  });
});
