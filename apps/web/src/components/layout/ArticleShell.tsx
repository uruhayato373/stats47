import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

import { LeftRailLayout } from './LeftRailLayout';
import { SHELL_CONTAINER_CLASS } from './PageShell';

interface ArticleShellProps {
  /** 記事本文 (flex-1 で残り幅いっぱいに広がる) */
  children: ReactNode;
  /**
   * shell コンテナ 936px 以上で左に表示するページ内ナビ。調査ハブなど「読み進め方」を
   * 先に示す記事面向け。狭幅では描画しないため、必要な操作はページ側で本文上部に代替 UI を置く。
   */
  leftRail?: ReactNode;
  /** 右レール。ページと一緒に自然に流れる (追従・独立スクロールを作らない) */
  rail?: ReactNode;
  /** パンくず (zone 内・コンテナ先頭に配置) */
  breadcrumb?: ReactNode;
  /** 追加 className (外側 zone コンテナに当てる) */
  className?: string;
}

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
 * - 左レールと右レールは併存させない。右レールがある場合は右レールを優先する
 *
 * レールの境界は PageShell と同じ名前付きコンテナ `@container/shell` の幅で決める
 * (左 936px・右 988px)。ページで唯一の `<main>` はルートレイアウトが持つので、
 * 本文の列は `div[data-slot=shell-main]` で描く。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md「reading zone」
 */
export function ArticleShell({
  children,
  leftRail,
  rail,
  breadcrumb,
  className,
}: ArticleShellProps) {
  const hasRightRail = !!rail;
  const showLeftRail = !!leftRail && !hasRightRail;

  return (
    <div className={cn('reading-zone w-full bg-background', className)}>
      <div className={SHELL_CONTAINER_CLASS}>
        {showLeftRail ? (
          <LeftRailLayout leftRail={leftRail}>
            {breadcrumb}
            {children}
          </LeftRailLayout>
        ) : hasRightRail ? (
          <>
            {breadcrumb}
            <div className="@min-[988px]/shell:flex @min-[988px]/shell:items-start @min-[988px]/shell:gap-4">
              <div data-slot="shell-main" className="min-w-0 flex-1">
                {children}
              </div>
              <aside className="hidden w-[316px] shrink-0 @min-[988px]/shell:flex @min-[988px]/shell:self-stretch @min-[988px]/shell:flex-col @min-[988px]/shell:gap-3">
                {rail}
              </aside>
            </div>
            {/* 右レールが出ない幅では、レールを本文の下に積み下ろす */}
            <div className="mt-4 space-y-4 @min-[988px]/shell:hidden">
              {rail}
            </div>
          </>
        ) : (
          <>
            {breadcrumb}
            <div data-slot="shell-main" className="min-w-0">
              {children}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
