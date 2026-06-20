"use client";

import { PageHeader } from "@/components/layout";

import { PrefectureSelect } from "./PrefectureSelect";
import { useThemePrefecture } from "./ThemePrefectureContext";

/**
 * エリア連動のテーマ見出し。
 * 全国時は「{テーマ名}」、都道府県選択時は「{県名}の{テーマ名}」を H1 に表示し、
 * 右に都道府県セレクタ (PageHeader の actions スロット) を置く。
 * SSR では全国 (テーマ名) を描画し、選択時にクライアントで更新する。
 */
export function ThemeAreaHeader({
  themeTitle,
  description,
}: {
  themeTitle: string;
  description?: string;
}) {
  const { selectedAreaName } = useThemePrefecture();
  const title = selectedAreaName ? `${selectedAreaName}の${themeTitle}` : themeTitle;
  return (
    <PageHeader
      eyebrow="テーマダッシュボード"
      title={title}
      description={description}
      actions={<PrefectureSelect />}
    />
  );
}
