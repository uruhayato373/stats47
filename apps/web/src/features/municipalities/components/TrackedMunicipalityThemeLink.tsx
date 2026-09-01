'use client';

import { type ComponentProps } from 'react';

import { SurfaceLinkCard } from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

interface Props extends ComponentProps<typeof SurfaceLinkCard> {
  label: string;
}

/**
 * テーマ一覧カードのクリックを nav_click (surface=municipalities_theme) で計測する薄いラッパ。
 * カード枠は描画せず SurfaceLinkCard に委譲する (命名は TrackedPortalCategoryLink と同型 —
 * card census の対象たる新規カード枠ではないため *Link)。
 * 台帳: .claude/rules/analytics-event-standards.md (登録済み nav_surface の値追加)。
 */
export function TrackedMunicipalityThemeLink({
  label,
  href,
  onClick,
  ...props
}: Props) {
  return (
    <SurfaceLinkCard
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        try {
          trackNavClick({
            label,
            href: typeof href === 'string' ? href : (href.pathname ?? ''),
            surface: 'municipalities_theme',
          });
        } catch {
          // 計測失敗で遷移を止めない
        }
      }}
    />
  );
}
