/**
 * 書籍ごとに載せる ranking キーと、『日本国勢図会』の論点の接続結果。
 *
 * 記録の正本は台帳 `products.kindle-book-ranking-keys` (data/products/kindle/book-ranking-keys.json + Schema)。
 * 選定の理由と基準、更新の手順は Schema の description と、キーごとの選定理由 (JSON の notes) にある。
 * ここは型を付けて export するだけ。
 */
import data from "../../../../../data/products/kindle/book-ranking-keys.json";

export const BOOK_RANKING_KEYS: Readonly<Record<string, readonly string[]>> = data.books;

export const JAPAN_ZUE_KINDLE_COVERAGE = data.japanZueCoverage;
