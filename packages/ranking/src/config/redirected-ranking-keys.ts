import data from '../../../../data/site/url-history/ranking-redirects.json';

/**
 * 転送したランキングのキー (301)。この台帳にあるキーは**ランキングのページを持たない**。
 *
 * 指標の定義とデータは有効のまま残り、テーマ・県ページ・商品・相関が使い続ける。ページの一覧・
 * KNOWN・サイトマップ・検索からだけ外す (2026-11-25 オーナー決定: 同じ指標の見方違いの 118 ページを
 * 親のページの計算方法へ統合した。それまでは見方を上段の計算方法と別ページの 2 か所に持てた)。
 *
 * 記録の正本は台帳 `site.ranking-redirects` (data/site/url-history/ranking-redirects.json)。ここは読み込み口。
 */
export const REDIRECTED_RANKING_KEYS = new Set<string>(
  (data.redirects as Array<{ from: string }>).map(({ from }) => from),
);
