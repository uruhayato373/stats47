import { type ReactNode } from "react";

import { Separator, cn } from "@stats47/components";

interface SectionHeaderProps {
  /** セクション番号（"1" 等）。eyebrow 先頭に primary 色で表示 */
  number?: string;
  /** eyebrow（小ラベル・大文字）。省略時は見出しのみ */
  eyebrow?: ReactNode;
  /** 見出しの左に置くアイコン (lucide。size-4 text-muted-foreground に揃える) */
  icon?: ReactNode;
  /** セクション見出し（既定 h2） */
  title: ReactNode;
  /** 見出し下の 1 行説明 */
  description?: ReactNode;
  /**
   * 右端の操作。見出しと同じ行の中央に揃える。
   * 一覧への導線は SectionIndexLink (Button outline sm + ArrowRight) を使い、文字の矢印 (→) を書かない。
   */
  action?: ReactNode;
  /** 見出しの階層（既定 h2: text-base、小見出し h3・h4: text-sm）。h4 は章の中の節 (市区町村のデータブック) */
  as?: "h2" | "h3" | "h4";
  /** 下の区切り線 (Separator) を出さない場合 true */
  hideRule?: boolean;
  /** 追加クラス（外側 div に当てる） */
  className?: string;
}

/**
 * セクション見出し（サイト全ページ共通）。
 *
 * テンプレートの CardHeader と同じ並び (アイコン + 見出し + 説明を左、操作を右) を、カードの外で使う。
 * h2 は text-base、h3 は text-sm。太さは font-semibold (全ページ共通)。
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
  icon,
  title,
  description,
  action,
  as: Heading = "h2",
  hideRule = false,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-4 flex flex-col gap-2", className)}>
      {/* 狭い幅では操作を見出しの下の行へ回す (flex-wrap)。min-h-8 = 操作の高さで、操作の有無で行の高さを変えない */}
      <div className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-48 flex-1">
          {eyebrow && (
            <p className="text-xs font-medium text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <Heading className={cn(
            "flex items-center gap-2 font-semibold leading-snug text-foreground [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground",
            Heading === "h2" ? "text-base" : "text-sm",
          )}>
            {icon}
            {/* 文節で折り返し、行の長さを揃える (語中で折れない) */}
            <span className="min-w-0 text-balance [word-break:auto-phrase]">
              {number && (
                <span className="mr-2 font-mono text-primary">{number}</span>
              )}
              {title}
            </span>
          </Heading>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex shrink-0 items-center gap-2">{action}</div>
        )}
      </div>
      {/* 線の格子のセルとして置いたときは格子が下の線を引くので、区切り線を出さない (二重線になる) */}
      {!hideRule && <Separator className="in-data-[slot=panel-grid]:hidden" />}
    </div>
  );
}
