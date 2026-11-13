import data from "../../../../../data/products/kindle/editorial-corrections.json";

/** Edition-only corrections. Public blog originals are not mutated by book generation. */
export interface EditorialCorrection {
  readonly before: string;
  readonly after: string;
  readonly reason: string;
}

/**
 * Kindle 各冊の全章独立レビューを反映した書籍版だけの校訂。記録の正本は台帳 `products.kindle-editorial-corrections`
 * (data/products/kindle/editorial-corrections.json + Schema)。ここは型を付けて export するだけ。
 * before は R2 article.md の逐語。1 回だけ現れることを correctBookArticle が保証する。
 */
export const KINDLE_EDITORIAL_CORRECTIONS = data.corrections as Readonly<Record<string, readonly EditorialCorrection[]>>;

export function correctBookArticle(slug: string, body: string): string {
  for (const correction of KINDLE_EDITORIAL_CORRECTIONS[slug] ?? []) {
    if (body.split(correction.before).length !== 2) {
      throw new Error(`Editorial correction source changed: ${slug}. Re-review the source before generating an edition.`);
    }
    body = body.replace(correction.before, correction.after);
  }
  return body;
}
