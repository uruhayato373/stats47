import { ALL_THEMES } from './all-themes';

import type { ThemeConfig } from '../types';

// ブラウザ側の部品は all-themes を読まない ./theme-href から import する。
export { themeHref } from './theme-href';

/** グローバルナビに出すテーマ一覧 (ALL_THEMES を SSOT に導出)。 */
export const NAV_THEMES: ThemeConfig[] = ALL_THEMES;
