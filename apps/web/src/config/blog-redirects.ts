import data from '../../../../data/site/url-history/blog-redirects.json';

/**
 * ブログ記事の旧 slug → 新 slug リダイレクトマップ
 *
 * slug 変更時に台帳 `site.blog-redirects` (data/site/url-history/blog-redirects.json) へ足すと
 * middleware.ts で 301 リダイレクトされる。ここは読み込み口。
 * 形式: { "旧slug": "新slug" }
 */
export const BLOG_SLUG_REDIRECTS: Record<string, string> = Object.fromEntries(
  data.redirects.map(({ from, to }) => [from, to]),
);
