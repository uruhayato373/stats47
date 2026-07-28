import { describe, expect, it } from "vitest";

import { detectPrefCodeFromText, getFurusatoNozeiLink } from "../furusato-nozei";

describe("detectPrefCodeFromText", () => {
  it("接尾辞つきの県名を検出する", () => {
    expect(detectPrefCodeFromText("愛知県の食文化")).toBe("23000");
    expect(detectPrefCodeFromText("北海道の農業")).toBe("01000");
  });

  it("接尾辞を省いた県名も検出する (記事タイトルは省略が多い)", () => {
    expect(detectPrefCodeFromText("愛知の食卓｜ウイスキー日本一")).toBe("23000");
    expect(detectPrefCodeFromText("秋田の食卓｜さんま・みそが日本一、酒も全国上位")).toBe("05000");
  });

  // ★ 部分一致の罠: 「東京都」は「京都」を含む。これを取り違えると
  //   東京の記事に京都府のふるさと納税が出る。
  it("東京都を京都府と誤判定しない", () => {
    expect(detectPrefCodeFromText("東京都の人口密度")).toBe("13000");
    expect(detectPrefCodeFromText("東京の生活コスト")).toBe("13000");
  });

  it("京都府は正しく京都と判定する", () => {
    expect(detectPrefCodeFromText("京都府の観光客数")).toBe("26000");
    expect(detectPrefCodeFromText("京都の宿泊者数ランキング")).toBe("26000");
  });

  it("紛らわしい県名を取り違えない", () => {
    expect(detectPrefCodeFromText("宮城の水産業")).toBe("04000");
    expect(detectPrefCodeFromText("宮崎の畜産")).toBe("45000");
    expect(detectPrefCodeFromText("福島の農業")).toBe("07000");
    expect(detectPrefCodeFromText("福岡の人口")).toBe("40000");
    expect(detectPrefCodeFromText("福井の幸福度")).toBe("18000");
    expect(detectPrefCodeFromText("山形のさくらんぼ")).toBe("06000");
    expect(detectPrefCodeFromText("山梨のぶどう")).toBe("19000");
    expect(detectPrefCodeFromText("山口の水揚げ")).toBe("35000");
    expect(detectPrefCodeFromText("長野の高原野菜")).toBe("20000");
    expect(detectPrefCodeFromText("長崎の漁業")).toBe("42000");
  });

  it("複数県が出るときは最初に現れた県を採る (記事の主題を優先)", () => {
    // 「1位は香川」のように主題の県が先に来る書き方を想定
    expect(detectPrefCodeFromText("うどん消費量ランキング｜1位は香川、最下位は沖縄")).toBe("37000");
  });

  it("県名が無ければ null", () => {
    expect(detectPrefCodeFromText("全国の消費者物価指数ランキング")).toBeNull();
    expect(detectPrefCodeFromText("")).toBeNull();
    expect(detectPrefCodeFromText(null)).toBeNull();
    expect(detectPrefCodeFromText(undefined)).toBeNull();
  });

  it("検出した prefCode がそのまま getFurusatoNozeiLink で解決できる", () => {
    const code = detectPrefCodeFromText("香川のうどん消費量");
    expect(code).toBe("37000");
    const link = getFurusatoNozeiLink(code!);
    expect(link?.prefName).toBe("香川県");
    expect(link?.rakutenAreaSlug).toBe("kagawa");
  });
});
