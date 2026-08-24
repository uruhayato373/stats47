/**
 * アプリケーションヘッダー（Server Component）
 *
 * curated テーマ一覧と、カテゴリ別の件数・代表ランキングを HeaderClient へ渡す。
 * category は一覧探索、theme は横断的な深掘りという役割を分ける。
 * `cookies()` / `headers()` は呼ばない（SSG 維持: nextjs-ssg-preservation.md）。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
import { RANKING_PROMINENCE_CATEGORIES } from "@stats47/data-configs/ranking-prominence";

import { NAV_THEMES } from "@/features/theme-dashboard/config/theme-urls";



import { HeaderClient } from "./HeaderClient";

export default function Header() {
  // NAV_THEMES は静的 (curated・表示順)。市区町村統計は専用ナビで扱う。
  const themes = NAV_THEMES.map((t) => ({ themeKey: t.themeKey, title: t.title }));
  // 件数と代表ランキングはビルド前に git TS から焼いた生成物を使う。ここで
  // listAllMetrics() を呼ぶと、共通 Header 経由で METRICS_REGISTRY が
  // ほぼ全 route の bundle に入る (generate-ranking-prominence.ts 参照)。
  // メガメニューは索引 6 件の先頭 4 件を出す (/ranking の索引と並びが一致する)。
  const categories = RANKING_PROMINENCE_CATEGORIES.map((category) => ({
    categoryKey: category.categoryKey,
    title: category.categoryName,
    count: category.count,
    rankings: category.representatives.slice(0, 4).map((representative) => ({
      rankingKey: representative.rankingKey,
      title: representative.readerLabel ?? representative.title,
    })),
  }));

  return <HeaderClient themes={themes} categories={categories} />;
}
