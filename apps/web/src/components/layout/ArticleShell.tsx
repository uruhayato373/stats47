import { type ReactNode } from 'react';

import { cn } from '@stats47/components';

import { LEFT_RAIL_GRID_CLASS } from './PageShell';

interface ArticleShellProps {
  /** 記事本文 (flex-1 で残り幅いっぱいに広がる) */
  children: ReactNode;
  /**
   * lg+ で左に表示するページ内ナビ。調査ハブなど「読み進め方」を先に示す記事面向け。
   * 狭幅では描画しないため、必要な操作はページ側で本文上部に代替 UI を置く。
   */
  leftRail?: ReactNode;
  /** レール上段 (非 sticky)。広告・CTA・関連 widget — 初期表示の viewability を確保する */
  rail?: ReactNode;
  /** レール先頭の sticky クラスタ。TOC・ナビなど読中に追従させたいもの */
  railSticky?: ReactNode;
  /** パンくず (zone 内・コンテナ先頭に配置) */
  breadcrumb?: ReactNode;
  /** 追加 className (外側 zone コンテナに当てる) */
  className?: string;
}

/**
 * 記事系ページ (blog 詳細 / ranking 詳細 / survey / terms / privacy) 専用の Shell。
 * doboku-note の Soft Editorial レイアウトを移植したもの。
 *
 * 寸法は doboku-note に合わせている (2026-08-03)。1280px コンテナ / lg+ 左右 40px /
 * gap 40px / 右レール 316px。300×250 の `SidebarPromoBanner` は Card で囲まず、
 * このレール内に等倍で表示する。
 *
 * PageShell (1280px grid・2026-07-11 に 1700px から統一) との違い:
 * - `.reading-zone` トークン（薄グレー地・--radius: 0）を全幅で敷く
 * - コンテナ 1280px + flex で本文がレールに密着する
 *   (PageShell reading variant の「1fr 列内で本文 760px 制限 → ワイド画面で空白」を根治)
 * - レールは「sticky TOC クラスタ先頭 + 非 sticky widget」の 2 段構成
 * - レール内に独立スクロールを作らず、ページ本体のスクロールで全内容に到達する
 * - 左レールと右レールは併存させない。右レールがある場合は右レールを優先する
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md /
 * docs/01_技術設計/04_デザインシステム.md「reading zone」
 */
export function ArticleShell({
  children,
  leftRail,
  rail,
  railSticky,
  breadcrumb,
  className,
}: ArticleShellProps) {
  const hasRightRail = !!rail || !!railSticky;
  const showLeftRail = !!leftRail && !hasRightRail;

  return (
    <div className={cn('reading-zone w-full bg-background', className)}>
      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        {breadcrumb}
        {showLeftRail ? (
          <div className={LEFT_RAIL_GRID_CLASS}>
            <aside className="sticky top-20 hidden lg:block">{leftRail}</aside>
            <main className="min-w-0">{children}</main>
          </div>
        ) : hasRightRail ? (
          <>
            <div className="lg:flex lg:items-start lg:gap-10">
              <main className="min-w-0 flex-1">{children}</main>
              <aside className="hidden w-[316px] shrink-0 lg:flex lg:self-stretch lg:flex-col lg:gap-3">
                {railSticky && (
                  <div className="sticky top-20 z-10 flex flex-col gap-3">
                    {railSticky}
                  </div>
                )}
                {rail}
              </aside>
            </div>
            {/* lg 未満はレールを本文下に積み下ろす */}
            <div className="mt-10 space-y-6 lg:hidden">
              {rail}
              {railSticky}
            </div>
          </>
        ) : (
          <main className="min-w-0">{children}</main>
        )}
      </div>
    </div>
  );
}
