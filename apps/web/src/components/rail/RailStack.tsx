import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@stats47/components';

interface RailStackProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}

/**
 * レール内カードの縦積み。左レール・右レールとも唯一のスタック。
 * 間隔はテンプレートのカード間と同じ gap-4 (2026-10-27。それ以前は gap-3)。本文の列 (線の格子 PanelGrid) の中に
 * 置いたときは間を空けず、1px の線を共有する (2026-10-28)。
 * landmark (aside) は Shell / LeftRailLayout が持つので、ページ側で `<aside>` を重ねない。
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」
 */
export function RailStack({ children, className, ...props }: RailStackProps) {
  return (
    <div
      data-slot="rail-stack"
      className={cn(
        'flex flex-col gap-4',
        // 本文の列 (線の格子) の中に置いたときは、パネルの間を空けずに 1px の線を共有する
        'in-data-[slot=panel-grid]:gap-px in-data-[slot=panel-grid]:bg-border',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
