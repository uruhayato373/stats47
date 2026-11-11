import data from '../../../../data/site/url-history/gone-blog-slugs.json';

/**
 * 完全削除済みのブログ slug 一覧 (middleware が 410 Gone を返す)
 *
 * 記録の正本は台帳 `site.gone-blog-slugs` (data/site/url-history/gone-blog-slugs.json)。ここは読み込み口。
 * 対象外: 一時 unpublished (404 のまま)・slug rename (301 は `BLOG_SLUG_REDIRECTS`)
 */
export const GONE_BLOG_SLUGS = new Set<string>(data.slugs.map(({ slug }) => slug));
