'use client';

import { PageHeader } from '@/components/layout';

import { PrefectureSelect } from './PrefectureSelect';
import { useThemePrefecture } from './ThemePrefectureContext';

/**
 * エリア連動のテーマ見出し。
 * 全国時は「{テーマ名}」、都道府県選択時は「{県名}の{テーマ名}」を H1 に表示する。
 * SSR では全国 (テーマ名) を描画し、選択時にクライアントで更新する。
 *
 * 概要ダッシュボードでは地域切替を見出しの操作欄へ集約する。
 */
export function ThemeAreaHeader({
  themeTitle,
  compact = false,
}: {
  themeTitle: string;
  compact?: boolean;
}) {
  const { selectedAreaName } = useThemePrefecture();
  const title = selectedAreaName
    ? `${selectedAreaName}の${themeTitle}`
    : themeTitle;
  return (
    <PageHeader
      title={title}
      className={compact ? 'mb-2 [&>div]:gap-2' : undefined}
      actions={compact ? <PrefectureSelect className="w-36" /> : undefined}
    />
  );
}
