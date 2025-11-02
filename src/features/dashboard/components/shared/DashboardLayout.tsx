/**
 * 共通ダッシュボードレイアウトコンポーネント
 * すべてのダッシュボードコンポーネントで使用する共通レイアウト
 */

import type { ReactNode } from "react";

interface DashboardLayoutProps {
  /** 子要素 */
  children: ReactNode;
  /** CSSクラス名 */
  className?: string;
  /** グリッドカラム数（デフォルト: 12） */
  columns?: number;
  /** グリッドのギャップ（デフォルト: "1rem"） */
  gap?: string;
}

/**
 * 共通ダッシュボードレイアウト
 */
export function DashboardLayout({
  children,
  className,
  columns = 12,
  gap = "1rem",
}: DashboardLayoutProps) {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap,
        width: "100%",
      }}
    >
      {children}
    </div>
  );
}

