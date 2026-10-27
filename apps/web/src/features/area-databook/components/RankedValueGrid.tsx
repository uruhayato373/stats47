import type { ReactNode } from "react";

import { cn } from "@stats47/components";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { RankBadge, type RankBadgeTone } from "@/components/atoms/RankBadge";
import Link from "@/components/atoms/SiteLink";
import { getSurfaceCardClassName } from "@/components/surface";

import { navSurfaceProps, type NavSurface } from "@/lib/analytics/events";


export interface RankedValueGridItem {
  key: string;
  label: ReactNode;
  href: string;
  /** 値が無い指標は「—」の箱になる。箱ごと出さないかは呼び出し側が決める。 */
  value?: {
    value: number;
    unit: string;
    year?: string;
    /** 順位チップ。無ければチップを出さない。 */
    badge?: { rank: number; tone: RankBadgeTone };
    /** 年の後ろに続ける補足 (「・全国 12位」など)。 */
    detail?: ReactNode;
  };
}

interface Props {
  items: readonly RankedValueGridItem[];
  columns?: 2 | 3 | 4;
  navSurface: NavSurface;
  footnote?: ReactNode;
}

/** これより小さい小数は 2 桁まで出す (財政力指数 0.81 を「0.8」に丸めない)。 */
const SMALL_VALUE_LIMIT = 10;

function formatValue(value: number): string {
  // 小数を持つ指標 (割合・倍率) は 1 桁まで (10 未満は 2 桁まで)、整数系は桁区切り。
  if (Number.isInteger(value)) return value.toLocaleString("ja-JP");
  return value.toLocaleString("ja-JP", {
    maximumFractionDigits: Math.abs(value) < SMALL_VALUE_LIMIT ? 2 : 1,
  });
}

const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "@sm:grid-cols-2",
  3: "@sm:grid-cols-2 @md:grid-cols-3",
  4: "@sm:grid-cols-2 @md:grid-cols-4",
};

/**
 * 「指標名 + 値 + 順位チップ + 年」の KPI グリッド。指標 1 つ = カード 1 枚
 * (テンプレートの KPI カードと同じ並び)。県データブック (RankedKpiGrid) と
 * 市区町村ページの見出し KPI が同じ描画を使う。値と順位の解決は呼び出し側が行う。
 *
 * 2026-10-28: 旧来の gap-px + bg-border の表型グリッドは、最終行の空きマスが灰色の箱に見え、
 * 段数ごとの埋め草が要った。カードを gap で並べる形にして空きマスそのものを無くした。
 */
export function RankedValueGrid({ items, columns = 3, navSurface, footnote }: Props) {
  if (items.length === 0) return null;
  const effectiveColumns = Math.min(columns, items.length) as 1 | 2 | 3 | 4;

  return (
    <div className="@container">
      <dl className={cn("grid grid-cols-1 gap-3", COLS[effectiveColumns])}>
        {items.map((item) => {
          const v = item.value;
          return (
            <div
              key={item.key}
              className={getSurfaceCardClassName({
                className: "group flex min-h-16 flex-col justify-between px-3 py-2.5",
              })}
            >
              <dt className="text-xs font-medium leading-snug text-muted-foreground group-hover:text-foreground">
                <Link
                  {...navSurfaceProps(navSurface)}
                  href={item.href}
                  className="hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              </dt>
              <dd className="mt-1 flex items-end justify-between gap-2">
                <span className="min-w-0">
                  {v ? (
                    <>
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {formatValue(v.value)}
                      </span>
                      <span className="ml-1 text-[11px] text-muted-foreground">{formatUnitForDisplay(v.unit)}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </span>
                {v?.badge && <RankBadge rank={v.badge.rank} tone={v.badge.tone} />}
              </dd>
              {/* 値だけではいつの値か分からないので年を必ず添える (2026-09-25) */}
              {v && (
                <dd className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  {v.year}
                  {v.detail}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      {footnote && <p className="mt-1.5 text-[10px] text-muted-foreground">{footnote}</p>}
    </div>
  );
}
