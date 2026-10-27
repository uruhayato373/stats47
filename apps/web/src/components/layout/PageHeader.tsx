import { type ReactNode } from "react";

import { cn } from "@stats47/components";

interface PageHeaderProps {
  /** 任意の小ラベル（例: "ランキング"）。h1 の上に控えめに表示 */
  eyebrow?: string;
  /** ページ見出し（h1）。テンプレートの breadcrumb-comp と同じ text-xl font-semibold */
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
  /** title/description 直下の細いメタ行（出典・データ年度・最終更新など）。 */
  meta?: ReactNode;
  /** header ブロック下の操作行（正規化ピル群・年度/エリア操作など）。 */
  controls?: ReactNode;
  /**
   * 右カラムに置く要素（暗色 KPI 面など）。
   * 指定時のみ lg 以上で title 群と 2 カラム grid 化する。未指定時は単カラム。
   */
  aside?: ReactNode;
  /** 追加 className（外側 header に当てる） */
  className?: string;
}

/**
 * 全ページ共通の最小ページヘッダー。
 *
 * 暗色グラデの hero バナーや page-top KPI タイルを置かず、
 * h1 + 1 行説明（+ 細い統計テキスト）だけで構成する。
 *
 * 見た目はテンプレート (next-shadcn-dashboard) の breadcrumb-comp に合わせる:
 * 見出しは text-xl font-semibold、見出しと操作 (actions) を 1 行に並べて両端に寄せる
 * (items-center justify-between)。breadcrumb-comp の外枠 (Card) は写さない。PageHeader の
 * aside や直後の本文にカード面が来るため、枠を足すとカードの入れ子になる。パンくずは
 * 別部品の Breadcrumbs (JSON-LD と一体) が直前に出すので、ここには持たない。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  stats,
  actions,
  meta,
  controls,
  aside,
  className,
}: PageHeaderProps) {
  // title 群（h1 + description + meta）。aside 有無で共通利用。
  const titleBlock = (
    <div className="min-w-0">
      <h1 className="text-xl font-semibold leading-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {meta && (
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      )}
    </div>
  );

  return (
    <header className={cn("mb-4", className)}>
      {eyebrow && (
        <p className="text-xs font-medium text-muted-foreground">
          {eyebrow}
        </p>
      )}
      {aside ? (
        // 右カラム指定時のみ 2 カラム grid 化（lg 以上）。
        <div className="mt-1 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-3">
            {titleBlock}
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          {aside}
        </div>
      ) : (
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          {titleBlock}
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      {controls && <div className="mt-3">{controls}</div>}
      {stats && (
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">{stats}</p>
      )}
    </header>
  );
}
