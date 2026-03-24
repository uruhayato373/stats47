import { describe, expect, it } from "vitest";

import { getCategoryColor } from "../utils/category-colors";

describe("getCategoryColor", () => {
  it("既知のカテゴリキーに対応するカラーを返す", () => {
    const color = getCategoryColor("population");
    expect(color.bg).toContain("blue");
    expect(color.text).toContain("blue");
  });

  it("全カテゴリキーが 4 プロパティを持つ", () => {
    const keys = [
      "population", "economy", "laborwage", "agriculture", "commercial",
      "construction", "miningindustry", "educationsports", "socialsecurity",
      "safetyenvironment", "landweather", "energy", "infrastructure",
      "ict", "tourism", "international", "administrativefinancial",
    ];

    for (const key of keys) {
      const color = getCategoryColor(key);
      expect(color.bg, `${key}.bg`).toBeTruthy();
      expect(color.text, `${key}.text`).toBeTruthy();
      expect(color.hoverBg, `${key}.hoverBg`).toBeTruthy();
      expect(color.hoverText, `${key}.hoverText`).toBeTruthy();
    }
  });

  it("未知のカテゴリキーにはデフォルトカラーを返す", () => {
    const color = getCategoryColor("unknown-key");
    expect(color.bg).toContain("primary");
    expect(color.text).toContain("primary");
  });

  it("空文字列にはデフォルトカラーを返す", () => {
    const color = getCategoryColor("");
    expect(color.bg).toContain("primary");
  });
});
