import type { ReactNode } from "react";

import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { RankBadge, type RankBadgeTone } from "@/components/atoms/RankBadge";
import Link from "@/components/atoms/SiteLink";
import { StatTile, StatTileGrid } from "@/components/surface";

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

/**
 * 「指標名 + 値 + 順位チップ + 年」の数値タイルを線の格子で並べる。指標 1 つ = 数値タイル (StatTile) 1 枚。
 * 県データブック (RankedKpiGrid・GenderPairedKpiGrid) と市区町村ページの見出し KPI が同じ描画を使う。
 * 値と順位の解決は呼び出し側が行う。列の数と最終行の空きマスは数値タイルの格子 (StatTileGrid) が決める。
 */
export function RankedValueGrid({ items, navSurface, footnote }: Props) {
  if (items.length === 0) return null;

  return (
      <StatTileGrid footnote={footnote}>
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
      </StatTileGrid>
  );
}
