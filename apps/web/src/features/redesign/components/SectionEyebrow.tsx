import type { ReactNode } from "react";

interface SectionEyebrowProps {
  /** セクション番号（"1." 等） */
  number?: string;
  /** セクション見出し */
  children: ReactNode;
  /** 右側のアクション (見出しと同行に右寄せ) */
  action?: ReactNode;
  /** 追加クラス */
  className?: string;
}

/**
 * D-System セクション小見出し
 *
 * "1. xxx" 形式の番号付き eyebrow + 右側 action（"すべて見る ›" 等）。
 */
export function SectionEyebrow({
  number,
  children,
  action,
  className = "",
}: SectionEyebrowProps) {
  return (
    <div className={"mb-2.5 flex items-center justify-between " + className}>
      <p className="text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
        {number && <span className="mr-1.5 text-primary">{number}</span>}
        {children}
      </p>
      {action && <div className="text-xs text-muted-foreground">{action}</div>}
    </div>
  );
}
