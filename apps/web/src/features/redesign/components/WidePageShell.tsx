import { type ReactNode } from "react";

import { cn } from "@stats47/components";

interface WidePageShellProps {
  /** 中央メインコンテンツ */
  children: ReactNode;
  /** xl+ で右に表示するサイドバー (省略すると 1 カラム表示) */
  rightRail?: ReactNode;
  /** xl+ で左に表示するサイドバー (TOC 等、blog ページのみ想定) */
  leftRail?: ReactNode;
  /** 追加 className (container 自体に当てる) */
  className?: string;
}

/**
 * 全ページ共通の wide layout shell (D-System Phase 1)
 *
 * 課題: 既存 `container mx-auto px-4` は max-w-screen-2xl (1536px) で、
 * 1920px+ 画面では左右 192px ずつ余白が無駄。
 *
 * 解決: `max-w-[1700px]` に拡張し、xl+ では右サイドバーで関連 widget /
 * 広告枠を配置できる 2 カラム / 3 カラムレイアウトを提供。
 *
 * - 1 カラム: `<WidePageShell>...</WidePageShell>` (rightRail 省略)
 * - 2 カラム: `<WidePageShell rightRail={<RightRailWidgets />}>...</WidePageShell>`
 * - 3 カラム: `<WidePageShell leftRail={<TOC />} rightRail={...}>...</WidePageShell>`
 *
 * モバイル / タブレット (`xl` 未満) は常に 1 カラム + サイドバーを下部に積み下ろし。
 *
 * 右サイドバー幅: 360px 固定 (Tailwind safelist で動的幅は安定しないため)
 * 左サイドバー幅: 220px 固定
 */
export function WidePageShell({
  children,
  rightRail,
  leftRail,
  className,
}: WidePageShellProps) {
  const hasRight = !!rightRail;
  const hasLeft = !!leftRail;

  // grid-template-columns は固定値で 3 パターン
  // (Tailwind の JIT は静的クラス名のみ。動的 px は arbitrary value で書ける)
  const gridClass = hasLeft && hasRight
    ? "xl:grid xl:grid-cols-[220px_minmax(0,1fr)_360px] xl:gap-5 xl:items-start"
    : hasRight
      ? "xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-5 xl:items-start"
      : "";

  return (
    <div className={cn("mx-auto w-full max-w-[1700px] px-4 py-6", className)}>
      {hasRight || hasLeft ? (
        <>
          <div className={gridClass}>
            {hasLeft && <div className="hidden xl:block">{leftRail}</div>}
            <div className="min-w-0">{children}</div>
            {hasRight && <div className="hidden xl:block">{rightRail}</div>}
          </div>
          {/* xl 未満で sidebar を本文下に積み下ろし */}
          <div className="mt-6 space-y-6 xl:hidden">
            {hasRight && rightRail}
            {hasLeft && leftRail}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  );
}
