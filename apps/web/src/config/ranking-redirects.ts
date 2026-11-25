import data from '../../../../data/site/url-history/ranking-redirects.json';

/**
 * 公開後に置き換えられた旧 ranking slug の恒久転送先。
 *
 * X・外部記事に残る旧 URL を、同じ統計定義の現行ページへ一段で 301 する。
 * 転送先は KNOWN かつ非 GONE であることをテストで固定する。
 * 記録の正本は台帳 `site.ranking-redirects` (data/site/url-history/ranking-redirects.json)。ここは読み込み口。
 *
 * 台帳にある from は**ランキングのページを持たない** (指標とデータは有効のままで、テーマ・県ページ・商品が使う)。
 * 同じ指標の見方違いのページは 2026-11-25 に親のページの計算方法へ統合し、norm で転送先の見方を開く。
 */
type RankingRedirect = { from: string; to: string; norm?: string };

export const RANKING_SLUG_REDIRECTS: Readonly<Record<string, string>> = Object.fromEntries(
  (data.redirects as RankingRedirect[]).map(({ from, to }) => [from, to]),
);

/** 転送先で開く計算方法 (?norm=)。見方違いのページを統合した行だけが持つ */
export const RANKING_REDIRECT_NORMS: Readonly<Record<string, string>> = Object.fromEntries(
  (data.redirects as RankingRedirect[]).flatMap(({ from, norm }) => (norm ? [[from, norm]] : [])),
);

/** 旧 slug の転送先の URL (パスと ?norm=)。元の query (UTM など) は残す */
export function rankingRedirectUrl(fromKey: string, base: URL, search = ''): URL | null {
  const to = RANKING_SLUG_REDIRECTS[fromKey];
  if (!to) return null;
  const url = new URL('/ranking/' + to, base);
  url.search = search;
  const norm = RANKING_REDIRECT_NORMS[fromKey];
  if (norm) url.searchParams.set('norm', norm);
  return url;
}
