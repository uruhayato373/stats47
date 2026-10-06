/**
 * ブログ記事の R2 キー (先頭スラッシュ無し) を組み立てる最小 entrypoint (client-safe・依存なし)。
 *
 * 記事本文・図データ・source.json・OGP・サムネイルはすべて `app/blog/<slug>/` 配下に置く。
 * 依存を持たないので lib/metadata や API route からも barrel を経由せずに読める。
 *
 * @example blogR2Key("population-change", "data/chart.json") // "app/blog/population-change/data/chart.json"
 */
export function blogR2Key(slug: string, file: string): string {
  return `app/blog/${slug}/${file}`;
}
