import { type ReactNode } from 'react';

import { PanelGrid } from '@stats47/components';

/**
 * ページの本文の列 (見本の `flex flex-col p-px gap-px bg-border`)。ページ見出し・ページ内ナビ・本文を 1 本の線の格子に並べる。
 * PageShell / ArticleShell / LeftRailLayout が使う。本文は `div[data-slot=shell-main]` (display: contents) の中の格子で、
 * 外の格子にそのままつながる (入れ子の格子は外枠を持たない)。ページ側は本文の直下にセル (パネル・格子・見出し・文章) を並べる。
 */
export function ShellColumn({
  header,
  pageNav,
  children,
  className,
}: {
  header?: ReactNode;
  pageNav?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PanelGrid className={className}>
      {header}
      {pageNav && (
        <div data-slot="page-nav" className="min-w-0">
          {pageNav}
        </div>
      )}
      <div data-slot="shell-main" className="contents">
        <PanelGrid>{children}</PanelGrid>
      </div>
    </PanelGrid>
  );
}
