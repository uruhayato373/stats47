import { describe, expect, it } from "vitest";

import { getCategoryName, getMetricConfig } from "@stats47/data-configs";
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from "@stats47/data-configs/geo-scope";

import { buildMunicipalitySearchDocuments } from "../municipality-search-documents";

describe("buildMunicipalitySearchDocuments", () => {
  const documents = buildMunicipalitySearchDocuments(KNOWN_MUNICIPALITY_RANKING_KEYS, getMetricConfig, getCategoryName);

  it("公開中の市区町村ランキングを全件、市区町村ランキングの URL で載せる", () => {
    expect(documents).toHaveLength(KNOWN_MUNICIPALITY_RANKING_KEYS.size);
    expect(new Set(documents.map((d) => d.id)).size).toBe(documents.length);
    for (const d of documents) {
      expect(d.type).toBe("municipality-ranking");
      expect(d.url).toMatch(/^\/municipalities\/ranking\/[a-z0-9-]+$/);
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.description).toContain("市区町村ランキング");
    }
  });

  it("都道府県ランキングと id が衝突しない", () => {
    expect(documents.every((d) => d.id.startsWith("municipality-ranking_"))).toBe(true);
  });

  it("指標設定の無い key は止める (公開集合と設定のずれを見逃さない)", () => {
    expect(() => buildMunicipalitySearchDocuments(["no-such-metric"], getMetricConfig, getCategoryName)).toThrow();
  });
});
