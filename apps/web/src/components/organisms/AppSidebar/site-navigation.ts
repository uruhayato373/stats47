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
  | 'areas'
  | 'municipalities'
  | 'geo'
  | 'survey'
  | 'blog';

/** 主要ナビ (表示順・ラベル)。 */
export const PRIMARY_NAV_ITEMS = [
  { key: 'ranking', href: '/ranking', label: 'ランキング' },
  { key: 'areas', href: '/areas', label: '都道府県' },
  { key: 'municipalities', href: '/municipalities', label: '市区町村' },
  { key: 'geo', href: '/geo', label: '地域分析' },
  { key: 'survey', href: '/survey', label: '調査' },
  { key: 'blog', href: '/blog', label: '統計ブログ' },
] as const satisfies ReadonlyArray<{
  key: SiteNavKey;
  href: `/${string}`;
  label: string;
}>;

export type PrimaryNavKey = (typeof PRIMARY_NAV_ITEMS)[number]['key'];

/**
 * サイドバーのグループ名の見た目。テンプレートの nav-collapse の見出しと同じ。
 * サーバー側の AppSidebar と 'use client' の AppSidebarClient の両方が使うので、client 境界の外 (ここ) に置く。
 */
export const SIDEBAR_GROUP_LABEL_CLASS = 'text-xs font-semibold uppercase text-muted-foreground';

export const HOME_NAV_ITEM ={ href: '/', label: 'ホーム' } as const;
export const COMPARE_NAV_ITEM = {
  href: '/category/population/compare',
  label: '地域間比較',
} as const;
export const ALL_THEMES_NAV_ITEM = { href: '/themes', label: 'すべてのテーマ' } as const;

/** 市区町村ページは URL が /areas の下にあるが、見ているのは市区町村の空間 (2026-09-25 UI 点検の指摘)。 */
const CITY_PAGE_PATH = /^\/areas\/\d{5}\/cities(?:\/|$)/;

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
  const path = CITY_PAGE_PATH.test(pathname) ? '/municipalities' : normalize(pathname);
  let best: string | null = null;
  for (const href of hrefs) {
    if (!matches(path, href)) continue;
    if (best === null || href.length > best.length) best = href;
  }
  return best;
}
