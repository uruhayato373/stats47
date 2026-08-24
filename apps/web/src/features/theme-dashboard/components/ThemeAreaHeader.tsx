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
  const title = selectedAreaName ? `${selectedAreaName}の${themeTitle}` : themeTitle;
  return <PageHeader title={title} />;
}
