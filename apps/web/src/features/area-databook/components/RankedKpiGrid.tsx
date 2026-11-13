import { getMetricConfig, type DatabookMetricRef } from "@stats47/data-configs";
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatChartValue, formatUnitForDisplay } from "@stats47/data-configs/unit";
import { resolveRankingValueDisplay } from "@stats47/ranking";

import { rankToneByPosition } from "@/components/atoms/RankBadge";

import { RankedValueGrid } from "./RankedValueGrid";

import type { AreaDatabookSnapshot } from "@stats47/area-profile/server";

interface Props {
  metrics: DatabookMetricRef[];
  databook: AreaDatabookSnapshot | null;
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
 * 値はランキングのページと同じ決め方 (`resolveRankingValueDisplay`: 定義の表示単位、無ければ図の規則) で表示単位に寄せる。
 * 値と比較の値 (全国の値・47 都道府県平均) は同じタイルに並ぶので、2 つで 1 つの単位を選ぶ (2026-11-14)。
 */
export function RankedKpiGrid({ metrics, databook }: Props) {
  // 観測値の無い指標は「—」の箱を並べず、項目ごと出さない。
  const visible = databook
    ? metrics.filter((m) => databook.metrics[m.rankingKey])
    : metrics;
  const hasCapitalCityValue = visible.some((m) => m.capitalCityValue);

  return (
    <RankedValueGrid
      navSurface="area_databook"
      footnote={hasCapitalCityValue ? "※ は県庁所在市の値（家計調査）" : undefined}
      items={visible.map((m) => {
        const v = databook?.metrics[m.rankingKey];
        const display = v
          ? resolveRankingValueDisplay(
              { unit: v.unit, valueDisplay: getMetricConfig(m.rankingKey)?.display },
              m.compareNationalAvg ? [v.value, v.nationalAvg] : [v.value],
            )
          : null;
        return {
          key: m.rankingKey,
          href: hrefFor("ranking", { rankingKey: m.rankingKey }),
          label: (
            <>
              {m.shortLabel}
              {m.capitalCityValue && <span className="text-[10px]">※</span>}
            </>
          ),
          value: v && {
            value: v.value,
            unit: v.unit,
            display,
            year: v.year,
            badge:
              v.rank >= 1 && v.rank <= PREFECTURE_COUNT
                ? { rank: v.rank, tone: rankToneByPosition(v.rank) }
                : undefined,
            detail: m.compareNationalAvg && (
              <>
                {/* 単純平均を「全国平均」と書かない (率の指標では全国の値と違う。AREA-NATIONAL-AVG-SIMPLE-MEAN-01) */}
                {v.nationalAvgKind === "national" ? " ・ 全国 " : " ・ 47都道府県平均 "}
                {display
                  ? `${formatChartValue(v.nationalAvg, { factor: display.factor, decimals: display.precision })}${display.unit}`
                  : `${formatAverage(v.nationalAvg)}${formatUnitForDisplay(v.unit)}`}
              </>
            ),
          },
        };
      })}
    />
  );
}
