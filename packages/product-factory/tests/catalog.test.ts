import { describe, it, expect } from "vitest";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { validateCatalog } from "../src/validators/catalog-validator";
import { EXPECTED_TOTAL, EXPECTED_PACK_IDS } from "../src/catalog/packs";
import { LICENSE_IDS } from "../src/catalog/licenses";
import { DATASET_KEYS } from "../src/data/datasets";
import { PRODUCT_EXCLUDED_RANKING_KEYS } from "../src/catalog/pack-theme-map";

describe("pack catalog", () => {
  it("registers exactly 14 packs (P-01..P-14)", () => {
    expect(EXPECTED_TOTAL).toBe(14);
    expect(ALL_PRODUCTS.length).toBe(EXPECTED_TOTAL);
  });

  it("passes deterministic validation with zero errors", () => {
    const result = validateCatalog(ALL_PRODUCTS);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("has unique IDs equal to the expected pack set", () => {
    const ids = ALL_PRODUCTS.map((p) => p.id).sort();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...EXPECTED_PACK_IDS].sort());
  });

  it("references only registered licenses and (until connected) no templates/metrics", () => {
    for (const p of ALL_PRODUCTS) {
      expect(LICENSE_IDS).toContain(p.licenseId);
      expect(p.templateIds).toEqual([]);
      expect(p.metrics).toEqual([]);
    }
  });

  it("keeps price ordering minYen <= initialYen <= maxYen", () => {
    for (const p of ALL_PRODUCTS) {
      expect(p.price.minYen).toBeLessThanOrEqual(p.price.initialYen);
      expect(p.price.initialYen).toBeLessThanOrEqual(p.price.maxYen);
      expect(p.price.minYen).toBeGreaterThanOrEqual(0);
    }
  });

  it("only lists (approved/listed) packs whose datasets all exist — anti-overclaim", () => {
    for (const p of ALL_PRODUCTS) {
      if (p.status === "approved" || p.status === "listed") {
        expect(p.datasets.length, `${p.id} listable must declare datasets`).toBeGreaterThan(0);
        for (const key of p.datasets) {
          expect(DATASET_KEYS.has(key), `${p.id} dataset ${key} must exist`).toBe(true);
        }
      }
    }
  });

  it("権利確認前の非商用データを有償パックへ収録しない", () => {
    for (const p of ALL_PRODUCTS) {
      for (const key of p.datasets) expect(PRODUCT_EXCLUDED_RANKING_KEYS.has(key)).toBe(false);
      for (const key of p.rankingKeys) expect(PRODUCT_EXCLUDED_RANKING_KEYS.has(key)).toBe(false);
    }
    expect(DATASET_KEYS.has("tourism-resource-count")).toBe(false);
  });

  it("P-01 inherits the real 4 datasets of former D-01 and is listable", () => {
    const p01 = ALL_PRODUCTS.find((p) => p.id === "P-01");
    expect(p01).toBeDefined();
    expect(p01!.status).toBe("listed");
    expect([...p01!.datasets].sort()).toEqual(
      [
        "general-households",
        "per-capita-prefectural-income-h27",
        "total-area-including-northern-territories-and-takeshima",
        "total-population",
      ].sort(),
    );
    for (const key of p01!.datasets) expect(DATASET_KEYS.has(key)).toBe(true);
  });

  it("detects an overclaiming catalog (validator negative control)", () => {
    // approved/listed だが実在しない dataset を宣言 → datasets-missing で ok=false
    const broken = ALL_PRODUCTS.map((p) =>
      p.id === "P-02" ? { ...p, status: "listed" as const, datasets: ["does-not-exist"] } : p,
    );
    const result = validateCatalog(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "datasets-missing")).toBe(true);
  });

  it("detects a corrupted catalog (drops P-01 → id-missing + count)", () => {
    const broken = ALL_PRODUCTS.filter((p) => p.id !== "P-01");
    const result = validateCatalog(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "id-missing")).toBe(true);
  });
});
