/**
 * 2 つの台帳が同じ事実を持つ箇所の正本と写しの照合 (LEDGER-DUPLICATE-FACTS-01・2026-10-27)。
 *
 * | 事実 | 正本 | 写し・導出 |
 * |---|---|---|
 * | ココナラの公開状態 | config/coconala-listings.json の status | 商品定義 (packs.ts) は持たない (ProductStatus から "listed" を外した) |
 * | 外に出した価格 | 出品台帳の priceYen | 商品定義の price は許容範囲。台帳の価格は範囲内であること |
 * | 書籍の題名・状態 | book-catalog.ts | data/products/kindle-status.json (products:kindle:report の出力) |
 *
 * KDP の status・kdpStatus・publicationStage の関係は config/schema/kdp.listings.schema.json が固定し、
 * check-datasets の test が壊した組み合わせで落ちることを確かめる。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { validateCatalog, validateListingPrices } from "../src/validators/catalog-validator";
import { GEO_SERVICE_OFFER } from "../src/channels/geo/service-offer";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";
import { buildKindleStatus } from "../src/channels/kindle/kindle-status";
import type { ProductDefinition, ProductStatus } from "../src/catalog/types";
import { COCONALA_LISTINGS } from "../../../config/paths.mjs";
import { datasetDir } from "../../../config/datasets.mjs";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const readJson = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const FIXED = { [GEO_SERVICE_OFFER.id]: GEO_SERVICE_OFFER.priceYen };

describe("ココナラの公開状態は出品台帳だけが持つ", () => {
  it("商品定義に販売先の公開状態 (listed) が無く、出品台帳は全件 withdrawn (2026-10-19 撤退)", () => {
    for (const p of ALL_PRODUCTS) expect(p.status).not.toBe("listed");
    const listings = readJson(COCONALA_LISTINGS).listings as Record<string, { status: string }>;
    for (const [id, row] of Object.entries(listings)) expect(row.status, id).toBe("withdrawn");
  });

  it("[mutation] 商品定義に listed を書くと catalog 検査が status-enum で落ちる", () => {
    const broken = ALL_PRODUCTS.map((p) => (p.id === "P-01" ? { ...p, status: "listed" as unknown as ProductStatus } : p));
    const result = validateCatalog(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "status-enum" && e.id === "P-01")).toBe(true);
  });
});

describe("出品台帳の価格は商品定義の価格帯に入る", () => {
  it("実データ: ココナラ出品台帳の全行が価格の記録を持ち、範囲・刻み・固定価格に合う", () => {
    const listings = readJson(COCONALA_LISTINGS).listings;
    expect(validateListingPrices(ALL_PRODUCTS, listings, FIXED)).toEqual([]);
  });

  it("[mutation] 範囲の外・刻み違い・固定価格違い・価格なし・孤立したキーをそれぞれの理由で落とす (出品中の行)", () => {
    // 実データは全行 withdrawn (撤退時の記録) なので、出品中に戻した写しで照合する
    const listings = Object.fromEntries(
      Object.entries(readJson(COCONALA_LISTINGS).listings as Record<string, { priceYen?: unknown; status?: string }>).map(([id, row]) => [
        id,
        { ...row, status: "listed" },
      ]),
    ) as Record<string, { priceYen?: unknown; status?: string }>;
    listings["P-08"] = { ...listings["P-08"], priceYen: 6000 }; // 範囲外の記録 (下の withdrawn の検査) を除いて、出品中なら通る形にする
    expect(validateListingPrices(ALL_PRODUCTS, listings, FIXED)).toEqual([]);
    const p01 = ALL_PRODUCTS.find((p) => p.id === "P-01") as ProductDefinition;
    const cases: [Record<string, { priceYen?: unknown }>, string][] = [
      [{ ...listings, "P-01": { ...listings["P-01"], priceYen: p01.price.maxYen + 1000 } }, "listing-price-range"],
      [{ ...listings, "P-01": { ...listings["P-01"], priceYen: p01.price.minYen + 100 } }, "listing-price-step"],
      [{ ...listings, [GEO_SERVICE_OFFER.id]: { priceYen: GEO_SERVICE_OFFER.priceYen + 500 } }, "listing-price-fixed"],
      [{ ...listings, "P-01": { ...listings["P-01"], priceYen: undefined } }, "listing-price-missing"],
      [{ ...listings, "X-99": { priceYen: 1000 } }, "listing-orphan"],
    ];
    for (const [broken, code] of cases) {
      const errors = validateListingPrices(ALL_PRODUCTS, broken, FIXED);
      expect(errors.map((e) => e.code), code).toEqual([code]);
    }
  });

  it("withdrawn の行は撤退時の価格の記録として範囲を照合しないが、価格が無ければ落とす", () => {
    const listings = readJson(COCONALA_LISTINGS).listings as Record<string, { priceYen?: unknown; status?: string }>;
    expect(listings["P-08"].status).toBe("withdrawn");
    expect(validateListingPrices(ALL_PRODUCTS, { "P-08": { ...listings["P-08"], status: "listed" } }, FIXED).map((e) => e.code)).toEqual([
      "listing-price-range",
    ]);
    expect(validateListingPrices(ALL_PRODUCTS, { "P-08": { ...listings["P-08"], priceYen: undefined } }, FIXED).map((e) => e.code)).toEqual([
      "listing-price-missing",
    ]);
  });
});

describe("kindle-status.json は書籍カタログから作った値と一致する (鮮度)", () => {
  const path = `${datasetDir("kindle.archives")}/kindle-status.json`;

  it("実データ: generatedAt 以外が buildKindleStatus(KINDLE_BOOKS) と一致する (ずれたら products:kindle:report で再生成)", () => {
    const file = readJson(path);
    expect(file).toEqual(buildKindleStatus(KINDLE_BOOKS, file.generatedAt));
  });

  it("[mutation] カタログの題名を変えると写しと食い違う", () => {
    const file = readJson(path);
    const renamed = KINDLE_BOOKS.map((b, i) => (i === 0 ? { ...b, title: `${b.title} (改題)` } : b));
    expect(file).not.toEqual(buildKindleStatus(renamed, file.generatedAt));
  });
});
