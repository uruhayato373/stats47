import type { ReactNode } from "react";

import { cn } from "@stats47/components";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { RankBadge, type RankBadgeTone } from "@/components/atoms/RankBadge";
import Link from "@/components/atoms/SiteLink";
import { PanelGrid } from "@/components/layout";
import { STAT_META_CLASS, StatTile } from "@/components/surface";

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

/** 最終行の空きマスの数 (列数 cols で n 枚を並べたとき) */
function remainder(n: number, cols: number): number {
  return (cols - (n % cols)) % cols;
}

/**
 * 最終行の空きマスを白いセルで埋める。線の格子は地が線の色なので、空きマスのままだと灰色の箱に見える。
 * 列数は幅 (コンテナクエリ) で 1 → 2 → 3/4 と変わるので、幅ごとに必要な数だけ出す。
 */
function fillerClassNames(n: number, columns: 1 | 2 | 3 | 4): string[] {
  const wide = columns >= 3 ? remainder(n, columns) : 0;
  const mid = columns >= 2 ? remainder(n, 2) : 0;
  return Array.from({ length: Math.max(wide, mid) }, (_, i) =>
    cn(
      "hidden",
      i < mid && "@sm:block",
      columns >= 3 && (i < wide ? "@md:block" : "@md:hidden"),
    ),
  );
}

/**
 * 「指標名 + 値 + 順位チップ + 年」の数値タイルを線の格子で並べる。指標 1 つ = 数値タイル (StatTile) 1 枚。
 * 県データブック (RankedKpiGrid・GenderPairedKpiGrid) と市区町村ページの見出し KPI が同じ描画を使う。
 * 値と順位の解決は呼び出し側が行う。最終行の空きマスは白いセルで埋める (fillerClassNames)。
 */
export function RankedValueGrid({ items, columns = 3, navSurface, footnote }: Props) {
  if (items.length === 0) return null;
  const effectiveColumns = Math.min(columns, items.length) as 1 | 2 | 3 | 4;

  return (
    <div className="@container">
      <PanelGrid className={cn("grid-cols-1", COLS[effectiveColumns])}>
        {items.map((item) => {
          const v = item.value;
          return (
            <StatTile
              key={item.key}
              label={
                <Link
                  {...navSurfaceProps(navSurface)}
                  href={item.href}
                  className="hover:text-primary hover:underline"
                >
                  {item.label}
                </Link>
              }
              value={v ? formatValue(v.value) : null}
              unit={v ? formatUnitForDisplay(v.unit) : undefined}
              badge={v?.badge && <RankBadge rank={v.badge.rank} tone={v.badge.tone} />}
              // 値だけではいつの値か分からないので年を必ず添える (2026-09-25)
              meta={
                v && (
                  <>
                    {v.year}
                    {v.detail}
                  </>
                )
              }
            />
          );
        })}
        {fillerClassNames(items.length, effectiveColumns).map((className, i) => (
          <div key={`filler-${i}`} aria-hidden="true" data-cell="flush" className={className} />
        ))}
        {/* 注記も格子の 1 行 (パネルと同じ要素に文章を包むと、文章が線に接する) */}
        {footnote && <p className={cn(STAT_META_CLASS, "col-span-full")}>{footnote}</p>}
      </PanelGrid>
    </div>
  );
}
