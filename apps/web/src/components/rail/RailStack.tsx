import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '@stats47/components';

interface RailStackProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
}

/**
 * レール内カードの縦積み。左レール・右レールとも唯一のスタック (gap-3)。
 * landmark (aside) は Shell / LeftRailLayout が持つので、ページ側で `<aside>` を重ねない。
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」
 */
export function RailStack({ children, className, ...props }: RailStackProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      {children}
    </div>
  );
}
