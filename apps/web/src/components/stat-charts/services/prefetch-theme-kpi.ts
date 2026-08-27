import {
  parseStatSeriesRefs,
  type StatSeriesRef,
} from "@stats47/data-configs/theme-catalog";
import { logger } from "@stats47/logger";
import { readJapanSeries, readStatsValues } from "@stats47/stats-r2/readers";
import { resolveValuePrecision } from "@stats47/utils";

import { toKpiCardData } from "../adapters";

import { fetchEstatDataAllAreas } from "./fetchEstatData";

import type { KpiCardClientProps } from "../components";
import type { PageComponent } from "./load-page-components";
import type { GetStatsDataParams } from "@stats47/estat-api/server";
import type { StatsSchema } from "@stats47/types";

/**
 * テーマページ用: KPI カードの観測値を全都道府県分プリフェッチ
 *
 * 移行済み card は StatSeriesRef → QG2 parser 付き R2 reader、未移行 card は estatParams を読む。
 * どちらも areaCode ごとの KpiCardClientProps に変換する。
 *
 * @returns Record<chartKey, Record<areaCode, KpiCardClientProps>>
 */
export async function prefetchThemeKpiData(
  pageCharts: PageComponent[],
): Promise<Record<string, Record<string, KpiCardClientProps>>> {
  const kpiCharts = pageCharts.filter((c) => c.componentType === "kpi-card");
  if (kpiCharts.length === 0) return {};

  const results: Record<string, Record<string, KpiCardClientProps>> = {};

  await Promise.all(
    kpiCharts.map(async (chart) => {
      const props = parseKpiCardProps(chart.componentProps);
      if (!props) return;

      try {
        const data = await loadKpiRows(props);
        if (!data) return;

        // areaCode ごとにグループ化
        const byArea = new Map<string, StatsSchema[]>();
        for (const item of data) {
          const group = byArea.get(item.areaCode) ?? [];
          group.push(item);
          byArea.set(item.areaCode, group);
        }

        const kpisByArea = Array.from(byArea, ([areaCode, areaData]) => ({
          areaCode,
          kpi: toKpiCardData(areaData),
        }));
        const precision = resolveValuePrecision(
          kpisByArea.flatMap(({ kpi }) =>
            typeof kpi.value === "number" ? [kpi.value] : [],
          ),
        );

        const areaKpis: Record<string, KpiCardClientProps> = {};
        for (const { areaCode, kpi } of kpisByArea) {
          areaKpis[areaCode] = {
            title: chart.title,
            value: kpi.value,
            unit: kpi.unit ?? props.unit ?? "",
            year: kpi.year,
            changeRate: kpi.changeRate,
            changeDirection: kpi.changeDirection,
            precision,
          };
        }

        results[chart.componentKey] = areaKpis;
      } catch (err) {
        logger.warn(
          { error: err, chartKey: chart.componentKey },
          "テーマ KPI プリフェッチ失敗",
        );
      }
    }),
  );

  return results;
}

function parseKpiCardProps(
  props: Record<string, unknown>,
):
  | { source: "r2"; seriesRef: StatSeriesRef; unit?: string }
  | { source: "estat"; estatParams: GetStatsDataParams; unit?: string }
  | null {
  const refs = parseStatSeriesRefs(props.seriesRefs);
  if (refs?.length === 1) {
    return {
      source: "r2",
      seriesRef: refs[0],
      unit: typeof props.unit === "string" ? props.unit : undefined,
    };
  }
  if (!isRecord(props.estatParams)) return null;
  if (typeof props.estatParams.statsDataId !== "string") return null;

  return {
    source: "estat",
    estatParams: props.estatParams as unknown as GetStatsDataParams,
    unit: typeof props.unit === "string" ? props.unit : undefined,
  };
}

async function loadKpiRows(
  props:
    | { source: "r2"; seriesRef: StatSeriesRef }
    | { source: "estat"; estatParams: GetStatsDataParams },
): Promise<StatsSchema[] | null> {
  if (props.source === "estat") {
    const response = await fetchEstatDataAllAreas(props.estatParams);
    return "error" in response ? null : response.data;
  }

  const { metricKey, year } = props.seriesRef;
  const [prefecturePayload, japanPayload] = await Promise.all([
    readStatsValues(metricKey, "prefecture"),
    readJapanSeries(metricKey),
  ]);
  if (!prefecturePayload) return null;

  const prefectureRows = prefecturePayload.rows
    .filter((row) => year === undefined || row.yearCode === year)
    .map(
      (row): StatsSchema => ({
        ...row,
        metricKey,
        unit: row.unit ?? "",
      }),
    );
  const nationalRows = (japanPayload?.rows ?? [])
    .filter((row) => year === undefined || row.yearCode === year)
    .map(
      (row): StatsSchema => ({
        areaCode: "00000",
        areaName: "全国",
        yearCode: row.yearCode,
        yearName: row.yearName,
        metricKey,
        value: row.value,
        unit: row.unit,
      }),
    );

  return [...prefectureRows, ...nationalRows];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
