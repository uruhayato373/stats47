import { type ReactNode } from "react";

import { cn } from "@stats47/components";

interface ArticleShellProps {
  /** 記事本文 (flex-1 で残り幅いっぱいに広がる) */
  children: ReactNode;
  /** レール上段 (非 sticky)。広告・CTA・関連 widget — 初期表示の viewability を確保する */
  rail?: ReactNode;
  /** レール末尾の sticky クラスタ。TOC・ナビなど読中に追従させたいもの */
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
 * PageShell (1700px grid) との違い:
 * - `.reading-zone` トークン (薄グレー地・--radius: 14px) を全幅で敷く
 * - コンテナ 1280px + flex で本文がレールに密着する
 *   (PageShell reading variant の「1fr 列内で本文 760px 制限 → ワイド画面で空白」を根治)
 * - レールは「非 sticky 上段 + sticky TOC クラスタ末尾」の 2 段構成
 *
 * 設計仕様: docs/01_技術設計/13_統一レイアウト設計.md /
 * docs/01_技術設計/15_デザインシステムSSOT.md「reading zone 例外」
 */
export function ArticleShell({
  children,
  rail,
  railSticky,
  breadcrumb,
  className,
}: ArticleShellProps) {
  const hasRail = !!rail || !!railSticky;

  return (
    <div className={cn("reading-zone w-full bg-background", className)}>
      <div className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8">
        {breadcrumb}
        {hasRail ? (
          <>
            <div className="lg:flex lg:items-start lg:gap-8">
              <main className="min-w-0 flex-1">{children}</main>
              <aside className="hidden w-[360px] shrink-0 lg:flex lg:flex-col lg:gap-3">
                {rail}
                {railSticky && (
                  <div className="sticky top-20 flex max-h-[calc(100vh-5.5rem)] flex-col gap-3 overflow-y-auto pr-1">
                    {railSticky}
                  </div>
                )}
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
