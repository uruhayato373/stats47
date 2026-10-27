/**
 * data/products/kindle-status.json (products:kindle:report の出力) の中身。書籍カタログ (book-catalog.ts) の写しなので、
 * 生成元と同じ関数で作り、tests/kindle-status-freshness.test.ts が「ファイル = 現在のカタログから作った値」を固定する
 * (2026-10-27。2026-09-06 生成のまま 5 冊の題名が古く、管理画面のコンテンツ運用が古い題名を出していた)。
 * generatedAt は生成の時刻で、照合しない。
 */
import type { KindleBook } from "./types";
import { validateKindleCatalog } from "./validator";

export function buildKindleStatus(books: readonly KindleBook[], generatedAt: string) {
  const v = validateKindleCatalog(books);
  return {
    generatedAt,
    total: v.counts.total,
    bySeries: v.counts.bySeries,
    byStatus: v.counts.byStatus,
    books: books.map((b) => ({
      id: b.id,
      series: b.series,
      title: b.title,
      status: b.status,
      priceYen: b.priceYen,
      chapters: b.chapters.length,
    })),
  };
}
