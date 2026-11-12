import { readKakeiAxisCharts } from "@stats47/stats-r2/readers";

import { KakeiAxisSectionClient } from "./KakeiAxisSectionClient";

/**
 * テーマの埋め込みの章「家計調査の分類軸別の値」。2026-11-12 オーナー決定で日本全体のテーマ (/japan) を全国のテーマへまとめ、
 * 日本全体のページにしか無かったこの図をテーマの章に移した。R2 の家計の軸の成果物から、テーマの名前の図だけを出す
 */
async function ThemeKakeiAxisSection({ themeSlug }: { themeSlug: string }) {
  const artifact = await readKakeiAxisCharts().catch(() => null);
  const charts = artifact?.charts.filter((chart) => chart.themeSlug === themeSlug) ?? [];
  return <KakeiAxisSectionClient charts={charts} />;
}

export function ThemeKakeiAxisFoodSpendingSection() {
  return <ThemeKakeiAxisSection themeSlug="household-food-spending" />;
}

export function ThemeKakeiAxisAssetsDebtSection() {
  return <ThemeKakeiAxisSection themeSlug="household-assets-debt" />;
}
