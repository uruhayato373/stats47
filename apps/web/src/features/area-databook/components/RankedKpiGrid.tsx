import Link from "next/link";


import { cn } from "@stats47/components";

import { getSurfaceCardClassName } from "@/components/surface";

import type { AreaDatabookSnapshot } from "@stats47/area-profile/server";
import type { DatabookMetricRef } from "@stats47/data-configs";

interface Props {
  metrics: DatabookMetricRef[];
  databook: AreaDatabookSnapshot | null;
  columns?: 2 | 3 | 4;
}

function formatValue(value: number): string {
  // 小数を持つ指標 (割合・倍率) は 1 桁まで、整数系は桁区切り。
  if (Number.isInteger(value)) return value.toLocaleString("ja-JP");
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

function rankTone(rank: number): string {
  if (rank >= 1 && rank <= 10) return "bg-primary/10 text-primary";
  if (rank >= 38 && rank <= 47) return "bg-muted text-muted-foreground";
  return "bg-accent/40 text-foreground";
}

const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "@sm:grid-cols-2",
  3: "@sm:grid-cols-2 @md:grid-cols-3",
  4: "@sm:grid-cols-2 @md:grid-cols-4",
};

/**
 * 値 + 全国順位バッジの KPI グリッド (県データブックの中核ブロック)。
 * 値は R2 databook.json (exporter 焼き込み) から解決する。県軸に閉じ、47 県比較は
 * ラベルの `/ranking/<key>` リンクで回遊させる (情報設計: area は回遊面)。
 */
export function RankedKpiGrid({ metrics, databook, columns = 3 }: Props) {
  const hasCapitalCityValue = metrics.some((m) => m.capitalCityValue);
  const effectiveColumns = Math.min(columns, metrics.length);

  return (
    <div className="@container">
      <dl
        className={getSurfaceCardClassName({
          className: cn(
            "grid grid-cols-1 gap-px overflow-hidden bg-border p-0",
            COLS[effectiveColumns],
          ),
        })}
      >
        {metrics.map((m) => {
          const v = databook?.metrics[m.rankingKey];
          return (
            <div
              key={m.rankingKey}
              className="group flex min-h-16 flex-col justify-between bg-card px-3 py-2.5"
            >
              <dt className="text-xs font-medium leading-snug text-muted-foreground group-hover:text-foreground">
                <Link
                  href={`/ranking/${m.rankingKey}`}
                  className="hover:text-primary hover:underline"
                >
                  {m.shortLabel}
                  {m.capitalCityValue && <span className="text-[10px]">※</span>}
                </Link>
              </dt>
              <dd className="mt-1 flex items-end justify-between gap-2">
                <span className="min-w-0">
                  {v ? (
                    <>
                      <span className="text-base font-bold tabular-nums text-foreground">
                        {formatValue(v.value)}
                      </span>
                      <span className="ml-1 text-[11px] text-muted-foreground">{v.unit}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </span>
                {v && v.rank >= 1 && v.rank <= 47 && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums",
                      rankTone(v.rank),
                    )}
                  >
                    {v.rank}位
                  </span>
                )}
              </dd>
              {v && m.compareNationalAvg && (
                <dd className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">
                  全国平均 {formatValue(v.nationalAvg)}
                  {v.unit}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      {hasCapitalCityValue && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          ※ は県庁所在市の値（家計調査）
        </p>
      )}
    </div>
  );
}
