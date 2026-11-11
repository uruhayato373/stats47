/**
 * Kindle 書籍カタログ (SSOT) の読み込み口。
 *
 * 記録の正本は台帳 `products.kindle-books` (data/products/kindle/books.json + Schema) と
 * 地域コードの台帳 `products.kindle-region-codes`。4 シリーズ (S1 論点読み物 / S2 テーマ別データブック /
 * S3 地域別 / S4 ランキング大全) の企画を全登録する。status の意味と blogSlug の契約は Schema の description にある。
 * ここは型を付け、表紙設計 (書籍 ID で結ぶ) と ranking の章のキー (書籍ごとの採否) を結合して export するだけで、記録を持たない。
 */
import type { KindleBook, BookChapter } from "./types";
import { PACK_RANKING_KEYS } from "../../catalog/pack-rankingkeys.generated";
import { BOOK_RANKING_KEYS } from "./book-ranking-keys";
import { coverDesignForBook } from "./cover-design";
import bookData from "../../../../../data/products/kindle/books.json";
import regionData from "../../../../../data/products/kindle/region-codes.json";

type KindleBookDraft = Omit<KindleBook, "coverDesign">;

/** S3 地域別の県コード (選定スクリプトも参照するので export する)。キーは書籍 K-S3-<キー> の接尾辞。 */
export const S3_REGION_CODES: Readonly<Record<string, readonly string[]>> = regionData.regions;

/**
 * ranking の章へキーを結合する。章に載せるキーは書籍ごとの採否 (BOOK_RANKING_KEYS) で確定させる
 * (pack 全件の先頭 24 件ではない)。採否の無い書籍だけ pack の全キーへ degrade する
 * (S2 は sourceIdeas の pack:<パック ID>、それ以外は P-12)。
 * S3 は地域ごとに、その地域が特徴的な指標を選ぶ (全冊同一本文の再発防止) ので、highlightCodes も地域コードから結合する。
 */
function joinRankingChapter(book: Omit<KindleBookDraft, "id">, id: string, chapter: BookChapter): BookChapter {
  if (chapter.source !== "ranking") return chapter;
  const pack = book.sourceIdeas?.find((idea) => idea.startsWith("pack:"))?.slice("pack:".length) ?? "P-12";
  const joined: BookChapter = {
    title: chapter.title,
    source: chapter.source,
    rankingKeys: BOOK_RANKING_KEYS[id] ?? PACK_RANKING_KEYS[pack] ?? [],
  };
  if (chapter.highlightRegionLabel === undefined) return joined;
  return {
    ...joined,
    highlightRegionLabel: chapter.highlightRegionLabel,
    highlightCodes: S3_REGION_CODES[id.slice(-2)] ?? [],
    regionBlockLabel: chapter.regionBlockLabel,
  };
}

const KINDLE_BOOK_DRAFTS: readonly KindleBookDraft[] = Object.entries(
  bookData.books as unknown as Record<string, Omit<KindleBookDraft, "id">>,
).map(([id, book]) => ({
  id,
  ...book,
  chapters: book.chapters.map((chapter) => joinRankingChapter(book, id, chapter)),
}));

/** 全書籍 (SSOT)。表紙設計も同じ安定 ID で必ず結合する。 */
export const KINDLE_BOOKS: readonly KindleBook[] = KINDLE_BOOK_DRAFTS.map((book) => ({
  ...book,
  coverDesign: coverDesignForBook(book.id),
}));

/** 期待シリーズ集合 (validator の二重チェック用)。 */
export const EXPECTED_SERIES: ReadonlySet<KindleBook["series"]> = new Set([
  "S1-issues",
  "S2-theme-databook",
  "S3-region",
  "S4-ranking-compendium",
]);

/** id → book。 */
export const BOOK_BY_ID: ReadonlyMap<string, KindleBook> = new Map(
  KINDLE_BOOKS.map((b) => [b.id, b]),
);
