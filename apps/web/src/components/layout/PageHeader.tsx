import { type ReactNode } from "react";

import { cn } from "@stats47/components";

interface PageHeaderProps {
  /** 任意の小ラベル（例: "ランキング"）。h1 の上に控えめに表示 */
  eyebrow?: string;
  /** ページ見出し（h1）。常に text-2xl font-bold */
  title: string;
  /** 1 行説明。本文の導入 */
  description?: ReactNode;
  /**
   * 細い統計テキスト行（例: "全 2,043 件 ・ 17 カテゴリ ・ 47 都道府県"）。
   * KPI タイルではなくテキストで表現する（ミニマル方針）。
   */
  stats?: ReactNode;
  /** 任意 CTA（検索 / 比較ボタン等）。h1 の右に配置 */
  actions?: ReactNode;
  /** 追加 className（外側 header に当てる） */
  className?: string;
}

/**
 * 全ページ共通の最小ページヘッダー。
 *
 * 暗色グラデの hero バナーや page-top KPI タイルを置かず、
 * h1 + 1 行説明（+ 細い統計テキスト）だけで構成する（白基調・余白主導）。
 *
 * 設計仕様: docs/01_技術設計/13_統一レイアウト設計.md
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  stats,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6", className)}>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase text-muted-foreground">
          {eyebrow}
        </p>
      )}
      <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold leading-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {stats && (
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{stats}</p>
      )}
    </header>
  );
}
