import "server-only";

import {
  LOCAL_FINANCE_SET,
  LOCAL_FINANCE_CITY_SET,
} from "@stats47/types";

import { toThemeConfig } from "./lib/to-theme-config";

export { ALL_THEMES } from "./config/all-themes";

export const LOCAL_FINANCE_THEME = {
  ...toThemeConfig(LOCAL_FINANCE_SET),
  // 財政フロー Sankey を着地ビューとして埋め込む (THEME_SECTION_REGISTRY["finance-flow"])
  embeddedSections: ["finance-flow"],
};
export const LOCAL_FINANCE_CITY_THEME = toThemeConfig(LOCAL_FINANCE_CITY_SET);

// Server Component
export { ThemePageLayout } from "./components/ThemePageLayout";
export { ThemeSidebar } from "./components/ThemeSidebar";

// Server-only loader
export { loadThemeData } from "./lib/load-theme-data";
