import { type ReactNode } from "react";

import { cn } from "../lib/cn";

import { SurfaceCard } from "./surface";

/*
 * 数値タイル (部品の種類「数値タイル」)。見本 (テンプレートの KPI カード。dashboards/modern/total-orders.tsx) と同じく、
 * 名前 14px → 値 24px / 32px・600 (右に単位とバッジ) → 補足 12px の順に並べ、余白は 16px の 1 種類にする。
 * 仕様: docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」の「数値タイル」。
 *
 * パネルの中で大きな数値を 1 つ見せる所 (テーマの指標カード・ランキング詳細の平均など) も、値の書式は
 * 下の定数を使う (@stats47/components から import)。ページの側で text-xl / text-3xl などの大きさを書かない (`design-system:check` の stat-value-uses-shared-class)。
 */

/** 指標の名前 */
export const STAT_LABEL_CLASS = "text-sm leading-5 text-foreground";

/** 値 (24px / 32px・600・等幅数字) */
export const STAT_VALUE_CLASS = "text-2xl leading-8 font-semibold tabular-nums text-foreground";

/** 値の直後の単位 */
export const STAT_UNIT_CLASS = "ml-1 text-sm font-normal text-muted-foreground";

/** 年・全国平均・順位などの補足の 1 行 */
export const STAT_META_CLASS = "text-xs tabular-nums text-muted-foreground";

interface StatTileProps {
  /** 指標の名前 (リンクにするときは呼び出し側で Link を渡す) */
  label: ReactNode;
  /** 表示用に整形した値。null は「—」 */
  value: ReactNode | null;
  unit?: ReactNode;
  /** 値の右に置くバッジ (順位チップ・増減など) */
  badge?: ReactNode;
  /** 値の下の補足 (年・全国平均など) */
  meta?: ReactNode;
  /** 右上の小さなアイコン (lucide) */
  icon?: ReactNode;
  /** 値の下に置く小さなチャートなど */
  children?: ReactNode;
  className?: string;
}

export function StatTile({
  label,
  value,
  unit,
  badge,
  meta,
  icon,
  children,
  className,
}: StatTileProps) {
  return (
    <SurfaceCard data-slot-kind="stat-tile" className={cn("gap-3", className)}>
      <div className="flex items-start justify-between gap-3">
        <dl className="flex min-w-0 flex-col gap-1">
          <dt className={STAT_LABEL_CLASS}>{label}</dt>
          <dd className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {value === null ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              <span className={STAT_VALUE_CLASS}>
                {value}
                {unit ? <span className={STAT_UNIT_CLASS}>{unit}</span> : null}
              </span>
            )}
            {badge}
          </dd>
          {meta ? <dd className={STAT_META_CLASS}>{meta}</dd> : null}
        </dl>
        {icon ? (
          <span
            aria-hidden="true"
            className="flex shrink-0 rounded-md border border-border p-2.5 text-muted-foreground [&_svg]:size-4"
          >
            {icon}
          </span>
        ) : null}
      </div>
      {children}
    </SurfaceCard>
  );
}
