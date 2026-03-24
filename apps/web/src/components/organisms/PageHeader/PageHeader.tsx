import { ReactNode } from "react";

import { cn } from "@stats47/components";

interface PageHeaderProps {
  /** ページタイトル */
  title: ReactNode;
  /** 右側に表示するアクション（ボタン、セレクトボックスなど） */
  actions?: ReactNode;
  /** タイトルのサイズバリアント */
  titleVariant?: "default" | "large";
  /** パディングのバリアント */
  paddingVariant?: "default" | "compact";
  /** 追加のクラス名 */
  className?: string;
}

/**
 * ページヘッダーコンポーネント
 *
 * ダッシュボードページやランキングページなど、各ページのタイトルとアクションを統一されたスタイルで表示します。
 *
 * @example
 * ```tsx
 * <PageHeader
 *   title="東京都の人口"
 *   actions={<DashboardAreaSelector ... />}
 *   titleVariant="large"
 * />
 * ```
 */
export function PageHeader({
  title,
  actions,
  titleVariant = "default",
  paddingVariant = "default",
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "border-b border-border pt-4 pb-4 mb-4 flex-shrink-0",
        paddingVariant === "default" ? "px-4" : "px-2",
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div
          className={cn(
            "flex items-center gap-2 flex-shrink min-w-0",
            titleVariant === "large"
              ? "text-2xl font-bold"
              : "text-xl font-semibold text-muted-foreground"
          )}
        >
          {title}
        </div>
        {actions && <div className="flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

