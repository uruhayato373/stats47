/**
 * アプリケーションヘッダー（Server Component）
 *
 * curated テーマ一覧と、カテゴリ別の件数・代表ランキングを HeaderClient へ渡す。
 * category は一覧探索、theme は横断的な深掘りという役割を分ける。
 * `cookies()` / `headers()` は呼ばない（SSG 維持: nextjs-ssg-preservation.md）。
 *
 * 設計仕様: docs/01_技術設計/13_統一レイアウト設計.md
 */
import { listAllMetrics, listCategories } from "@stats47/data-configs";

import { NAV_THEMES } from "@/features/theme-dashboard/config/theme-urls";

import { HeaderClient } from "./HeaderClient";

export default function Header() {
  // NAV_THEMES は静的 (curated・表示順)。local-finance-city は local-finance の
  // 市区町村ビューのためグローバルナビから除外済 (config/theme-urls.ts)。
  const themes = NAV_THEMES.map((t) => ({ themeKey: t.themeKey, title: t.title }));
  const activeMetrics = listAllMetrics().filter((metric) => metric.isActive);
  const categories = listCategories().map((category) => ({
    categoryKey: category.categoryKey,
    title: category.categoryName,
    count: activeMetrics.filter((metric) => metric.category === category.categoryKey).length,
    rankings: activeMetrics
      .filter((metric) => metric.category === category.categoryKey)
      .slice(0, 4)
      .map((metric) => ({ rankingKey: metric.key, title: metric.title })),
  }));

  return <HeaderClient themes={themes} categories={categories} />;
}
