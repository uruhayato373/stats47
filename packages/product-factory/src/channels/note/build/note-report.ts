/**
 * note 展開のリリース台帳 (機械状態)。
 * `.claude/state/products/note-catalog-status.json` に再生成する。draft の有無・添付・未検証を集約する。
 * 購入者情報は保存しない。
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CANONICAL_ARTICLES } from "../article-plan";
import { NOTE_PRODUCT_MAPPINGS } from "../product-note-mapping";
import { validateNoteChannel } from "../validators";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const STATE_PATH_DEFAULT = resolve(REPO_ROOT, ".claude/state/products/note-catalog-status.json");
const NOTE_OUT_ROOT = resolve(REPO_ROOT, ".local/note-products");

export function writeNoteReport(statePath: string = STATE_PATH_DEFAULT): string {
  const validation = validateNoteChannel();
  const dispositions: Record<string, number> = {};
  for (const m of NOTE_PRODUCT_MAPPINGS) {
    dispositions[m.disposition] = (dispositions[m.disposition] ?? 0) + 1;
  }
  const articles = CANONICAL_ARTICLES.map((a) => {
    const draftDir = join(NOTE_OUT_ROOT, a.series, a.slug);
    return {
      slug: a.slug,
      series: a.series,
      access: a.access,
      role: a.role,
      priceJpy: a.priceJpy,
      memberCount: a.memberProductIds.length,
      draftGenerated: existsSync(join(draftDir, "draft.md")),
    };
  });
  const payload = {
    generatedNote:
      "note 展開の機械状態。draft は .local (git 管理外)。公開は人間承認後 (N4+)。この JSON は products:note:report で再生成する。",
    totals: {
      products: NOTE_PRODUCT_MAPPINGS.length,
      canonicalArticles: CANONICAL_ARTICLES.length,
      coverage: validation.coverage,
      dispositions,
      validationOk: validation.ok,
      errors: validation.errors.length,
      warnings: validation.warnings.length,
      draftsGenerated: articles.filter((a) => a.draftGenerated).length,
    },
    articles,
  };
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(payload, null, 2) + "\n");
  return statePath;
}
