import { describe, expect, it } from "vitest";

import { formatUnitForDisplay } from "../unit-display";

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
