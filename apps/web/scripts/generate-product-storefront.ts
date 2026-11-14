/**
 * 公開済み KDP / note 商品から Web 商品ハブの静的カタログを生成する。
 *
 * 真実源:
 * - 商品内容: packages/product-factory の型付きカタログ
 * - 全データ商品の説明・見本: products.landings / products.landing-evidence 台帳
 * - 公開状態・販売 URL: data/products/kdp/listings.json / data/note/articles.json
 * - ココナラ撤退済みのデータパックを旧出品URLから復活させない
 *
 * 下書き・審査中・ASIN/URL 未確定の商品は fail-closed で出力しない。
 */
import fs from "node:fs";
import path from "node:path";

import { assertDatasetShape } from "../../../.claude/scripts/lib/dataset-shape.mjs";
import { readArticleLedger } from "../../../.claude/scripts/note/lib/article-ledger.mjs";
import { datasetPath } from "../../../config/datasets.mjs";
import { KDP_LISTINGS } from "../../../config/paths.mjs";
import { ALL_PRODUCTS } from "../../../packages/product-factory/src/catalog/products";
import { KINDLE_BOOKS } from "../../../packages/product-factory/src/channels/kindle/book-catalog";
import { NOTE_PRODUCT_MAPPINGS } from "../../../packages/product-factory/src/channels/note/product-note-mapping";

import { buildKindleStorefrontContent, selectLiveKindleEdition, type KindleStorefrontListing } from "./lib/kindle-storefront";
import { readProductLanding } from "./lib/product-landing";

import type { NoteArticle } from "../../../.claude/scripts/note/catalog/types";
import type { StorefrontProduct } from "../src/features/products/types";

const ROOT = path.resolve(__dirname, "../../..");
const KDP_LISTINGS_PATH = path.join(ROOT, KDP_LISTINGS);
const OUTPUT_PATH = path.join(
  ROOT,
  "apps/web/src/features/products/storefront.generated.ts",
);

interface KdpListingsFile {
  readonly listings: Readonly<Record<string, KindleStorefrontListing>>;
}

/** 商品カタログ (product-factory) を通さず、note の台帳だけで公開状態が決まるデータ商品。 */
type StandaloneNoteProduct = { readonly id: string; readonly articleKey: string };

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function buildStorefrontProducts(): StorefrontProduct[] {
  const kdp = readJson<KdpListingsFile>(KDP_LISTINGS_PATH).listings;
  const standalone = readJson<{ readonly products: readonly StandaloneNoteProduct[] }>(
    path.join(ROOT, datasetPath("products.standalone-note")),
  );
  assertDatasetShape("products.standalone-note", standalone);

  const booksById = new Map(KINDLE_BOOKS.map((book) => [book.id, book]));
  const productsById = new Map(ALL_PRODUCTS.map((product) => [product.id, product]));

  const kindleProducts = Object.entries(kdp)
    .flatMap(([id, listing]): StorefrontProduct[] => {
      const edition = selectLiveKindleEdition(listing);
      if (!edition) return [];
      const book = booksById.get(id);
      if (!book) throw new Error(`KDP listing ${id}: KINDLE_BOOKS に定義がありません`);
      const sourceBlogSlugs = edition === listing ? book.chapters.flatMap((chapter) =>
        chapter.source === "blog" && chapter.blogSlug ? [chapter.blogSlug] : [],
      ) : [];
      return [{
        id,
        slug: `kindle-${id.toLowerCase()}`,
        channel: "kindle",
        channelLabel: "Kindle電子書籍",
        title: edition.title,
        priceYen: edition.priceYen,
        externalUrl: `https://www.amazon.co.jp/dp/${edition.asin}`,
        ...buildKindleStorefrontContent(id, listing, edition, book),
        sourceBlogSlugs,
      }];
    });

  const noteArticles = readArticleLedger().articles as readonly NoteArticle[];
  const noteProducts: StorefrontProduct[] = NOTE_PRODUCT_MAPPINGS.flatMap((mapping): StorefrontProduct[] => {
    const article = noteArticles.find((item) => item.key === mapping.canonicalSlug);
    if (!article || article.status !== 'published' || !article.isPaid || !article.noteUrl) return [];
    if (!/^https:\/\/note\.com\/stats47\/n\/n[a-f0-9]{12}$/.test(article.noteUrl) || !article.priceJpy) throw Error(`Invalid published note product: ${mapping.productId}`);
    const product = productsById.get(mapping.productId);
    if (!product) throw Error(`Unknown note product: ${mapping.productId}`);
    return [{ id: product.id, slug: `data-${product.id.toLowerCase()}`, channel: 'note', channelLabel: 'note有料データ集',
      listingTitle: article.title, priceYen: article.priceJpy, externalUrl: article.noteUrl,
      audience: [...product.audience], sourceBlogSlugs: [],
      ...readProductLanding(ROOT, product.id, article.key) }];
  });
  const standaloneProducts: StorefrontProduct[] = standalone.products.flatMap(({ articleKey, ...content }): StorefrontProduct[] => {
    const article = noteArticles.find((candidate) => candidate.key === articleKey);
    if (!article || article.status !== "published" || !article.isPaid || !article.noteUrl || !article.priceJpy) return [];
    return [{
      id: content.id,
      slug: `data-${content.id.toLowerCase()}`,
      channel: "note",
      channelLabel: "note有料データ集",
      listingTitle: article.title,
      priceYen: article.priceJpy,
      externalUrl: article.noteUrl,
      audience: [],
      sourceBlogSlugs: [],
      ...readProductLanding(ROOT, content.id, articleKey),
    }];
  });
  const coverUrls = readJson<Record<string, string>>(path.join(ROOT, datasetPath("products.note-cover-urls")));
  return [...kindleProducts, ...noteProducts, ...standaloneProducts]
    .map((product) => (coverUrls[product.externalUrl] ? { ...product, coverImageUrl: coverUrls[product.externalUrl] } : product))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function render(products: readonly StorefrontProduct[]): string {
  return `/**\n * 自動生成。手編集しない。\n * generator: apps/web/scripts/generate-product-storefront.ts\n */\nimport type { StorefrontProduct } from "./types";\n\nexport const STOREFRONT_PRODUCTS = ${JSON.stringify(products, null, 2)} as const satisfies readonly StorefrontProduct[];\n`;
}

const products = buildStorefrontProducts();
const next = render(products);
const isCheck = process.argv.includes("--check");
const current = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf8") : "";

if (isCheck) {
  if (current !== next) {
    console.error("product storefront generated file is stale");
    process.exit(1);
  }
  console.log("product storefront: up to date");
} else {
  fs.writeFileSync(OUTPUT_PATH, next);
  console.log(`product storefront: ${products.length} products -> ${OUTPUT_PATH}`);
}
