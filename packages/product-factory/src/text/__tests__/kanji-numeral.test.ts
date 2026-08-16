/**
 * 漢数字パーサの対照テスト。
 *
 * 書籍の書き下ろし章は漢数字で数値を書くため、これが読めないと本文の数値検証ができない。
 * 実際 2026-08-12 まで検証手段が無く、計算バグ修正前の数値が終章に残っていた。
 * **誤読は誤検出を生み運用で無効化されるので、読めない形は素直に null を返す**ことも固定する。
 */
import { describe, expect, it } from "vitest";
import { extractKanjiClaims, parseKanjiNumeral } from "../kanji-numeral";

describe("parseKanjiNumeral — 位取り", () => {
  it("一桁", () => {
    expect(parseKanjiNumeral("三")).toBe(3);
    expect(parseKanjiNumeral("〇")).toBe(0);
  });

  it("十・百・千 (先頭の 1 を省く形も読む)", () => {
    expect(parseKanjiNumeral("十")).toBe(10);
    expect(parseKanjiNumeral("十五")).toBe(15);
    expect(parseKanjiNumeral("二十")).toBe(20);
    expect(parseKanjiNumeral("百")).toBe(100);
    expect(parseKanjiNumeral("五百二十一")).toBe(521);
    expect(parseKanjiNumeral("千")).toBe(1000);
    expect(parseKanjiNumeral("四千")).toBe(4000);
  });

  it("★実際に書籍へ書かれていた表現", () => {
    expect(parseKanjiNumeral("五百二十一万四千")).toBe(5_214_000);
    expect(parseKanjiNumeral("二百十六万七千")).toBe(2_167_000);
    expect(parseKanjiNumeral("五十四万五千")).toBe(545_000);
    expect(parseKanjiNumeral("二万一千")).toBe(21_000);
    expect(parseKanjiNumeral("十七万六千")).toBe(176_000);
    expect(parseKanjiNumeral("二十五万七千")).toBe(257_000);
  });

  it("億・兆", () => {
    expect(parseKanjiNumeral("三億")).toBe(300_000_000);
    expect(parseKanjiNumeral("一兆二千億")).toBe(1_200_000_000_000);
  });

  it("位の直前が空なら 1 とみなす (「万」= 1 万)", () => {
    expect(parseKanjiNumeral("万")).toBe(10_000);
  });

  it("★読めない形は null を返す (誤読で誤検出を作らない)", () => {
    expect(parseKanjiNumeral("")).toBeNull();
    expect(parseKanjiNumeral("東京")).toBeNull();
    expect(parseKanjiNumeral("五百と二十")).toBeNull(); // 想定外の文字が混在
    expect(parseKanjiNumeral("123")).toBeNull(); // 算用数字は別経路で扱う
  });
});

describe("extractKanjiClaims — 文中から数値 + 単位を拾う", () => {
  it("★終章の一文から実際の主張を取り出す", () => {
    const s = "東京都は五百二十一万四千円で全国一位、最下位の沖縄県は二百十六万七千円と、両者の間には二・四倍もの開きがあります。";
    const claims = extractKanjiClaims(s);
    const yen = claims.filter((c) => c.unit === "円");
    expect(yen.map((c) => c.value)).toEqual([5_214_000, 2_167_000]);
    expect(claims.some((c) => c.unit === "位" && c.value === 1)).toBe(true);
  });

  it("単位が付かない漢数字も拾う (呼び出し側が用途で絞る)", () => {
    const claims = extractKanjiClaims("三つの指標");
    expect(claims[0]?.value).toBe(3);
    expect(claims[0]?.unit).toBe("");
  });

  it("漢数字が無ければ空", () => {
    expect(extractKanjiClaims("データを比較します。")).toEqual([]);
  });

  it("位置 (index) を返す — 前後の文脈を見るため", () => {
    const s = "AB五百円";
    expect(extractKanjiClaims(s)[0]?.index).toBe(2);
  });
});

describe("parseKanjiNumeral — 桁を並べた表記", () => {
  it("★位取り文字を持たない 2 文字以上は桁の並び (位取りとして足すと 1451 が 1 になる)", () => {
    expect(parseKanjiNumeral("一四五一")).toBe(1451);
    expect(parseKanjiNumeral("二〇四〇")).toBe(2040);
  });

  it("★桁の並び + 大きい位 (書籍に実在した「約一四五一万人」)", () => {
    expect(parseKanjiNumeral("一四五一万")).toBe(14_510_000);
    expect(parseKanjiNumeral("一四四〇万")).toBe(14_400_000);
  });

  it("位取り表記は従来どおり (混同しない)", () => {
    expect(parseKanjiNumeral("千四百五十一")).toBe(1451);
    expect(parseKanjiNumeral("二十")).toBe(20);
  });

  it("一文字は両解釈が一致する", () => {
    expect(parseKanjiNumeral("五")).toBe(5);
  });
});

describe("extractKanjiClaims — 算用数字に続くスケール文字は漢数字ではない", () => {
  // ★2026-08-12: 「5兆8021億円」の「億」を漢数字主張として数えていた。
  //   算用数字に付く桁の表記なので、算用数字への統一という規約に反していない。
  //   実測で書籍の「漢数字残 33 件」は**全てこれ**で、章コンポーザでは
  //   使える解説 (regionalAnalysis / faq) を丸ごと捨てていた。
  const yenUnits = (t: string) =>
    extractKanjiClaims(t).filter((c) => ["円", "位", "倍", "％"].includes(c.unit));

  it("★算用数字 + 億/万/兆 は検出しない (正しく書かれた本文)", () => {
    expect(yenUnits("愛知県は5兆8021億円で最大です。")).toHaveLength(0);
    expect(yenUnits("約1.39億人泊にのぼりました。")).toHaveLength(0);
    expect(yenUnits("東京都は約4,743万人泊でした。")).toHaveLength(0);
    expect(yenUnits("１２３億円")).toHaveLength(0); // 全角数字も同じ
  });

  it("★本物の漢数字は従来どおり検出する (検出力を落としていない)", () => {
    expect(yenUnits("一位は愛知県でした。").length).toBeGreaterThan(0);
    expect(yenUnits("八十七円でした。").length).toBeGreaterThan(0);
    expect(yenUnits("三兆円規模です。").length).toBeGreaterThan(0);
  });
});
