import { describe, expect, it } from "vitest";

import { formatReadableMagnitude, formatUnitForDisplay, normalizeUnitsInText } from "../unit-display";

// 2026-09-25 UI 全面点検: 全角の単位が「h a」「k g」と離れて見え、％と%・m2 と m² が混在していた
describe("formatUnitForDisplay", () => {
  it("全角の英字と記号を半角にする", () => {
    expect(formatUnitForDisplay("ｈａ")).toBe("ha");
    expect(formatUnitForDisplay("ｋｇ")).toBe("kg");
    expect(formatUnitForDisplay("％")).toBe("%");
  });

  it("面積・体積の指数を上付きにし、分母付きの単位も崩さない", () => {
    expect(formatUnitForDisplay("m2")).toBe("m²");
    expect(formatUnitForDisplay("１ km2")).toBe("1km²");
    expect(formatUnitForDisplay("円/100km²")).toBe("円/100km²");
    expect(formatUnitForDisplay("ｍ3")).toBe("m³");
  });

  it("化学式や数字の続く表記は上付きにしない", () => {
    expect(formatUnitForDisplay("千t-CO₂")).toBe("千t-CO2");
    expect(formatUnitForDisplay("m20")).toBe("m20");
  });

  it("日本語の単位と空はそのまま", () => {
    expect(formatUnitForDisplay("人（人口10万対）")).toBe("人(人口10万対)");
    expect(formatUnitForDisplay(null)).toBe("");
  });
});

describe("normalizeUnitsInText", () => {
  it("数字の直後の全角％だけを半角にし、ほかの全角文字は残す", () => {
    expect(normalizeUnitsInText("全体の約14.35％です（推計）")).toBe("全体の約14.35%です（推計）");
    expect(normalizeUnitsInText("100 ％になる")).toBe("100%になる");
    expect(normalizeUnitsInText("％の表記")).toBe("％の表記");
  });

  // CONTENT-FOLLOWUP-01: 本文の「単位は％です」が数字に続かないので残り、同じ記事の「96.6%」と混在していた
  it("単位を宣言する「単位は％」「単位：％」も、数字の後と同じ半角にする", () => {
    expect(normalizeUnitsInText("2024年の値で、単位は％です。")).toBe("2024年の値で、単位は%です。");
    expect(normalizeUnitsInText("単位は％ポイントです")).toBe("単位は%ポイントです");
    expect(normalizeUnitsInText("（単位：％）")).toBe("（単位：%）");
    // 単位の宣言でない全角の％は残す
    expect(normalizeUnitsInText("％表示の値")).toBe("％表示の値");
  });

  // 2026-11-14: AI 解説の「8,569ｈａ」が表の「8,569ha」と並び、FAQ の「46％」が表の「46%」と混在していた
  it("数字の直後の全角の英字の単位を半角にする", () => {
    expect(normalizeUnitsInText("最大値と最小値の差は8,569ｈａで、最大は")).toBe("最大値と最小値の差は8,569haで、最大は");
    expect(normalizeUnitsInText("1人あたり 12.5 ｋｇ を消費")).toBe("1人あたり 12.5 kg を消費");
  });

  // 2026-11-14: AI 解説が「1,091.78km2」「21,771千m3」と書き、同じページの表は「km²」「千m³」だった
  it("数字の直後の面積・体積の単位は指数を上付きにする (千・万の接頭辞をはさんでもよい)", () => {
    expect(normalizeUnitsInText("最も広いのは東京都で、1,091.78km2となっています")).toBe("最も広いのは東京都で、1,091.78km²となっています");
    expect(normalizeUnitsInText("東京都で21,771千m3です。徳島県は57千ｍ3")).toBe("東京都で21,771千m³です。徳島県は57千m³");
    expect(normalizeUnitsInText("家賃は3.3m2当たり")).toBe("家賃は3.3m²当たり");
  });

  it("数字の直後でない m2・型番のような英数字は変えない", () => {
    expect(normalizeUnitsInText("総面積km2当たり")).toBe("総面積km2当たり");
    expect(normalizeUnitsInText("国道12km20m地点")).toBe("国道12km20m地点");
  });

  it("数字に続かない全角の英字と、全角の括弧・句読点は変えない", () => {
    expect(normalizeUnitsInText("ＧＤＰは3年で（約）１割増")).toBe("ＧＤＰは3年で（約）１割増");
    expect(normalizeUnitsInText("")).toBe("");
  });
});

// 市区町村ページの title / 説明文で「坂出市の人口 4.9万人」と書くため (2026-10-21)
describe("formatReadableMagnitude", () => {
  it("単位の倍率を解いてから万・億・兆で桁を寄せる", () => {
    expect(formatReadableMagnitude(49_118, "人")).toBe("4.9万人");
    expect(formatReadableMagnitude(14_236_627, "人")).toBe("1,424万人");
    expect(formatReadableMagnitude(20_527_151, "百万円")).toBe("20.5兆円");
    expect(formatReadableMagnitude(5_548, "百万円")).toBe("55.5億円");
    expect(formatReadableMagnitude(432, "事業所")).toBe("432事業所");
  });

  it("割合・分母つき・解釈できない単位は桁を寄せない", () => {
    expect(formatReadableMagnitude(34.5, "％")).toBe("34.5%");
    expect(formatReadableMagnitude(120_000, "人（人口10万対）")).toBe("120,000人(人口10万対)");
    expect(formatReadableMagnitude(1.25, "倍")).toBe("1.25倍");
    expect(formatReadableMagnitude(25_000, "ha")).toBe("25,000ha");
  });
});
