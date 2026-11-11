import data from '../../../../data/site/url-history/ranking-redirects.json';

/**
 * 公開後に置き換えられた旧 ranking slug の恒久転送先。
 *
 * X・外部記事に残る旧 URL を、同じ統計定義の現行ページへ一段で 301 する。
 * 転送先は KNOWN かつ非 GONE であることをテストで固定する。
 * 記録の正本は台帳 `site.ranking-redirects` (data/site/url-history/ranking-redirects.json)。ここは読み込み口。
 */
export const RANKING_SLUG_REDIRECTS: Readonly<Record<string, string>> = Object.fromEntries(
  data.redirects.map(({ from, to }) => [from, to]),
);
