import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

/**
 * ページ内ナビの置き場の契約。
 *
 * 2026-10-28 (テンプレート寄せ): サイト全体のナビはルートの AppSidebar が持つので、
 * ページ内ナビのためにサイドバーの右へもう 1 本の列を作らない。ページ内ナビは
 * 本文の上部 (狭い幅でも先頭) に置き、どの幅でも同じ 1 か所に出す。
 *
 * - `LEFT_RAIL_GRID_CLASS` … ページ内ナビと本文を縦に積む外枠
 * - `LEFT_RAIL_VISIBLE_CLASS` … ページ内ナビの置き場 (全幅で表示)
 * - `LEFT_RAIL_NARROW_ONLY_CLASS` … 旧「左レールが出ない幅の代替 UI」に付けていたクラス。
 *   ページ内ナビが全幅で本文上部に出るようになったため、代替 UI は常に隠す
 *   (同じ操作を 2 か所に出さない)。新しいコードでは使わない。
 */
export const LEFT_RAIL_GRID_CLASS = 'flex flex-col gap-4';
export const LEFT_RAIL_VISIBLE_CLASS = 'min-w-0';
export const LEFT_RAIL_NARROW_ONLY_CLASS = 'hidden';

interface LeftRailLayoutProps {
  leftRail: ReactNode;
  children: ReactNode;
  mainClassName?: string;
  /** 旧来の列幅の切替。列を作らなくなったため値は使わない (呼び出し側の互換のため残す)。 */
  density?: 'default' | 'compact';
}

/**
 * ページ内ナビ (旧 左レール) を本文の上に置く共有 composite。
 *
 * ページで唯一の main 要素はルートレイアウトが持つため、本文は
 * `div[data-slot=shell-main]` で描く (main を入れ子にしない)。
 */
export function LeftRailLayout({
  leftRail,
  children,
  mainClassName,
}: LeftRailLayoutProps) {
  return (
    <div className={LEFT_RAIL_GRID_CLASS}>
      <div data-slot="page-nav" className={LEFT_RAIL_VISIBLE_CLASS}>
        {leftRail}
      </div>
      <div data-slot="shell-main" className={cn('min-w-0', mainClassName)}>
        {children}
      </div>
    </div>
  );
}
