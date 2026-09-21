/**
 * Kindle 書籍カタログの決定的 validator (オフライン)。
 * R2 実在チェックはネットワーク依存のため generate 時に行う (ここでは構造整合のみ)。
 */
import type { KindleBook, BookStatus, EditorialDesign, TitleType } from "./types";
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

/** STRUCTURE.md「タイトルの型」の機械上限 (目標 32 字)。 */
const TITLE_LIMIT: Record<TitleType, number> = {
  "検索・選択": 36,
  "数字・チェック": 36,
  "実証・体験": 42,
  "問い・気づき": 42,
  "資料・手順": 60,
};
const TITLE_TYPES = new Set<string>(Object.keys(TITLE_LIMIT));
const BODY_PATTERNS = new Set<string>([
  "悩み直撃型", "勘違い破壊型", "Before→After型", "失敗談→教訓型", "ロードマップ型",
  "チェックリスト型", "比較型", "ケーススタディ型", "販売導線型",
]);

/**
 * 編集設計の内容検査。空文字・分類だけ・1 案だけ、を弾く (共通事業方針「分類しただけで需要ありと判定しない」)。
 */
export function validateEditorialDesign(b: KindleBook, d: EditorialDesign, errors: KindleIssue[], warnings: KindleIssue[]): void {
  const ref = b.id;
  if (d.readerProblem.trim().length < 20) errors.push({ level: "error", code: "design-reader-problem", ref, message: `design.readerProblem が短い (20 字以上・読者の言葉で悩みを書く)` });
  if (d.harm.length === 0 && d.harmReason.trim().length < 10) errors.push({ level: "error", code: "design-harm-reason", ref, message: `HARM 対象外なら harmReason に理由を 10 字以上書く` });
  if (d.harm.length > 0 && d.harmReason.trim().length < 10) errors.push({ level: "error", code: "design-harm-reason", ref, message: `HARM を付けた理由を harmReason に 10 字以上書く` });
  if (d.valueAndPayReason.trim().length < 20) errors.push({ level: "error", code: "design-pay-reason", ref, message: `design.valueAndPayReason が短い (無料で得られる価値と有料で支払う理由を書く)` });
  if (d.demandEvidence.trim().length < 10) errors.push({ level: "error", code: "design-demand", ref, message: `design.demandEvidence が空 (証拠が無ければ「未検証:」で始めて次の検証を書く)` });
  if (d.titleCandidates.length !== 2) errors.push({ level: "error", code: "design-title-candidates", ref, message: `titleCandidates は異なる 2 型で 2 案 (実際 ${d.titleCandidates.length})` });
  const types = new Set(d.titleCandidates.map((t) => t.type));
  if (d.titleCandidates.length === 2 && types.size !== 2) errors.push({ level: "error", code: "design-title-types", ref, message: `titleCandidates の 2 案は異なる型にする` });
  for (const t of d.titleCandidates) {
    if (!TITLE_TYPES.has(t.type)) errors.push({ level: "error", code: "design-title-type-unknown", ref, message: `未知のタイトル型: ${t.type}` });
    const limit = TITLE_LIMIT[t.type];
    if (limit && t.title.length > limit) warnings.push({ level: "warn", code: "design-title-long", ref, message: `「${t.title}」は ${t.type} の上限 ${limit} 字を超える (${t.title.length} 字)` });
  }
  if (!d.titleCandidates.some((t) => t.title === b.title)) errors.push({ level: "error", code: "design-title-mismatch", ref, message: `title はタイトル案のどちらかと一致させる (採用した型を残す)` });
  if (d.bodyPatterns.length === 0) errors.push({ level: "error", code: "design-body-patterns", ref, message: `bodyPatterns を 1 つ以上` });
  for (const p of d.bodyPatterns) if (!BODY_PATTERNS.has(p)) errors.push({ level: "error", code: "design-body-pattern-unknown", ref, message: `未知の本文型: ${p}` });
}

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

    // 編集設計。manuscript 以降で無ければ警告 (generate は design 無しを拒否する)。
    const needsMaterial = NEEDS_MATERIAL.has(b.status);
    if (b.design) validateEditorialDesign(b, b.design, errors, warnings);
    else if (needsMaterial) warnings.push({ level: "warn", code: "design-missing", ref, message: `design (読者の悩み・HARM・支払う理由・需要の証拠・タイトル型) が無い。generate できない` });

    // 素材整合。manuscript 以降は EPUB を生成できる状態でなければならない。
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
