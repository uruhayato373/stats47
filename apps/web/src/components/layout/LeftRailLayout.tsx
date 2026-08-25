import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

/**
 * ページ内ナビ用の左レール契約。
 *
 * PageShell / ArticleShell はページの surface が異なっても、この列幅・gap・表示境界を
 * 必ず共有する。feature 側へ responsive class を複製しない。
 */
export const LEFT_RAIL_GRID_CLASS =
  'min-[992px]:grid min-[992px]:grid-cols-[264px_minmax(0,1fr)] min-[992px]:gap-6 min-[992px]:items-start xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-10';
export const LEFT_RAIL_VISIBLE_CLASS = 'hidden min-[992px]:block';
export const LEFT_RAIL_NARROW_ONLY_CLASS = 'min-[992px]:hidden';

interface LeftRailLayoutProps {
  leftRail: ReactNode;
  children: ReactNode;
  /** 本文の意味要素。PageShell は div、ArticleShell は main を使う。 */
  mainAs?: 'div' | 'main';
  mainClassName?: string;
}

/**
 * 左レールと本文の横並びだけを所有する共有 composite。
 *
 * レールはページ本体と同じ自然スクロールに置く。sticky の有無を feature ごとに
 * 分岐させないことで、テーマ・調査・一覧ページの位置と到達性を揃える。
 */
export function LeftRailLayout({
  leftRail,
  children,
  mainAs = 'div',
  mainClassName,
}: LeftRailLayoutProps) {
  const Main = mainAs;

  return (
    <div className={LEFT_RAIL_GRID_CLASS}>
      <aside className={LEFT_RAIL_VISIBLE_CLASS}>{leftRail}</aside>
      <Main className={cn('min-w-0', mainClassName)}>{children}</Main>
    </div>
  );
}
