export type HeaderNavKey =
  | 'ranking'
  | 'category'
  | 'areas'
  | 'municipalities'
  | 'themes'
  | 'geo'
  | 'blog';

/**
 * デスクトップヘッダーとモバイルドロワーが共有する主要ナビ (表示順・ラベル)。
 * ラベルは surface 間で nav_label が割れないよう 1 か所で定義する。
 * アイコン・色などの表示固有の値は各コンポーネント側に置く。
 */
export const PRIMARY_NAV_ITEMS = [
  { key: 'ranking', href: '/ranking', label: 'ランキング' },
  { key: 'areas', href: '/areas', label: '都道府県' },
  { key: 'municipalities', href: '/municipalities', label: '市区町村' },
  { key: 'geo', href: '/geo', label: '地域分析' },
  { key: 'blog', href: '/blog', label: '統計ブログ' },
] as const satisfies ReadonlyArray<{
  key: HeaderNavKey;
  href: `/${string}`;
  label: string;
}>;

export type PrimaryNavKey = (typeof PRIMARY_NAV_ITEMS)[number]['key'];

const ROUTES: ReadonlyArray<{
  key: HeaderNavKey;
  root: `/${string}`;
}> = [
  { key: 'ranking', root: '/ranking' },
  { key: 'category', root: '/category' },
  { key: 'areas', root: '/areas' },
  { key: 'municipalities', root: '/municipalities' },
  { key: 'themes', root: '/themes' },
  { key: 'geo', root: '/geo' },
  { key: 'blog', root: '/blog' },
];

function isRoute(pathname: string, root: string): boolean {
  return pathname === root || pathname.startsWith(`${root}/`);
}

/**
 * 現在地に対応するヘッダー項目を1つだけ返す。
 * カテゴリをランキングの別名として扱わず、各URL空間を排他的に判定する。
 */
export function getActiveHeaderNav(pathname: string): HeaderNavKey | null {
  return ROUTES.find(({ root }) => isRoute(pathname, root))?.key ?? null;
}
