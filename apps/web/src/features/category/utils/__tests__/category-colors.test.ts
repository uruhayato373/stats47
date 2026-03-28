import { describe, it, expect } from "vitest";

import { getCategoryColor } from "../category-colors";

describe("getCategoryColor", () => {
  it("既知のカテゴリに対応する色を返す", () => {
    const populationColor = getCategoryColor("population");
    expect(populationColor.bg).toContain("blue");
    expect(populationColor.text).toContain("blue");
  });

  it("economy カテゴリ", () => {
    const color = getCategoryColor("economy");
    expect(color.bg).toContain("amber");
  });

  it("laborwage カテゴリ", () => {
    const color = getCategoryColor("laborwage");
    expect(color.bg).toContain("emerald");
  });

  it("tourism カテゴリ", () => {
    const color = getCategoryColor("tourism");
    expect(color.bg).toContain("rose");
  });

  it("全カテゴリが bg, text, hoverBg, hoverText を持つ", () => {
    const categories = [
      "population", "economy", "laborwage", "agriculture",
      "commercial", "construction", "miningindustry", "educationsports",
      "socialsecurity", "safetyenvironment", "landweather", "energy",
      "infrastructure", "ict", "tourism", "international", "administrativefinancial",
    ];
    for (const cat of categories) {
      const color = getCategoryColor(cat);
      expect(color).toHaveProperty("bg");
      expect(color).toHaveProperty("text");
      expect(color).toHaveProperty("hoverBg");
      expect(color).toHaveProperty("hoverText");
    }
  });

  it("未知のカテゴリにデフォルト色を返す", () => {
    const color = getCategoryColor("unknown_category");
    expect(color.bg).toBe("bg-primary/10");
    expect(color.text).toBe("text-primary");
  });
});
