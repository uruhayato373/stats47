/**
 * モバイルナビのセクション識別色（見分けるための配色）。
 * 意味を持つ状態色ではないため、生パレットはこのモジュールにだけ置く。
 */
export const NAV_ACCENT_PALETTE = {
  home: 'bg-muted text-muted-foreground',
  ranking: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
  areas:
    'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  municipalities:
    'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  geo: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  blog: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
  compare: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  search: 'bg-muted text-muted-foreground',
} as const satisfies Record<string, string>;

export type NavAccentKey = keyof typeof NAV_ACCENT_PALETTE;
