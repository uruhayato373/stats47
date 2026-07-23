/**
 * Kindle 書籍カタログの決定的 validator (オフライン)。
 * R2 実在チェックはネットワーク依存のため generate 時に行う (ここでは構造整合のみ)。
 */
import type { KindleBook, BookStatus } from "./types";
import { KINDLE_BOOKS, EXPECTED_SERIES } from "./book-catalog";

export interface KindleIssue {
  readonly level: "error" | "warn";
  readonly code: string;
  readonly ref: string;
  readonly message: string;
}

export interface KindleValidation {
  readonly ok: boolean;
  readonly errors: readonly KindleIssue[];
  readonly warnings: readonly KindleIssue[];
  readonly counts: {
    readonly total: number;
    readonly bySeries: Record<string, number>;
    readonly byStatus: Record<string, number>;
  };
}

const ID_RE = /^K-S([1-4])-\d{2}$/;
const ALLOWED_PRICES = new Set([0, 500, 800, 1000]);
const SERIES_PREFIX: Record<string, string> = {
  "S1-issues": "K-S1-",
  "S2-theme-databook": "K-S2-",
  "S3-region": "K-S3-",
  "S4-ranking-compendium": "K-S4-",
};
/** chapters・素材の実体が要求される status (manuscript 以降は EPUB 生成可能でなければならない)。 */
const NEEDS_MATERIAL: ReadonlySet<BookStatus> = new Set<BookStatus>(["manuscript", "generated", "published"]);

export function validateKindleCatalog(books: readonly KindleBook[] = KINDLE_BOOKS): KindleValidation {
  const errors: KindleIssue[] = [];
  const warnings: KindleIssue[] = [];
  const seen = new Set<string>();

  for (const b of books) {
    const ref = b.id;
    if (!ID_RE.test(b.id)) errors.push({ level: "error", code: "id-format", ref, message: `id は ^K-S[1-4]-\\d{2}$ の形式にする` });
    if (seen.has(b.id)) errors.push({ level: "error", code: "id-dup", ref, message: `id が重複している` });
    seen.add(b.id);

    if (!EXPECTED_SERIES.has(b.series)) errors.push({ level: "error", code: "series-unknown", ref, message: `未知の series: ${b.series}` });
    const wantPrefix = SERIES_PREFIX[b.series];
    if (wantPrefix && !b.id.startsWith(wantPrefix)) {
      errors.push({ level: "error", code: "series-id-mismatch", ref, message: `series=${b.series} なら id は ${wantPrefix}NN` });
    }

    if (!ALLOWED_PRICES.has(b.priceYen)) errors.push({ level: "error", code: "price", ref, message: `priceYen は 0/500/800/1000 のいずれか (実際: ${b.priceYen})` });
    if (!b.title.trim()) errors.push({ level: "error", code: "title-empty", ref, message: `title が空` });
    if (b.title.length > 60) warnings.push({ level: "warn", code: "title-long", ref, message: `title が 60 字超 (${b.title.length}字)・KDP 表示で切れる恐れ` });
    if (!b.newContentNote.trim()) errors.push({ level: "error", code: "new-content-note", ref, message: `newContentNote が空 (KDP の Web 公開コンテンツ規定対応・書き下ろし宣言が必須)` });
    if (b.keywords.length === 0) errors.push({ level: "error", code: "keywords-empty", ref, message: `keywords が空` });

    // 素材整合。manuscript 以降は EPUB を生成できる状態でなければならない。
    const needsMaterial = NEEDS_MATERIAL.has(b.status);
    if (needsMaterial && b.chapters.length === 0) {
      errors.push({ level: "error", code: "chapters-empty", ref, message: `status=${b.status} は章立てが必須` });
    }
    if (needsMaterial) {
      let hasFresh = false;
      for (const [i, ch] of b.chapters.entries()) {
        const cref = `${ref}#${i + 1}`;
        if (ch.source === "blog" && !ch.blogSlug) errors.push({ level: "error", code: "chapter-blogslug", ref: cref, message: `blog 章に blogSlug が無い` });
        if (ch.source === "fresh") {
          hasFresh = true;
          if (!ch.freshText?.trim() && !ch.freshFile?.trim()) {
            errors.push({ level: "error", code: "chapter-freshtext", ref: cref, message: `fresh 章に freshText / freshFile が無い` });
          }
        }
        if (ch.source === "ranking" && (!ch.rankingKeys || ch.rankingKeys.length === 0) && !ch.freshText) {
          warnings.push({ level: "warn", code: "chapter-ranking-empty", ref: cref, message: `ranking 章に rankingKeys も freshText も無い (generate 時に空になる)` });
        }
      }
      // 30% 書き下ろしルールの構造的担保: manuscript 以降は fresh 章が最低 1 つ必要。
      if (!hasFresh) {
        errors.push({ level: "error", code: "no-fresh-chapter", ref, message: `status=${b.status} は書き下ろし (fresh) 章が最低 1 つ必要 (30% ルール)` });
      }
    }
  }

  const bySeries: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  for (const b of books) {
    bySeries[b.series] = (bySeries[b.series] ?? 0) + 1;
    byStatus[b.status] = (byStatus[b.status] ?? 0) + 1;
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: { total: books.length, bySeries, byStatus },
  };
}
