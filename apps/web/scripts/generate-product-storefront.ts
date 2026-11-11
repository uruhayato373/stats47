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
import { datasetPath } from "../../../config/datasets.mjs";
import { KDP_LISTINGS } from "../../../config/paths.mjs";
import { ALL_PRODUCTS } from "../../../packages/product-factory/src/catalog/products";
import { KINDLE_BOOKS } from "../../../packages/product-factory/src/channels/kindle/book-catalog";
import { NOTE_PRODUCT_MAPPINGS } from "../../../packages/product-factory/src/channels/note/product-note-mapping";

import { selectLiveKindleEdition, type KindleStorefrontListing } from "./lib/kindle-storefront";

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
const STANDALONE_NOTE_PRODUCTS = [
  {
    articleKey: "muni-manufacturing-shipment-data",
    id: "MUNI-MANUFACTURING",
    description: "市区町村別の製造品出荷額等を 1980〜2023 年の時系列と 2021〜2023 年の業種別 (産業中分類 24 業種) でそろえ、最新の境界の地図データと結合して使う",
    included: ["CSV (時系列 1980〜2023 年・1,719 自治体)", "CSV (業種別 2021〜2023 年・24 業種)", "GeoJSON (自治体の境界)", "README・検算表"],
    audience: ["自治体の企画・産業振興担当", "立地調査・地域分析の担当", "研究者"],
    // 図は記事の figure-specs.json から render-product-figures.ts が型で描き、公開 R2 の showcase/ へ置いたもの
    showcase: [
      {
        heading: "比べる：自治体の規模の順位と地図",
        lead: "2023 年は豊田市が 20 兆 5,272 億円で、2 位の倉敷市の約 3.7 倍です。同じ年の値を自治体コードで境界に結合すれば、全国の地図にも、県の中の地図にもなります。",
        figures: [
          { file: "compare-bars-2023.png", alt: "製造品出荷額等の上位と下位の自治体（2023年）" },
          { file: "compare-map-2023.png", alt: "製造品出荷額等の色分け地図（2023年・市区町村別）" },
          { file: "aichi-map-2023.png", alt: "愛知県の製造品出荷額等（2023年）" },
        ],
      },
      {
        heading: "構成を見る：業種別の内訳と県内の割合",
        lead: "業種別の表で、自治体の製造業がどの業種に頼っているかが分かります。豊田市は輸送用機械が 93.4% を占め、倉敷市は石油製品・鉄鋼・化学、市原市は石油製品と化学で約 9 割です。",
        figures: [
          { file: "industry-donut-toyota-2023.png", alt: "豊田市の製造品出荷額等の業種別内訳（2023年）" },
          { file: "industry-mix-3cities-2023.png", alt: "上位3市の業種構成（2023年）" },
          { file: "structure-aichi-treemap-2023.png", alt: "愛知県の製造品出荷額等の内訳（2023年・54市町村）" },
          { file: "structure-share-map-2023.png", alt: "県内の合計に占める割合（2023年・市区町村別）" },
        ],
      },
      {
        heading: "変化を見る：44 年の推移",
        lead: "1980 年に 1 位だった東京都特別区部を、豊田市は 2002 年に上回りました。1980 年と 2023 年を比べた倍率も地図にできます (物価で直していない名目の値)。",
        figures: [
          { file: "change-trend-1980-2023.png", alt: "製造品出荷額等の推移（1980〜2023年）" },
          { file: "change-ratio-map-1980-2023.png", alt: "1980年→2023年で何倍か（市区町村別）" },
        ],
      },
      {
        heading: "ファイルの中身",
        lead: "CSV は自治体コード・年・値の形で、業種別は業種コードと業種名の列が加わります。値が空の行には、秘匿などの理由を注記の列に書いています。",
        figures: [
          { file: "file-preview-toyota.png", alt: "時系列のCSVの中身（豊田市の行の一部）" },
          { file: "file-preview-industry-kurashiki.png", alt: "業種別のCSVの中身（倉敷市・2023年の一部）" },
        ],
      },
    ],
  },
] as const;

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function buildStorefrontProducts(): StorefrontProduct[] {
  const kdp = readJson<KdpListingsFile>(KDP_LISTINGS_PATH).listings;

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
  const standaloneProducts: StorefrontProduct[] = STANDALONE_NOTE_PRODUCTS.flatMap((item): StorefrontProduct[] => {
    const article = noteArticles.find((candidate) => candidate.key === item.articleKey);
    if (!article || article.status !== "published" || !article.isPaid || !article.noteUrl || !article.priceJpy) return [];
    return [{
      id: item.id,
      slug: `data-${item.id.toLowerCase()}`,
      channel: "note",
      channelLabel: "note有料データ集",
      title: article.title,
      description: item.description,
      priceYen: article.priceJpy,
      externalUrl: article.noteUrl,
      included: [...item.included],
      audience: [...item.audience],
      sourceBlogSlugs: [],
      ...("showcase" in item ? { showcase: item.showcase.map((section) => ({ ...section, figures: section.figures.map((figure) => ({ ...figure })) })) } : {}),
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
