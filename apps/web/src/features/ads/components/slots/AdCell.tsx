import { type ReactNode } from "react";

import { cn } from "@stats47/components";

/**
 * 本文の広告のセル (2026-10-30 オーナー決定「案 A: 線の格子の 1 セル」)。
 *
 * 本文の AdSense (記事内・関連コンテンツ型) と PR の列は全てこの形にする: 左上に小さな「広告」か「PR」、
 * 中身は中央。枠の線は描かない (本文の線の格子がセルの間に線を引く)。
 * 旧: 「── 広告 ──」の区切り / 題名「広告」のカード / バナーごとの「PR」と、広告の種類ごとに外枠が違っていた。
 * 右レールの広告も同じセル (2026-10-31 オーナー判断「広告や PR というカードで囲む必要はない」で見出し「広告」のカードをやめた)。
 */
export function AdCell({
  label,
  className,
  children,
}: {
  /** 「広告」= AdSense、「PR」= アフィリエイト (景品表示法のステマ告示の表示を兼ねる) */
  label: "広告" | "PR";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div data-ad-cell={label} className={cn("flex flex-col gap-2 p-4", className)}>
      <span className="text-xs font-medium leading-none text-muted-foreground">{label}</span>
      <div className="flex w-full justify-center">{children}</div>
    </div>
  );
}
