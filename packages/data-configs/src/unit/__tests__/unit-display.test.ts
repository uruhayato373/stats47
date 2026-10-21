import { describe, expect, it } from "vitest";

import { formatReadableMagnitude, formatUnitForDisplay, normalizePercentInText } from "../unit-display";

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

describe("normalizePercentInText", () => {
  it("数字の直後の全角％だけを半角にし、ほかの全角文字は残す", () => {
    expect(normalizePercentInText("全体の約14.35％です（推計）")).toBe("全体の約14.35%です（推計）");
    expect(normalizePercentInText("100 ％になる")).toBe("100%になる");
    expect(normalizePercentInText("％の表記")).toBe("％の表記");
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
