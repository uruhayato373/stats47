import { ALL_THEMES } from './all-themes';

import type { ThemeConfig } from '../types';

/** テーマの正典 URL を返す。既定は `/themes/{themeKey}`。 */
export function themeHref(themeKey: string): string {
  return `/themes/${themeKey}`;
}

/** グローバルナビに出すテーマ一覧 (ALL_THEMES を SSOT に導出)。 */
export const NAV_THEMES: ThemeConfig[] = ALL_THEMES;
