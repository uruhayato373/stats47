"use client";

import { useMemo } from "react";

import { DivergingChoroplethMap, type DivergingChoroplethValue } from "@stats47/visualization/d3/DivergingChoroplethMap";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";

import type { ComparisonRegion } from "../types";
import type { TopoJSONTopology } from "@stats47/types";

/** 東京島嶼部の除外コード */
const TOKYO_ISLAND_CODES = new Set([
  "13000",
  "13361", "13362", "13363", "13364",
  "13381", "13382",
  "13401", "13402",
  "13421",
]);

/** 人口増減率データ */
export interface PopulationRatioEntry {
  areaCode: string;
  areaName: string;
  ratio: number;
}

/** 1都道府県分のマップデータ */
export interface PrefChoroplethData {
  topo: TopoJSONTopology;
  ratios: PopulationRatioEntry[];
}

/** サーバーサイドで取得済みのマップデータ（エリアコードをキーとする） */
export interface ChoroplethMapData {
  [areaCode: string]: PrefChoroplethData;
}

interface Props {
  regions: [ComparisonRegion, ComparisonRegion];
  mapData: ChoroplethMapData;
}

/**
 * 市区町村別人口増減率コロプレスマップ
 *
 * population カテゴリの比較ページにのみ表示。
 * データはサーバーサイドで取得済み。
 */
export function MunicipalityChoroplethSection({ regions, mapData }: Props) {
  const panels = regions.map((region) => {
    const data = mapData[region.areaCode];
    if (!data) return null;
    const excludeCodes =
      region.areaCode === "13000" ? TOKYO_ISLAND_CODES : new Set<string>();
    return { region, excludeCodes, ...data };
  });

  if (panels.some((p) => p === null)) return null;

  // 全 ratio を集めて共通カラースケールの domain を決定
  const allRatios = Object.values(mapData).flatMap((d) =>
    d.ratios.map((r) => r.ratio),
  );
  const maxAbs = Math.max(...allRatios.map((r) => Math.abs(r - 1)));

  return (
    <section className="space-y-4">
      <h3 className="text-lg font-bold text-foreground">
        市区町村別 人口増減率（2025→2045）
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {panels.map(
          (panel) =>
            panel && (
              <ChartPanel
                key={panel.region.areaCode}
                title={panel.region.areaName}
                footer={
                  <ChartFooter
                    source="日本の地域別将来推計人口（令和5年推計）"
                    sourceLink="https://www.ipss.go.jp/pp-shicyoson/j/shicyoson23/t-page.asp"
                  />
                }
              >
                <PanelMap
                  topo={panel.topo}
                  ratios={panel.ratios}
                  excludeCodes={panel.excludeCodes}
                  colorClamp={maxAbs}
                  regionName={panel.region.areaName}
                />
              </ChartPanel>
            ),
        )}
      </div>
    </section>
  );
}

function PanelMap({
  topo,
  ratios,
  excludeCodes,
  colorClamp,
  regionName,
}: {
  topo: TopoJSONTopology;
  ratios: PopulationRatioEntry[];
  excludeCodes: Set<string>;
  colorClamp: number;
  regionName: string;
}) {
  const valueByCode = useMemo(() => {
    const m = new Map<string, DivergingChoroplethValue>();
    for (const r of ratios) {
      m.set(r.areaCode, { name: r.areaName, ratio: r.ratio });
    }
    return m;
  }, [ratios]);

  return (
    <DivergingChoroplethMap
      // topojson-specification Topology and @stats47/types TopoJSONTopology are structurally compatible
      topology={topo as unknown as import("topojson-specification").Topology}
      valueByCode={valueByCode}
      codeProp="N03_007"
      nameProp="N03_004"
      colorClamp={colorClamp}
      projection={{
        mode: "fitExtent",
        padding: 20,
        viewBoxW: 640,
        viewBoxH: 360,
      }}
      excludeCodes={excludeCodes}
      valueFormatter={(ratio) => {
        const pct = (ratio - 1) * 100;
        return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
      }}
      showLegend
      ariaLabel={`${regionName} 市区町村別人口増減率マップ`}
    />
  );
}
