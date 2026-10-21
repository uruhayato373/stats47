import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { rankToneByPosition } from "@/components/atoms/RankBadge";

import { RankedValueGrid } from "./RankedValueGrid";

import type { AreaDatabookSnapshot } from "@stats47/area-profile/server";
import type { DatabookMetricRef } from "@stats47/data-configs";

interface Props {
  metrics: DatabookMetricRef[];
  databook: AreaDatabookSnapshot | null;
  columns?: 2 | 3 | 4;
}

/** 都道府県の数。全国順位のチップはこの範囲の順位にだけ付ける。 */
const PREFECTURE_COUNT = 47;

function formatAverage(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("ja-JP");
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 1 });
}

/**
 * 値 + 全国順位バッジの KPI グリッド (県データブックの中核ブロック)。
 * 値は R2 databook.json (exporter 焼き込み) から解決する。県軸に閉じ、47 県比較は
 * ラベルの `/ranking/<key>` リンクで回遊させる (情報設計: area は回遊面)。
 */
export function RankedKpiGrid({ metrics, databook, columns = 3 }: Props) {
  // 観測値の無い指標は「—」の箱を並べず、項目ごと出さない。
  const visible = databook
    ? metrics.filter((m) => databook.metrics[m.rankingKey])
    : metrics;
  const hasCapitalCityValue = visible.some((m) => m.capitalCityValue);

  return (
    <RankedValueGrid
      columns={columns}
      navSurface="area_databook"
      footnote={hasCapitalCityValue ? "※ は県庁所在市の値（家計調査）" : undefined}
      items={visible.map((m) => {
        const v = databook?.metrics[m.rankingKey];
        return {
          key: m.rankingKey,
          href: `/ranking/${m.rankingKey}`,
          label: (
            <>
              {m.shortLabel}
              {m.capitalCityValue && <span className="text-[10px]">※</span>}
            </>
          ),
          value: v && {
            value: v.value,
            unit: v.unit,
            year: v.year,
            badge:
              v.rank >= 1 && v.rank <= PREFECTURE_COUNT
                ? { rank: v.rank, tone: rankToneByPosition(v.rank) }
                : undefined,
            detail: m.compareNationalAvg && (
              <>
                {/* 単純平均を「全国平均」と書かない (率の指標では全国の値と違う。AREA-NATIONAL-AVG-SIMPLE-MEAN-01) */}
                {v.nationalAvgKind === "national" ? " ・ 全国 " : " ・ 47都道府県平均 "}
                {formatAverage(v.nationalAvg)}
                {formatUnitForDisplay(v.unit)}
              </>
            ),
          },
        };
      })}
    />
  );
}
