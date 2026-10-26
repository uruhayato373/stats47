/**
 * note 展開のリリース台帳 (機械状態)。
 * `data/products/note-catalog-status.json` に再生成する。draft の有無・添付・未検証を集約する。
 * 購入者情報は保存しない。
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_ARTICLES } from "../article-plan";
import { NOTE_PRODUCT_MAPPINGS } from "../product-note-mapping";
import { validateNoteChannel } from "../validators";
import { datasetDir, datasetPath } from "../../../../../../config/datasets.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const STATE_PATH_DEFAULT = resolve(REPO_ROOT, `${datasetDir("products.publication-receipts")}/note-catalog-status.json`);
const NOTE_OUT_ROOT = resolve(REPO_ROOT, ".local/note-products");

export function writeNoteReport(statePath: string = STATE_PATH_DEFAULT): string {
  const validation = validateNoteChannel();
  const ledger = JSON.parse(readFileSync(resolve(REPO_ROOT, datasetPath('note.articles')), 'utf8')) as {
    articles: Array<{ key: string; status: string; noteUrl: string | null; priceJpy?: number; publicationVerifiedAt?: string }>;
  };
  const published = new Map(ledger.articles.filter((a) => a.status === 'published' && a.noteUrl).map((a) => [a.key, a]));
  const dispositions: Record<string, number> = {};
  for (const m of NOTE_PRODUCT_MAPPINGS) {
    dispositions[m.disposition] = (dispositions[m.disposition] ?? 0) + 1;
  }
  const articles = CANONICAL_ARTICLES.map((a) => {
    const draftDir = join(NOTE_OUT_ROOT, a.series, a.slug);
    const live = published.get(a.slug);
    return {
      slug: a.slug,
      series: a.series,
      access: a.access,
      role: a.role,
      priceJpy: live?.priceJpy ?? a.priceJpy,
      publicationStatus: live ? 'published-recorded' : 'not-published',
      noteUrl: live?.noteUrl ?? null,
      publicationVerifiedAt: live?.publicationVerifiedAt ?? null,
      memberCount: a.memberProductIds.length,
      draftGenerated: existsSync(join(draftDir, "draft.md")),
    };
  });
  const payload = {
    generatedNote:
      "note展開の派生台帳。公開状態・価格・URLは記事台帳、ローカル準備物の有無はdraftGeneratedとして別に記録する。products:note:reportで再生成する。",
    totals: {
      products: NOTE_PRODUCT_MAPPINGS.length,
      canonicalArticles: CANONICAL_ARTICLES.length,
      coverage: validation.coverage,
      dispositions,
      validationOk: validation.ok,
      errors: validation.errors.length,
      warnings: validation.warnings.length,
      draftsGenerated: articles.filter((a) => a.draftGenerated).length,
      publishedArticles: articles.filter((a) => a.publicationStatus === 'published-recorded').length,
      publishedPaidArticles: articles.filter((a) => a.publicationStatus === 'published-recorded' && a.access === 'paid').length,
    },
    articles,
  };
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(payload, null, 2) + "\n");
  return statePath;
}
