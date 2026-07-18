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
  2: "@sm:grid-cols-2",
  3: "@sm:grid-cols-2 @lg:grid-cols-3",
  4: "@sm:grid-cols-2 @lg:grid-cols-4",
};

/**
 * 値 + 全国順位バッジの KPI グリッド (県データブックの中核ブロック)。
 * 値は R2 databook.json (exporter 焼き込み) から解決する。県軸に閉じ、47 県比較は
 * ラベルの `/ranking/<key>` リンクで回遊させる (情報設計: area は回遊面)。
 */
export function RankedKpiGrid({ metrics, databook, columns = 3 }: Props) {
  const hasCapitalCityValue = metrics.some((m) => m.capitalCityValue);

  return (
    <div className="@container">
      <div className={cn("grid grid-cols-1 gap-2", COLS[columns])}>
        {metrics.map((m) => {
          const v = databook?.metrics[m.rankingKey];
          return (
            <Link
              key={m.rankingKey}
              href={`/ranking/${m.rankingKey}`}
              className={getSurfaceCardClassName({
                interactive: true,
                className: "flex flex-col justify-between p-3",
              })}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground leading-snug">
                  {m.shortLabel}
                  {m.capitalCityValue && <span className="text-[10px]">※</span>}
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
              </div>
              <div className="mt-2">
                {v ? (
                  <>
                    <span className="text-lg font-bold tabular-nums text-foreground">
                      {formatValue(v.value)}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">{v.unit}</span>
                    {m.compareNationalAvg && (
                      <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                        全国平均 {formatValue(v.nationalAvg)}
                        {v.unit}
                      </p>
                    )}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
      {hasCapitalCityValue && (
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          ※ は県庁所在市の値（家計調査）
        </p>
      )}
    </div>
  );
}
