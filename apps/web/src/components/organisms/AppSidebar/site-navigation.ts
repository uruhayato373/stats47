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
 * - 「地域」はサイドバーでは全国・都道府県・市区町村の 3 段を開閉できる項目にする (REGION_NAV_ITEMS。2026-10-31 オーナー決定。
 *   旧: 地域単位は項目にせず各ハブの切り替えの帯で選んだ。テーマページの帯をパンくずと Sheet に替えたので、地域の階層をメニューにも出す)
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

/**
 * 「地域」の中の 3 段 (全国 › 都道府県 › 市区町村)。パンくずの地域の段と同じ並び (2026-10-31 オーナー決定 IA-REGION-THEME-01)。
 * サイドバーは「地域」を開閉できる項目にし、この 3 つを子に置く。フッターは従来どおり「地域」(/areas) 1 つ。
 */
export const REGION_NAV_ITEMS = [
  { key: 'japan', href: '/japan', label: '全国' },
  { key: 'prefectures', href: '/areas', label: '都道府県' },
  { key: 'municipalities', href: '/municipalities', label: '市区町村' },
] as const;

export const HOME_NAV_ITEM = { href: '/', label: 'ホーム' } as const;
export const COMPARE_NAV_ITEM = {
  href: '/category/population/compare',
  label: '地域間比較',
} as const;
/** サイドバーには置かず、フッターから入る出典の一覧 */
export const SURVEY_NAV_ITEM = { href: '/survey', label: '調査' } as const;

/**
 * 地域の 3 段 (全国・都道府県・市区町村) のどれを現在地にするか (2026-10-31)。
 * 市区町村の比較 (/municipalities/*)・市区町村のページ (/areas/<県>/cities/<市>…)・県内の市区町村の比較
 * (/areas/<県>/<テーマ>/cities) は「市区町村」。全国のテーマ (/japan/*) は前方一致で「全国」、それ以外の /areas/* は「都道府県」。
 * (旧: 市区町村の比較はテーマ・ランキングを現在地にしていた。地域の段をメニューに出したので地域の段に寄せる)
 */
const SCOPE_PATH_ALIASES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/areas\/\d{5}\/(?:cities\/|[^/]+\/cities(?:\/|$))/, '/municipalities'],
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
