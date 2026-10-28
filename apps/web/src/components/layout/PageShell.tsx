import {
  Children,
  Fragment,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { cn } from '@stats47/components';

import { LeftRailLayout } from './LeftRailLayout';

interface PageShellProps {
  /** 中央メインコンテンツ */
  children: ReactNode;
  /**
   * 本文の性質
   * - `default`: ダッシュボード / 一覧（幅いっぱい使う）
   * - `reading`: 記事本文（本文カラムを READING_MAX に制限して可読性を確保）
   */
  variant?: 'default' | 'reading';
  /**
   * shell コンテナ 988px 以上で右に表示するサイドレール（関連 widget / 広告）。
   * 省略すると右レールなし
   */
  rightRail?: ReactNode;
  /**
   * ページ内ナビ (旧 左レール)。列を作らず、`header` の後・本文の上にどの幅でも全幅で置く
   * (`LeftRailLayout`)。右レールと同時に渡すと右レールを優先し、ページ内ナビは描かない。
   */
  leftRail?: ReactNode;
  /**
   * パンくずとページ見出し (h1)。本文・ページ内ナビ・右レールより先に全幅で置く。
   * ページ内ナビ (leftRail) を渡すページは、ナビがパンくずと h1 より前に出ないよう必ずここへ渡す
   * (`design-system:check` の `left-rail-requires-header-first`)。
   */
  header?: ReactNode;
  /** 追加 className（外側コンテナに当てる） */
  className?: string;
}

/**
 * ページ本文と横幅 (1280px 中央寄せ) を揃えるための共有トークン。横の余白は持たない。
 * page.tsx は PageShell を使い、これを直接使うのは Shell の外で幅だけを揃えたい部品のみ。
 *
 * 2026-07-11: 1700px → 1280px に統一 (ArticleShell = blog/ranking 詳細と同一幅)。
 * 2026-10-27: 横の余白はテンプレートの p-4 に寄せた。本文の余白はルートレイアウトの
 * main#main-content (p-4) が持つので、PageShell / ArticleShell 自身は余白を持たない。
 * 2026-10-28: このトークンから px-4 を外した。main の中で使うと main の p-4 と重なり 32px になっていた。
 * main の外 (Footer) は自分で px-4 を足す。
 */
export const SHELL_WIDTH_CLASS = 'mx-auto w-full max-w-[1280px]';

/**
 * PageShell / ArticleShell の外枠。幅の上限と、レール境界を判定する名前付きコンテナ
 * `@container/shell` を持つ。余白は main#main-content の p-4 に任せる。
 *
 * サイドバーの開閉で本文の幅が変わるため、レールの出現はビューポートではなく
 * このコンテナの幅で決める (左 936px・右 988px。どちらも本文 656px を保つ値)。
 */
export const SHELL_CONTAINER_CLASS = '@container/shell mx-auto w-full max-w-[1280px]';

/**
 * 右レールの列と表示境界。PageShell / ArticleShell で共有する。
 * 988px = 本文 656px + gap 16px + 右レール 316px。
 */
export const RIGHT_RAIL_GRID_CLASS =
  '@min-[988px]/shell:grid @min-[988px]/shell:grid-cols-[minmax(0,1fr)_316px] @min-[988px]/shell:gap-4 @min-[988px]/shell:items-start';

/**
 * 全ページ共通の単一レイアウト Shell。
 *
 * 横幅・サイドレールの SSOT。各 page.tsx は `container mx-auto` や
 * `max-w-[…]` を直接書かず、必ず本コンポーネントを経由する。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 *
 * グリッド (境界はすべて shell コンテナの幅):
 * - レールなし     : 1280px 中央寄せ
 * - 右レールのみ   : 988px 以上で [minmax(0,1fr) 316px]
 * - ページ内ナビ   : 列を作らない。header (パンくず + h1) → ページ内ナビ → 本文の順に縦に積む
 *
 * 右レール 316px と gap 16px は ArticleShell と同値。同じ `RightRailWidgets` を描画するため、
 * 両 Shell で幅を揃える。300×250 の `SidebarPromoBanner` は Card で囲まず、このレール内に
 * 等倍で表示する。
 *
 * NOTE: grid-template-columns は Tailwind JIT のため静的クラス文字列で持つ
 * （動的 px 連結は purge されるため不可）。
 */
export function PageShell({
  children,
  variant = 'default',
  rightRail,
  leftRail,
  header,
  className,
}: PageShellProps) {
  const hasRight = !!rightRail;
  const hasLeft = !!leftRail;
  const showLeft = hasLeft && !hasRight;

  // reading variant は本文カラムを可読幅に制限（レールが無い場合は中央寄せ）
  const mainClass = cn(
    'min-w-0',
    variant === 'reading' &&
      'mx-auto w-full max-w-[760px] @min-[988px]/shell:mx-0'
  );

  return (
    <div className={cn(SHELL_CONTAINER_CLASS, className)}>
      {header}
      {showLeft ? (
        <LeftRailLayout leftRail={leftRail} mainClassName={mainClass}>
          {children}
        </LeftRailLayout>
      ) : hasRight ? (
        <div className={RIGHT_RAIL_GRID_CLASS}>
          <div data-slot="shell-main" className={mainClass}>
            {children}
          </div>
          <div className="mt-4 space-y-4 @min-[988px]/shell:mt-0">
            {rightRail}
          </div>
        </div>
      ) : (
        <div data-slot="shell-main" className={mainClass}>
          {children}
        </div>
      )}
    </div>
  );
}

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
 * - 子はパネル (ChartPanel・SurfaceCard 系) か、白い地のセルになる要素。直下の子は地を bg-background にそろえる
 * - 格子の中の格子 (2 列に並べる行など) は外枠の 1px を持たない (`in-data-[slot=panel-grid]:p-0`)。地は線の色のまま
 * - 列の数と幅は className で渡す (例: `@md:grid-cols-2`)。パネルの間を gap-4 などで空けない
 * - 格子の中のパネルは自分の線を外す (`CARD_SURFACE_CLASS` と Card 部品の `in-data-[slot=panel-grid]:` の指定)
 *
 * 仕様: docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」の「線の格子」。
 */
export const PANEL_GRID_CLASS =
  'grid min-w-0 gap-px bg-border! p-px *:min-w-0 *:bg-background in-data-[slot=panel-grid]:p-0';

export function PanelGrid({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<'div'>) {
  return (
    <div data-slot="panel-grid" className={cn(PANEL_GRID_CLASS, className)} {...props}>
      {children}
    </div>
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
