/**
 * 全 canonical 記事のドラフト一括生成 (仕様 N3)。
 * `.local/note-products/` へドラフトを書き出すだけ。promote・公開・note.com 操作はしない。
 */
import type { NoteArticlePlan } from "../types";
import type { ProductDefinition } from "../../../catalog/types";
import { CANONICAL_ARTICLES } from "../article-plan";
import { ALL_PRODUCTS } from "../../../catalog/products";
import { buildNoteArticle, type NoteBuildOptions, type NoteBuildResult } from "./build-note";

export interface BuildAllNoteOptions extends NoteBuildOptions {
  readonly onProgress?: (done: number, total: number, res: NoteBuildResult) => void;
}

export function buildAllNoteArticles(
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  opts: BuildAllNoteOptions = {},
): NoteBuildResult[] {
  const results: NoteBuildResult[] = [];
  let done = 0;
  for (const article of articles) {
    const res = buildNoteArticle(article, products, opts);
    results.push(res);
    done += 1;
    opts.onProgress?.(done, articles.length, res);
  }
  return results;
}
