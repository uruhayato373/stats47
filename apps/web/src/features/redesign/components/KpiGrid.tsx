import type { ReactNode } from "react";

interface KpiGridProps {
  children: ReactNode;
  /** 列数（デスクトップ） — 通常 2 (2x2 = 4枚) or 3 (3x1) */
  columns?: 2 | 3;
}

/**
 * D-System KPI グリッド（ヒーロー右側に置く 4 タイル等を並べる）
 *
 * - desktop: columns 列固定
 * - mobile: 2 列固定（モバイル「適度な品質」方針）
 */
export function KpiGrid({ children, columns = 2 }: KpiGridProps) {
  const cols = columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
  return (
    <div className={`grid grid-cols-2 gap-2.5 ${cols}`}>{children}</div>
  );
}
