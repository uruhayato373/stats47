import popularArticles from '../../../../../../data/blog/popular-articles.json';

/**
 * 「よく読まれている記事」の順 (閲覧数の多い順)。
 *
 * 2026-11-12 から GA4 の直近 28 日の日本の閲覧数で週次に選ぶ (data/blog/popular-articles.json。
 * 書き手は .claude/scripts/metrics/fetch-popular-blog-articles.mjs)。それまでは 2026-08-28 に手で選んだ 3 記事だった。
 * ブログ一覧は上位 3 件、記事ページの右レールは自分を除く上位 5 件を出す。非公開・削除済みの slug は reader が除く。
 */
export const POPULAR_BLOG_ARTICLE_SLUGS: readonly string[] = popularArticles.articles.map((article) => article.slug);
