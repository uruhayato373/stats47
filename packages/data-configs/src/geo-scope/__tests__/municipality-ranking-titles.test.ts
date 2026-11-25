import { describe, expect, it } from "vitest";

import { buildMunicipalityRankingSubtitles, subtitleCarriesDenominator } from "../municipality-ranking-titles";

describe("subtitleCarriesDenominator", () => {
  it("分母が subtitle にしか無い指標を拾う (百貨店数 0.9店 は人口10万人当たり)", () => {
    expect(subtitleCarriesDenominator({ title: "百貨店数", subtitle: "人口10万人当たり", unit: "店" })).toBe(true);
    expect(subtitleCarriesDenominator({ title: "持ち家住宅の延べ面積", subtitle: "1住宅当たり", unit: "ｍ2" })).toBe(true);
  });

  it("title がすでに分母を宣言していれば重ねない", () => {
    expect(subtitleCarriesDenominator({ title: "刑法犯認知件数（人口千人当たり）", subtitle: "人口1000人当たり", unit: "件" })).toBe(false);
  });

  it("unit が分母を持つときは subtitle に頼らない", () => {
    expect(subtitleCarriesDenominator({ title: "医師数", subtitle: "人口10万人当たり", unit: "人（人口10万対）" })).toBe(false);
  });

  it("分母を宣言しない subtitle (総数・調査名) は付けない", () => {
    expect(subtitleCarriesDenominator({ title: "歯科診療所数", subtitle: "総数", unit: "施設" })).toBe(false);
    expect(subtitleCarriesDenominator({ title: "土木費", subtitle: "市町村財政", unit: "千円" })).toBe(false);
  });
});

describe("buildMunicipalityRankingSubtitles", () => {
  const metrics = {
    "store-per-100k": { title: "百貨店数", subtitle: "人口10万人当たり", unit: "店" },
    "clinic-total": { title: "歯科診療所数", subtitle: "総数", unit: "施設" },
    "est-a": { title: "事業所数", subtitle: "製造業", unit: "事業所" },
    "est-b": { title: "事業所数", subtitle: "小売業", unit: "事業所" },
  };

  it("分母が subtitle にしか無い指標は重ならなくても subtitle を付け、総数には付けない", () => {
    const result = buildMunicipalityRankingSubtitles(new Set(Object.keys(metrics)), metrics);
    expect(result.get("store-per-100k")).toBe("人口10万人当たり");
    expect(result.has("clinic-total")).toBe(false);
    expect(result.get("est-a")).toBe("製造業");
    expect(result.get("est-b")).toBe("小売業");
  });

  it("公開中の指標で分母が subtitle にしか無いものは、すべて表示名に分母が付く", () => {
    const result = buildMunicipalityRankingSubtitles();
    for (const key of [
      "department-store-count-per-100k",
      "densely-inhabited-district-population-density",
      "tatami-per-dwelling-owner",
      "tatami-per-dwelling-rented",
      "floor-area-per-dwelling-owner",
      "floor-area-per-dwelling-rented",
    ]) {
      expect(result.get(key), key).toMatch(/当たり/);
    }
  });
});
