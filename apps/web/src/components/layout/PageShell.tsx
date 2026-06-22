import { type ReactNode } from "react";

import { cn } from "@stats47/components";

interface PageShellProps {
  /** 中央メインコンテンツ */
  children: ReactNode;
  /**
   * 本文の性質
   * - `default`: ダッシュボード / 一覧（幅いっぱい使う）
   * - `reading`: 記事本文（本文カラムを READING_MAX に制限して可読性を確保）
   */
  variant?: "default" | "reading";
  /** xl+ で右に表示するサイドレール（関連 widget / 広告）。省略すると右レールなし */
  rightRail?: ReactNode;
  /** xl+ で左に表示するサイドレール（テーマナビ等）。省略すると左レールなし */
  leftRail?: ReactNode;
  /**
   * 右 rail の表示開始幅。
   * - `xl`: 通常ページ。right rail は xl+ で表示
   * - `lg`: ブログ詳細など。right rail は lg+ で表示
   */
  rightRailBreakpoint?: "xl" | "lg";
  /** 追加 className（外側コンテナに当てる） */
  className?: string;
}

/**
 * 全ページ共通の単一レイアウト Shell。
 *
 * 横幅・サイドレール・余白の SSOT。各 page.tsx は `container mx-auto` や
 * `max-w-[…]` を直接書かず、必ず本コンポーネントを経由する。
 *
 * 設計仕様: docs/01_技術設計/13_統一レイアウト設計.md
 *
 * グリッド:
 * - レールなし     : 1700px 中央寄せ
 * - 右レールのみ   : [minmax(0,1fr) 360px]
 * - 左レールのみ   : [280px minmax(0,1fr)]
 * - 右レール lg    : lg [minmax(0,1fr) 360px]
 *
 * 通常は xl 未満で 1 カラム。`rightRailBreakpoint="lg"` の場合、右 rail は lg+ で表示する。
 *
 * NOTE: grid-template-columns は Tailwind JIT のため静的クラス文字列で持つ
 * （動的 px 連結は purge されるため不可）。
 */
export function PageShell({
  children,
  variant = "default",
  rightRail,
  leftRail,
  rightRailBreakpoint = "xl",
  className,
}: PageShellProps) {
  const hasRight = !!rightRail;
  const hasLeft = !!leftRail;
  const showLeft = hasLeft && !hasRight;

  const gridClass =
    rightRailBreakpoint === "lg" && hasRight
      ? "lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:items-start"
      : showLeft
        ? "xl:grid xl:grid-cols-[280px_minmax(0,1fr)] xl:gap-8 xl:items-start"
        : hasRight
          ? "xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8 xl:items-start"
          : "";

  // reading variant は本文カラムを可読幅に制限（レールが無い場合は中央寄せ）
  const mainClass = cn(
    "min-w-0",
    variant === "reading" && "mx-auto w-full max-w-[760px] xl:mx-0",
  );

  return (
    <div className={cn("mx-auto w-full max-w-[1700px] px-4 py-8 sm:px-6", className)}>
      {hasRight || hasLeft ? (
        <>
          <div className={gridClass}>
            {showLeft && <div className="hidden xl:block">{leftRail}</div>}
            <div className={mainClass}>{children}</div>
            {hasRight && (
              <div className={rightRailBreakpoint === "lg" ? "hidden lg:block" : "hidden xl:block"}>
                {rightRail}
              </div>
            )}
          </div>
          {/* xl 未満でレールを本文下に積み下ろす */}
          <div className={cn("mt-10 space-y-8", rightRailBreakpoint === "lg" ? "lg:hidden" : "xl:hidden")}>
            {hasRight && rightRail}
            {showLeft && leftRail}
          </div>
        </>
      ) : (
        <div className={mainClass}>{children}</div>
      )}
    </div>
  );
}
