import "server-only";

export { ALL_THEMES } from "./config/all-themes";

// Server Component
export { ThemePageLayout } from "./components/ThemePageLayout";
export { ThemeIndicatorCatalogSection } from "./components/ThemeIndicatorCatalogSection";

// Client Component（テーマ切替）。bespoke ページが barrel 経由で使うため再 export する
// （app 層からの feature/components 直 import は no-restricted-imports で禁止）。
export { ThemeSwitcher } from "./components/ThemeSwitcher";
export { ThemeSideNav } from "./components/ThemeSideNav";

// Server-only loader
export { loadThemeData } from "./lib/load-theme-data";
export {
  THEME_PREFECTURE_COOKIE_NAME,
  resolveInitialThemePrefecture,
} from "./lib/theme-prefecture-preference";
