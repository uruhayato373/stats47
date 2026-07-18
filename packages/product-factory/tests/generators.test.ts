import { describe, it, expect } from "vitest";
import { mkdtempSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildB01 } from "../src/build/build-b01";
import { buildInputHash } from "../src/generators/manifest";
import { SAMPLE_DATASET } from "../src/fixtures/sample-dataset";
import { JAPANESE_POPULATION_2024 } from "../src/data/datasets/japanese-population";
import { validateDataset } from "../src/validators/dataset-validator";
import { JAPAN_CLIP } from "../src/maps/prefecture-geometry";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { serializeDatasetCsv } from "../src/generators/csv";
import { renderListing } from "../src/generators/listing";

const REL = [
  "product.pptx",
  "manual.pdf",
  "data.csv",
  "SOURCES.csv",
  "LICENSE-ja.txt",
  "preview/thumbnail-620x620.png",
  "listing/listing.md",
  "manifest.json",
];

describe("B-01 build pipeline (integration)", () => {
  it(
    "generates all artifacts with valid pptx/pdf and a deterministic inputHash",
    async () => {
      const outRoot = mkdtempSync(join(tmpdir(), "pf-b01-"));
      const res = await buildB01({ outRoot, generatedAt: "2026-07-18T00:00:00.000Z" });

      for (const f of REL) {
        expect(existsSync(join(res.outDir, f)), `missing ${f}`).toBe(true);
      }
      // pptx = zip (PK), pdf = %PDF-
      expect(readFileSync(join(res.outDir, "product.pptx")).subarray(0, 2).toString("latin1")).toBe("PK");
      expect(readFileSync(join(res.outDir, "manual.pdf")).subarray(0, 5).toString("latin1")).toBe("%PDF-");
      // preview png signature
      expect(readFileSync(join(res.outDir, "preview/thumbnail-620x620.png")).subarray(1, 4).toString("latin1")).toBe("PNG");

      expect(res.manifest.files.length).toBe(7);
      expect(res.manifest.productId).toBe("B-01");

      // 実データ商品なので manifest / listing に「架空」を出さない
      expect(res.manifest.notice).not.toContain("架空");
      const listing = readFileSync(join(res.outDir, "listing/listing.md"), "utf8");
      expect(listing).not.toContain("架空");
      const sources = readFileSync(join(res.outDir, "SOURCES.csv"), "utf8");
      expect(sources).toContain("0000010101"); // 実 statsDataId

      // inputHash は入力 snapshot から決定的に再現できる (実データセット)
      const ds = JAPANESE_POPULATION_2024;
      const product = ALL_PRODUCTS.find((p) => p.id === "B-01");
      if (!product) throw new Error("B-01 not found");
      const expected = buildInputHash({
        productId: "B-01",
        licenseId: product.licenseId,
        price: product.price,
        formats: product.formats,
        version: "v1",
        clip: JAPAN_CLIP,
        dataset: {
          indicator: ds.indicator,
          unit: ds.unit,
          year: ds.year,
          source: ds.source,
          values: ds.values,
        },
      });
      expect(res.manifest.inputHash).toBe(expected);
    },
    60000,
  );

  it("validates the real japanese-population dataset (47 rows, isSample=false)", () => {
    const r = validateDataset(JAPANESE_POPULATION_2024);
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
    expect(JAPANESE_POPULATION_2024.isSample).toBe(false);
    expect(JAPANESE_POPULATION_2024.values.length).toBe(47);
    expect(JAPANESE_POPULATION_2024.values.every((d) => d.value !== null)).toBe(true);
  });

  it("emits data.csv with 47 rows and a BOM", () => {
    const csv = serializeDatasetCsv(SAMPLE_DATASET);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.trimEnd().split("\r\n").length).toBe(48); // header + 47
  });

  it("emits listing markdown with resale prohibition", () => {
    const product = ALL_PRODUCTS.find((p) => p.id === "B-01");
    if (!product) throw new Error("B-01 not found");
    const md = renderListing(product, SAMPLE_DATASET);
    expect(md).toContain("# 都道府県データ説明スライド20枚セット");
    expect(md).toContain("再販売 / 再配布は禁止");
  });
});
