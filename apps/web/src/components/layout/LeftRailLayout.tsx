import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

/**
 * ページ内ナビ (旧 左レール) の置き場の契約。
 *
 * 2026-10-28 (テンプレート寄せ): サイト全体のナビはルートの AppSidebar が持つので、
 * ページ内ナビのためにサイドバーの右へもう 1 本の列を作らない。ページ内ナビは
 * 本文の上部に置き、どの幅でも同じ 1 か所に出す (幅で出し入れしないので、狭い幅の代替 UI も持たない)。
 * パンくずとページ見出し (h1) は呼び出し側の Shell がこの外側の先に置く
 * (PageShell / ArticleShell の `header`・`breadcrumb`)。
 *
 * ページで唯一の main 要素はルートレイアウトが持つため、本文は
 * `div[data-slot=shell-main]` で描く (main を入れ子にしない)。
 */
export function LeftRailLayout({
  leftRail,
  children,
  mainClassName,
}: {
  leftRail: ReactNode;
  children: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div data-slot="page-nav" className="min-w-0">
        {leftRail}
      </div>
      <div data-slot="shell-main" className={cn('min-w-0', mainClassName)}>
        {children}
      </div>
    </div>
  );
}
