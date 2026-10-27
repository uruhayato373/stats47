import { type ReactNode } from "react";

import { Separator, cn } from "@stats47/components";

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
  /** 下の区切り線 (Separator) を出さない場合 true */
  hideRule?: boolean;
  /** 追加クラス（外側 div に当てる） */
  className?: string;
}

/**
 * セクション見出し（サイト全ページ共通）。
 *
 * テンプレートの CardHeader と同じ並び (見出し + 説明を左、アクションを右上) を、カードの外で使う。
 * eyebrow（任意・番号付き）→ 見出し → description（任意）→ 区切り線 (テンプレートの Separator)。
 * 独自の border / padding は持たない。
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
    <div className={cn("mb-4 flex flex-col gap-2", className)}>
      <div className="grid auto-rows-min grid-cols-[1fr_auto] items-start gap-x-3 gap-y-1">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-xs font-medium text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <Heading className="text-base font-medium leading-snug text-foreground">
            {number && (
              <span className="mr-2 font-mono text-primary">{number}</span>
            )}
            {title}
          </Heading>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div className="self-start text-xs">{action}</div>}
      </div>
      {!hideRule && <Separator />}
    </div>
  );
}
