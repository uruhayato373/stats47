import { type ReactNode } from "react";

import { cn } from "@stats47/components";

interface SectionHeaderProps {
  /** セクション番号（"1" 等）。eyebrow 先頭に primary 色で表示 */
  number?: string;
  /** eyebrow（小ラベル・大文字）。省略時は見出しのみ */
  eyebrow?: ReactNode;
  /** セクション見出し（既定 h2） */
  title: ReactNode;
  /** 見出し下の 1 行説明 */
  description?: ReactNode;
  /** 右端のアクション（"すべて見る ›" 等）。見出しと同じ行に右寄せ */
  action?: ReactNode;
  /** 見出しの HTML タグ（既定 "h2"）。階層上 h3 にしたい場合に指定 */
  as?: "h2" | "h3";
  /** 下罫線 (border-b) を出さない場合 true */
  hideRule?: boolean;
  /** 追加クラス（外側 div に当てる） */
  className?: string;
}

/**
 * エディトリアル / データ誌風のセクション見出し（サイト全ページ共通）。
 *
 * eyebrow（任意・番号付き）→ h2 → description（任意）を下罫線で締める。
 * 右端に action スロット（"すべて見る ›" 等）。
 *
 * ページ内のセクション見出し（h2）は必ずこのコンポーネント経由にする
 * （生の `<h2>` 直書きは check-design-system の no-raw-h2-in-page で禁止）。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
export function SectionHeader({
  number,
  eyebrow,
  title,
  description,
  action,
  as: Heading = "h2",
  hideRule = false,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-4",
        !hideRule && "border-b border-border pb-2.5",
        className,
      )}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-1 text-[11px] font-semibold uppercase text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <Heading className="text-lg font-bold leading-tight text-foreground">
            {number && (
              <span className="mr-2 font-mono text-primary">{number}</span>
            )}
            {title}
          </Heading>
          {description && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 text-xs text-muted-foreground">{action}</div>
        )}
      </div>
    </div>
  );
}
