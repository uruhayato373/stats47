"use client";

import { PageHeader } from "@/components/layout";

import { useThemePrefecture } from "./ThemePrefectureContext";

/**
 * エリア連動のテーマ見出し。
 * 全国時は「{テーマ名}」、都道府県選択時は「{県名}の{テーマ名}」を H1 に表示する。
 * SSR では全国 (テーマ名) を描画し、選択時にクライアントで更新する。
 *
 * 地域切替は lg+ の左レール、lg 未満のパンくず直下ツールバーに集約する。
 */
export function ThemeAreaHeader({
  themeTitle,
}: {
  themeTitle: string;
}) {
  const { selectedAreaName } = useThemePrefecture();
  // 題名に今の地域を入れる (2026-10-31 IA-REGION-THEME-01): 県を選ぶと「兵庫県の労働・賃金」、選ばないと「全国の労働・賃金」(2026-10-31 に「都道府県別の」から改めた。テーマは 1 つの地域を見せる)
  const title = selectedAreaName ? `${selectedAreaName}の${themeTitle}` : `全国の${themeTitle}`;
  return <PageHeader title={title} />;
}
