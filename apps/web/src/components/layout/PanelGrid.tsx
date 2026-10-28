import {
  Children,
  Fragment,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '@stats47/components';

/** 節の間の点線の帯 (テンプレートの StyleDivider。radial-gradient の点を 12px 間隔で敷き、両端を薄くする) */
const SECTION_DIVIDER_DOTS_STYLE: CSSProperties = {
  backgroundImage: 'radial-gradient(circle at center, currentColor 1px, transparent 0)',
  backgroundSize: '12px 12px',
  backgroundPosition: '6px 6px',
  maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
  WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)',
};

/**
 * 線の格子 (部品の種類「線の格子」)。見本 (テンプレートのダッシュボード) と同じく、並べる親が線の色を地に持ち
 * (`grid gap-px bg-border p-px`)、パネルは線を持たない。1px の隙間から地の色が見えて、隣り合うパネルが線を共有する。
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
  'grid min-w-0 gap-px bg-border! p-px in-data-[slot=panel-grid]:p-0',
  // 直下の子はすべてセル: 地は白、外側の余白は持たない (余白があると線の色が太い帯になって見える)
  '*:min-w-0 *:bg-background *:m-0!',
  // パネルを含まないセル (見出し・注記の文章・広告など) は内側に 16px の余白を持つ。パネル・格子・点線の帯と、
  // パネルを含むセル (パネルを包むだけの div) は余白を持たない
  '[&>*:not([data-slot=card],[data-slot=panel-grid],[data-slot=section-divider],[data-cell=flush],:has([data-slot=card]))]:p-4',
  // パンくずと次のセル (ページ見出し) は 1 つの区画に見せる: 間の線を次のセルで覆い、上下の余白を詰める
  '[&>[data-slot=breadcrumb]]:pb-0! [&>[data-slot=breadcrumb]]:-mb-px! [&>[data-slot=breadcrumb]+*]:pt-2!',
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
