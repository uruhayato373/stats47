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

/**
 * 書籍版で持つ章末の「データ出典」節 (ブログ本文の旧節を校閲時の逐語のまま写したもの。直前の空行・区切り線を含む)。
 * ブログ本文の旧節は Web の出典一覧へ移して本文から消すので、書籍は本文の代わりにここから節を戻し
 * (fetch-content.ts の restoreBookSourceSection)、校正指示はこれまでどおり節を含む本文に当てる。
 * 記録は `migrate-data-source-sections.ts --kindle-freeze` が R2 の本文から作る。校閲済みの原文なので手で直さず、
 * 書籍の出典の誤りは corrections で直す。
 */
export const KINDLE_SOURCE_SECTIONS = data.sourceSections as Readonly<Record<string, string>>;

export function correctBookArticle(slug: string, body: string): string {
  for (const correction of KINDLE_EDITORIAL_CORRECTIONS[slug] ?? []) {
    if (body.split(correction.before).length !== 2) {
      throw new Error(`Editorial correction source changed: ${slug}. Re-review the source before generating an edition.`);
    }
    body = body.replace(correction.before, correction.after);
  }
  return body;
}
