import 'server-only';

import { ALL_THEMES } from './all-themes';
import { isAreaTheme } from './area-theme-slugs';

import type { ThemeSwitcherTheme } from '../components/ThemeSwitcher';

/**
 * テーマ切替とサイドナビへ渡す一覧 (ALL_THEMES を SSOT に導出)。
 * ブラウザ側の部品が ALL_THEMES を直接読むと、全テーマの指標定義 (本番ビルドで 324KB のチャンク) が
 * 各テーマページに入るので、サーバーで名前とキーだけにして props で渡す (2026-10-21)。
 */
export const THEME_SWITCHER_THEMES: ThemeSwitcherTheme[] = ALL_THEMES.map((theme) => ({
  themeKey: theme.themeKey,
  title: theme.title,
  isAreaTheme: isAreaTheme(theme.themeKey),
}));
