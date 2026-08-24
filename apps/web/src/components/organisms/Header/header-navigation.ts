export type HeaderNavKey =
  | 'ranking'
  | 'category'
  | 'areas'
  | 'municipalities'
  | 'themes'
  | 'blog';

const ROUTES: ReadonlyArray<{
  key: HeaderNavKey;
  root: `/${string}`;
}> = [
  { key: 'ranking', root: '/ranking' },
  { key: 'category', root: '/category' },
  { key: 'areas', root: '/areas' },
  { key: 'municipalities', root: '/municipalities' },
  { key: 'themes', root: '/themes' },
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
