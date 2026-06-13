/**
 * モバイルナビゲーションドロワー（Server Component）
 *
 * curated テーマ一覧 (ALL_THEMES) を MobileNavDrawerClient に渡す。
 * category は内部 backbone に降格し、主要ナビ (ドロワー) には出さない
 * (役割分担: docs/01_技術設計/11_情報設計.md)。
 * PC では client 側が `return null` するため描画コストはほぼゼロ。
 * `cookies()` / `headers()` は呼ばない（SSG 維持）。
 *
 * 設計仕様: docs/01_技術設計/21_統一レイアウト設計.md
 */
import { ALL_THEMES } from "@/features/theme-dashboard/server";

import { MobileNavDrawerClient } from "./MobileNavDrawerClient";

export function MobileNavDrawer() {
  const themes = ALL_THEMES.map((t) => ({ themeKey: t.themeKey, title: t.title }));

  return <MobileNavDrawerClient themes={themes} />;
}
