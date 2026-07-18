import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { validateCatalog } from "../src/validators/catalog-validator";
import { EXPECTED_TOTAL, EXPECTED_FAMILY_COUNTS, expectedIds } from "../src/catalog/families";
import { LICENSE_IDS } from "../src/catalog/licenses";

const here = dirname(fileURLToPath(import.meta.url)); // packages/product-factory/tests
const REVIEW_DOC = resolve(here, "../../..", "docs/04_レビュー/2026-07-18-coconala-content-monetization.md");

/** レビュー文書の A〜L カタログ表の先頭セル ID (`| A-01 |`) だけを抽出する。 */
function reviewIds(): string[] {
  const text = readFileSync(REVIEW_DOC, "utf8");
  const ids = new Set<string>();
  for (const line of text.split("\n")) {
    const m = line.match(/^\|\s*([A-L]-\d{2})\s*\|/);
    if (m) ids.add(m[1]);
  }
  return [...ids].sort();
}

describe("product catalog", () => {
  it("registers exactly 174 products (A-01..L-07)", () => {
    expect(EXPECTED_TOTAL).toBe(174);
    expect(ALL_PRODUCTS.length).toBe(EXPECTED_TOTAL);
  });

  it("passes deterministic validation with zero errors", () => {
    const result = validateCatalog(ALL_PRODUCTS);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("has unique IDs equal to the generated expected set", () => {
    const ids = ALL_PRODUCTS.map((p) => p.id).sort();
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([...expectedIds()].sort());
  });

  it("machine-verifies correspondence to the review document", () => {
    const catalogIds = ALL_PRODUCTS.map((p) => p.id).sort();
    expect(catalogIds).toEqual(reviewIds());
  });

  it("matches the expected per-family counts", () => {
    const result = validateCatalog(ALL_PRODUCTS);
    for (const [letter, want] of Object.entries(EXPECTED_FAMILY_COUNTS)) {
      expect(result.perFamily[letter]).toBe(want);
    }
  });

  it("references only registered licenses and (Phase 1) no templates", () => {
    for (const p of ALL_PRODUCTS) {
      expect(LICENSE_IDS).toContain(p.licenseId);
      expect(p.templateIds).toEqual([]); // Phase 1: テンプレ未実装
      expect(p.metrics).toEqual([]); // Phase 1: R2 metric 未接続
    }
  });

  it("keeps price ordering minYen <= initialYen <= maxYen", () => {
    for (const p of ALL_PRODUCTS) {
      expect(p.price.minYen).toBeLessThanOrEqual(p.price.initialYen);
      expect(p.price.initialYen).toBeLessThanOrEqual(p.price.maxYen);
      expect(p.price.minYen).toBeGreaterThanOrEqual(0);
    }
  });

  it("detects a corrupted catalog (validator negative control)", () => {
    const broken = ALL_PRODUCTS.slice(1); // drop A-01 → id-missing + count errors
    const result = validateCatalog(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "id-missing")).toBe(true);
  });
});
