/**
 * 2 つの台帳が同じ事実を持つ箇所の正本と写しの照合 (LEDGER-DUPLICATE-FACTS-01・2026-10-27)。
 *
 * | 事実 | 正本 | 写し・導出 |
 * |---|---|---|
 * | 販売先での公開状態 | 各販路の台帳 (note は data/note/articles.json、Kindle は data/products/kdp/listings.json) | 商品定義 (packs.ts) は持たない (ProductStatus に "listed" が無い) |
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
import { validateCatalog } from "../src/validators/catalog-validator";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";
import { buildKindleStatus } from "../src/channels/kindle/kindle-status";
import type { ProductStatus } from "../src/catalog/types";
import { datasetDir } from "../../../config/datasets.mjs";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const readJson = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));

describe("販売先での公開状態は商品定義に持たない", () => {
  it("商品定義に販売先の公開状態 (listed) が無い", () => {
    for (const p of ALL_PRODUCTS) expect(p.status).not.toBe("listed");
  });

  it("[mutation] 商品定義に listed を書くと catalog 検査が status-enum で落ちる", () => {
    const broken = ALL_PRODUCTS.map((p) => (p.id === "P-01" ? { ...p, status: "listed" as unknown as ProductStatus } : p));
    const result = validateCatalog(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "status-enum" && e.id === "P-01")).toBe(true);
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
