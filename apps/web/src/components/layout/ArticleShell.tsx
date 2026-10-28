import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

import { LeftRailLayout } from './LeftRailLayout';
import { SHELL_CONTAINER_CLASS } from './PageShell';

interface ArticleShellProps {
  /** 記事本文 (flex-1 で残り幅いっぱいに広がる) */
  children: ReactNode;
  /**
   * ページ内ナビ。パンくずの直後・本文の上に全幅で置く (列は作らない。`LeftRailLayout`)。
   */
  leftRail?: ReactNode;
  /** 右レール。ページと一緒に自然に流れる (追従・独立スクロールを作らない) */
  rail?: ReactNode;
  /** パンくず (zone 内・コンテナ先頭に配置) */
  breadcrumb?: ReactNode;
  /**
   * ページの見出し (h1 と操作の行)。パンくずの後・本文と右レールの列より前に全幅で置く。
   * 渡すと、右レールの先頭の上端が本文の最初のカードの上端と揃う (見出しを children に入れると、
   * 右レールは見出しの横から始まる)。
   */
  header?: ReactNode;
  /** 追加 className (外側 zone コンテナに当てる) */
  className?: string;
}

/** 右レール。狭い幅は本文の下 (mt-4・間隔 16px)、988px 以上は幅 316px の列 (間隔 12px) */
export const ARTICLE_RAIL_CLASS =
  'mt-4 flex flex-col gap-4 @min-[988px]/shell:mt-0 @min-[988px]/shell:w-[316px] @min-[988px]/shell:shrink-0 @min-[988px]/shell:self-stretch @min-[988px]/shell:gap-3';

/**
 * 記事系ページ (blog 詳細 / ranking 詳細 / survey / terms / privacy) 専用の Shell。
 *
 * 寸法: 1280px コンテナ / gap 16px / 右レール 316px。余白はルートレイアウトの
 * main#main-content (p-4) が持つ (2026-10-27 にテンプレートの p-4 へ寄せた)。
 * 300×250 の `SidebarPromoBanner` は Card で囲まず、このレール内に等倍で表示する。
 *
 * PageShell との違い:
 * - `.reading-zone` トークン（--radius: 0）を全幅で敷く
 * - 右レールは flex で本文に密着する
 *   (PageShell reading variant の「1fr 列内で本文 760px 制限 → ワイド画面で空白」を根治)
 * - レールはページと一緒に自然に流れる。追従する領域は置かない (2026-09-25 にブログの目次を
 *   本文上部へ移し、唯一の利用者だったレール先頭の追従領域を廃止した)
 * - レール内に独立スクロールを作らず、ページ本体のスクロールで全内容に到達する
 * - 右レールは 1 回だけ描く。狭い幅では本文の下に積み、988px 以上では同じ要素を本文の右の列に置く
 *   (2026-10-28 2 巡目。それまでは aside と本文下の div の 2 か所に描き、広告の計測画像・検索欄・
 *   リンクが HTML に二重に出ていた)
 * - 左レールと右レールは併存させない。右レールがある場合は右レールを優先する
 *
 * 右レールの境界は PageShell と同じ名前付きコンテナ `@container/shell` の幅 (988px) で決める。
 * ページ内ナビ (leftRail) は列を作らず本文の上に置く。ページで唯一の main 要素はルートレイアウトが
 * 持つので、本文の列は `div[data-slot=shell-main]` で描く。
 *
 * パンくずは列の外 (コンテナの先頭) に置き、ページ内ナビ・本文・右レールより先に出す。
 * 現在地をどの幅でも出す表示は `Breadcrumbs` / `CURRENT_ITEM_CLASS` が持つ。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md「reading zone」
 */
export function ArticleShell({
  children,
  leftRail,
  rail,
  breadcrumb,
  header,
  className,
}: ArticleShellProps) {
  const hasRightRail = !!rail;
  const showLeftRail = !!leftRail && !hasRightRail;

  return (
    <div className={cn('reading-zone w-full bg-background', className)}>
      <div className={SHELL_CONTAINER_CLASS}>
        {breadcrumb}
        {header}
        {showLeftRail ? (
          <LeftRailLayout leftRail={leftRail}>{children}</LeftRailLayout>
        ) : hasRightRail ? (
          <div className="@min-[988px]/shell:flex @min-[988px]/shell:items-start @min-[988px]/shell:gap-4">
            <div data-slot="shell-main" className="min-w-0 flex-1">
              {children}
            </div>
            {/* 狭い幅では本文の下に積み、988px 以上では本文の右の列になる (同じ要素を 1 回だけ描く) */}
            <aside className={ARTICLE_RAIL_CLASS}>{rail}</aside>
          </div>
        ) : (
          <div data-slot="shell-main" className="min-w-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
