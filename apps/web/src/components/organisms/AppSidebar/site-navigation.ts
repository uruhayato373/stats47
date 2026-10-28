/**
 * サイト全体のナビの項目と、現在地の判定。
 *
 * サイドバー (AppSidebar) とフッターが同じ項目を出すので、表示順とラベルを 1 か所で定義する。
 * ラベルは導線ごとに nav_label が割れないよう、ここだけで決める。
 * ブラウザ側の部品も import するので、テーマ定義やランキング定義のような重いデータを読まない
 * (テーマ・カテゴリの一覧はサーバー側の AppSidebar が組み立てて渡す)。
 */
export type SiteNavKey =
  | 'ranking'
  | 'themes'
  | 'areas'
  | 'geo'
  | 'blog';

/**
 * 主要ナビ (表示順・ラベル)。サイトの内容の種類 (ランキング・テーマ・地域・地域分析・ブログ) だけを並べる (2026-10-28 オーナー合意)。
 * - 地域単位 (47都道府県・市区町村) は項目にせず、各ハブの StatisticsScopeNav で切り替える (docs/01_技術設計/03_情報設計.md「地理スコープ」)
 * - 調査 (出典をたどる配線) と地域間比較 (条件を選ぶツール) はサイトの切り口ではないので置かず、フッターから入れる
 */
export const PRIMARY_NAV_ITEMS = [
  { key: 'ranking', href: '/ranking', label: 'ランキング' },
  { key: 'themes', href: '/themes', label: 'テーマ' },
  { key: 'areas', href: '/areas', label: '地域' },
  { key: 'geo', href: '/geo', label: '地域分析' },
  { key: 'blog', href: '/blog', label: '統計ブログ' },
] as const satisfies ReadonlyArray<{
  key: SiteNavKey;
  href: `/${string}`;
  label: string;
}>;

export type PrimaryNavKey = (typeof PRIMARY_NAV_ITEMS)[number]['key'];

export const HOME_NAV_ITEM = { href: '/', label: 'ホーム' } as const;
export const COMPARE_NAV_ITEM = {
  href: '/category/population/compare',
  label: '地域間比較',
} as const;
/** サイドバーには置かず、フッターから入る出典の一覧 */
export const SURVEY_NAV_ITEM = { href: '/survey', label: '調査' } as const;

/**
 * 市区町村の比較ページは、同じ内容の種類の項目を現在地にする (地域単位は内容の中の切り口)。
 * 市区町村ページ (/areas/<県>/cities/<市>) は前方一致で「地域」になる。
 */
const SCOPE_PATH_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/municipalities\/themes(?:\/|$)/, '/themes'],
  [/^\/municipalities(?:\/|$)/, '/ranking'],
];

function resolveScopeAlias(pathname: string): string {
  return SCOPE_PATH_ALIASES.find(([pattern]) => pattern.test(pathname))?.[1] ?? pathname;
}

function normalize(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

function matches(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 現在地に対応するナビ項目の href を 1 つだけ返す (無ければ null)。
 * 前方一致する項目のうち最も長い href を選ぶので、/category/laborwage ではカテゴリの項目だけ、
 * /ranking/annual-income ではランキングの項目だけが現在地になる。ホームは完全一致だけ。
 */
export function getActiveSidebarHref(
  pathname: string,
  hrefs: readonly string[]
): string | null {
  const path = resolveScopeAlias(normalize(pathname));
  let best: string | null = null;
  for (const href of hrefs) {
    if (!matches(path, href)) continue;
    if (best === null || href.length > best.length) best = href;
  }
  return best;
}
