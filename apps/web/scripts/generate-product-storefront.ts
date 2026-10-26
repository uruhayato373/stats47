/**
 * 公開済み KDP / note 商品から Web 商品ハブの静的カタログを生成する。
 *
 * 真実源:
 * - 商品内容: packages/product-factory の型付きカタログ
 * - 公開状態・販売 URL: config/kdp-listings.json / data/note/articles.json
 * - ココナラ撤退済みのデータパックを旧出品URLから復活させない
 *
 * 下書き・審査中・ASIN/URL 未確定の商品は fail-closed で出力しない。
 */
import fs from "node:fs";
import path from "node:path";

import { readArticleLedger } from "../../../.claude/scripts/note/lib/article-ledger.mjs";
import { COCONALA_LISTINGS, KDP_LISTINGS } from "../../../config/paths.mjs";
import { ALL_PRODUCTS } from "../../../packages/product-factory/src/catalog/products";
import { GEO_SERVICE_OFFER } from "../../../packages/product-factory/src/channels/geo/service-offer";
import { KINDLE_BOOKS } from "../../../packages/product-factory/src/channels/kindle/book-catalog";
import { NOTE_PRODUCT_MAPPINGS } from "../../../packages/product-factory/src/channels/note/product-note-mapping";

import { selectLiveKindleEdition, type KindleStorefrontListing } from "./lib/kindle-storefront";

import type { NoteArticle } from "../../../.claude/scripts/note/catalog/types";
import type { StorefrontProduct } from "../src/features/products/types";

const ROOT = path.resolve(__dirname, "../../..");
const KDP_LISTINGS_PATH = path.join(ROOT, KDP_LISTINGS);
const COCONALA_LISTINGS_PATH = path.join(ROOT, COCONALA_LISTINGS);
const OUTPUT_PATH = path.join(
  ROOT,
  "apps/web/src/features/products/storefront.generated.ts",
);

interface CoconalaListing {
  readonly title: string;
  readonly priceYen: number;
  readonly status: string;
  readonly serviceUrl?: string | null;
}

interface KdpListingsFile {
  readonly listings: Readonly<Record<string, KindleStorefrontListing>>;
}

interface CoconalaListingsFile {
  readonly listings: Readonly<Record<string, CoconalaListing>>;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function buildStorefrontProducts(): StorefrontProduct[] {
  const kdp = readJson<KdpListingsFile>(KDP_LISTINGS_PATH).listings;
  const coconala = readJson<CoconalaListingsFile>(COCONALA_LISTINGS_PATH).listings;

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
        description: edition === listing ? book.concept :
          "販売中の旧版です。新版は現在準備・審査中のため、リンク先の書名・版をご確認ください。",
        priceYen: edition.priceYen,
        externalUrl: `https://www.amazon.co.jp/dp/${edition.asin}`,
        included: ["Kindle電子書籍", "固定時点の公的統計", "図表とテーマ解説"],
        audience: ["地域差を読み物として知りたい方"],
        sourceBlogSlugs,
      }];
    });

  const dataProducts = Object.entries(coconala)
    .filter(([id]) => id === GEO_SERVICE_OFFER.id)
    .filter(([, listing]) => listing.status === "listed" && Boolean(listing.serviceUrl))
    .map(([id, listing]): StorefrontProduct => {
      const product = productsById.get(id);
      if (!product && id !== GEO_SERVICE_OFFER.id) {
        throw new Error(`Coconala listing ${id}: 商品契約に定義がありません`);
      }
      if (id === GEO_SERVICE_OFFER.id) {
        return {
          id,
          slug: `service-${id.toLowerCase()}`,
          channel: "coconala",
          channelLabel: "個別分析サービス",
          title: listing.title,
          description: GEO_SERVICE_OFFER.outcome,
          priceYen: listing.priceYen,
          externalUrl: listing.serviceUrl as string,
          included: ["説明付きHTMLレポート", "地点・メッシュCSV", "出典・検算結果"],
          audience: [GEO_SERVICE_OFFER.audience],
          sourceBlogSlugs: [],
        };
      }
      if (!product) throw new Error(`Coconala listing ${id}: 商品契約に定義がありません`);
      return {
        id,
        slug: `data-${id.toLowerCase()}`,
        channel: "coconala",
        channelLabel: "編集可能データ",
        title: listing.title,
        description: product.jobToBeDone,
        priceYen: listing.priceYen,
        externalUrl: listing.serviceUrl as string,
        included: product.formats.map((format) => format.toUpperCase()),
        audience: [...product.audience],
        sourceBlogSlugs: [],
      };
    });

  const noteArticles = readArticleLedger().articles as readonly NoteArticle[];
  const noteProducts: StorefrontProduct[] = NOTE_PRODUCT_MAPPINGS.flatMap((mapping): StorefrontProduct[] => {
    const article = noteArticles.find((item) => item.key === mapping.canonicalSlug);
    if (!article || article.status !== 'published' || !article.isPaid || !article.noteUrl) return [];
    if (!/^https:\/\/note\.com\/stats47\/n\/n[a-f0-9]{12}$/.test(article.noteUrl) || !article.priceJpy) throw Error(`Invalid published note product: ${mapping.productId}`);
    const product = productsById.get(mapping.productId);
    if (!product) throw Error(`Unknown note product: ${mapping.productId}`);
    return [{ id: product.id, slug: `data-${product.id.toLowerCase()}`, channel: 'note', channelLabel: 'note有料データ集',
      title: article.title, description: product.jobToBeDone, priceYen: article.priceJpy, externalUrl: article.noteUrl,
      included: product.formats.map((format) => format.toUpperCase()), audience: [...product.audience], sourceBlogSlugs: [] }];
  });
  return [...kindleProducts, ...dataProducts, ...noteProducts].sort((a, b) =>
    a.slug.localeCompare(b.slug),
  );
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
