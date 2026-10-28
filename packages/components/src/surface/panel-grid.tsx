import {
  Children,
  Fragment,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '../lib/cn';

/** 節の間の点線の帯 (テンプレートの StyleDivider。radial-gradient の点を 12px 間隔で敷き、両端を薄くする) */
const SECTION_DIVIDER_DOTS_STYLE: CSSProperties = {
  backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 0)',
  backgroundSize: '12px 12px',
  backgroundPosition: '6px 6px',
  maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
  WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
};

/**
 * 線の格子 (部品の種類「線の格子」)。見本 (テンプレートのダッシュボード) と同じく、セルの間に 1px の線を 1 本だけ引き、
 * パネルは自分の線を持たない (`grid gap-px p-px`)。線は各セルの外側 1px の影 (`0 0 0 1px`) で描き、1px の隙間と外枠の
 * 1px をちょうど埋める。並べる親の地は bg-background なので、行の途中で終わる格子の空いた所は塗られない
 * (2026-10-28 まで親が線の色を地に持っていて、空いた所が灰色の塊に見えた)。
 *
 * - 直下の子はすべてセル。地は bg-background、外側の余白は 0。パネルを含まないセル (見出し・文章・広告) は内側に 16px の
 *   余白を持ち、パネル・格子・パネルを包むだけの要素は余白を持たない。パネルと文章を一緒に包む要素は作らない
 *   (文章が線に接する)。そうした節は節ごと格子にする
 * - 格子の中の格子 (2 列に並べる行など) は外枠の 1px を持たない (`in-data-[slot=panel-grid]:p-0`)。地は線の色のまま
 * - 列の数と幅は className で渡す (例: `@md:grid-cols-2`)。パネルの間を gap-4 などで空けない
 * - 格子の中のパネルは自分の線を外す (`CARD_SURFACE_CLASS` と Card 部品の `in-data-[slot=panel-grid]:` の指定)
 *
 * 仕様: docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」の「線の格子」。
 */
export const PANEL_GRID_CLASS = cn(
  'grid min-w-0 gap-px bg-background p-px in-data-[slot=panel-grid]:p-0',
  // 直下の子はすべてセル: 地は白、外側の余白は持たない。線はセルの外側 1px の影で、隙間と外枠の 1px を埋める
  '*:min-w-0 *:bg-background *:m-0! *:shadow-[0_0_0_1px_hsl(var(--border))]!',
  // パネルを含まないセル (見出し・注記の文章・広告など) は内側に 16px の余白を持つ。パネル・格子・点線の帯と、
  // パネルを含むセル (パネルを包むだけの div) は余白を持たない
  '[&>*:not([data-slot=card],[data-slot=panel-grid],[data-slot=section-divider],[data-cell=flush],:has([data-slot=card]))]:p-4',
  // パンくずと次のセル (ページ見出し) は 1 つの区画に見せる: 次のセルを 1px 上げて間の線を覆い、次のセルの影は上辺を描かない
  '[&>[data-slot=breadcrumb]]:pb-0! [&>[data-slot=breadcrumb]]:-mb-px! [&>[data-slot=breadcrumb]+*]:pt-2!',
  '[&>[data-slot=breadcrumb]+*]:shadow-[1px_0_0_0_hsl(var(--border)),-1px_0_0_0_hsl(var(--border)),0_1px_0_0_hsl(var(--border)),1px_1px_0_0_hsl(var(--border)),-1px_1px_0_0_hsl(var(--border))]!',
);

export function PanelGrid({
  children,
  className,
  as: Tag = 'div',
  ...props
}: ComponentPropsWithoutRef<'div'> & {
  /** 節 (見出しと内容のまとまり) を格子にするときは section で描く (region の役割を保つ) */
  as?: 'div' | 'section';
}) {
  return (
    <Tag data-slot="panel-grid" className={cn(PANEL_GRID_CLASS, className)} {...props}>
      {children}
    </Tag>
  );
}

/**
 * 本文の節 (パネル) を縦に並べる線の格子。節と節の間に点線の帯 (高さ 16px。テンプレートの StyleDivider) を挟む。
 * 帯も格子のセルなので、上下と左右の線は格子が引く。
 *
 * 子はパネル (SurfaceCard / SectionCard / RailCard / ChartPanel / HorizontalCardCarouselFrame) か、
 * パネルを横に並べる `PanelGrid` を渡す。空の子 (false / null) は数えず、帯は節と節の間にだけ置く。
 */
export function PageSections({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const sections = Children.toArray(children);
  return (
    <PanelGrid className={className}>
      {sections.map((section, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <div
              aria-hidden="true"
              data-slot="section-divider"
              className="relative h-4 overflow-hidden text-foreground"
            >
              <div className="absolute inset-0 opacity-25" style={SECTION_DIVIDER_DOTS_STYLE} />
            </div>
          )}
          {section}
        </Fragment>
      ))}
    </PanelGrid>
  );
}
