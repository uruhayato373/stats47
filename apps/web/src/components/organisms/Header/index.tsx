/**
 * アプリケーションヘッダー（Server Component）
 *
 * メガメニュー用に curated テーマ一覧 (ALL_THEMES) を HeaderClient へ渡す。
 * category は e-Stat 機械分類の内部 backbone (categoryKey / affiliate / search) に降格し、
 * 主要ナビ (メガメニュー) には出さない (役割分担: docs/01_技術設計/11_情報設計.md)。
 * `cookies()` / `headers()` は呼ばない（SSG 維持: nextjs-ssg-preservation.md）。
 *
 * 設計仕様: docs/01_技術設計/21_統一レイアウト設計.md
 */
import { ALL_THEMES } from "@/features/theme-dashboard/server";

import { HeaderClient } from "./HeaderClient";

export default function Header() {
  // ALL_THEMES は静的 (curated 22 テーマ・表示順)。nav に必要な最小フィールドのみ渡す。
  const themes = ALL_THEMES.map((t) => ({ themeKey: t.themeKey, title: t.title }));

  return <HeaderClient themes={themes} />;
}
