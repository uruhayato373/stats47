/**
 * 公開済み KDP / ココナラ商品から Web 商品ハブの静的カタログを生成する。
 *
 * 真実源:
 * - 商品内容: packages/product-factory の型付きカタログ
 * - 公開状態・販売 URL: .claude/config/{kdp,coconala}-listings.json
 *
 * 下書き・審査中・ASIN/URL 未確定の商品は fail-closed で出力しない。
 */
import fs from "node:fs";
import path from "node:path";

import { ALL_PRODUCTS } from "../../../packages/product-factory/src/catalog/products";
import { KINDLE_BOOKS } from "../../../packages/product-factory/src/channels/kindle/book-catalog";

import type { StorefrontProduct } from "../src/features/products/types";

const ROOT = path.resolve(__dirname, "../../..");
const KDP_LISTINGS_PATH = path.join(ROOT, ".claude/config/kdp-listings.json");
const COCONALA_LISTINGS_PATH = path.join(ROOT, ".claude/config/coconala-listings.json");
const OUTPUT_PATH = path.join(
  ROOT,
  "apps/web/src/features/products/storefront.generated.ts",
);

interface KdpListing {
  readonly id: string;
  readonly title: string;
  readonly priceYen: number;
  readonly asin?: string | null;
  readonly kdpStatus?: string | null;
}

interface CoconalaListing {
  readonly title: string;
  readonly priceYen: number;
  readonly status: string;
  readonly serviceUrl?: string | null;
}

interface KdpListingsFile {
  readonly listings: Readonly<Record<string, KdpListing>>;
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
    .filter(([, listing]) => listing.kdpStatus === "live" && Boolean(listing.asin))
    .map(([id, listing]): StorefrontProduct => {
      const book = booksById.get(id);
      if (!book) throw new Error(`KDP listing ${id}: KINDLE_BOOKS に定義がありません`);
      const sourceBlogSlugs = book.chapters.flatMap((chapter) =>
        chapter.source === "blog" && chapter.blogSlug ? [chapter.blogSlug] : [],
      );
      return {
        id,
        slug: `kindle-${id.toLowerCase()}`,
        channel: "kindle",
        channelLabel: "Kindle電子書籍",
        title: listing.title,
        description: book.concept,
        priceYen: listing.priceYen,
        externalUrl: `https://www.amazon.co.jp/dp/${listing.asin}`,
        included: ["Kindle電子書籍", "固定時点の公的統計", "図表とテーマ解説"],
        audience: ["地域差を読み物として知りたい方"],
        sourceBlogSlugs,
      };
    });

  const dataProducts = Object.entries(coconala)
    .filter(([, listing]) => listing.status === "listed" && Boolean(listing.serviceUrl))
    .map(([id, listing]): StorefrontProduct => {
      const product = productsById.get(id);
      if (!product) throw new Error(`Coconala listing ${id}: ALL_PRODUCTS に定義がありません`);
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

  return [...kindleProducts, ...dataProducts].sort((a, b) =>
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
