import { logger } from "@stats47/logger";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";

import { toLineChartData } from "../../../adapters";
import { fetchEstatData } from "../../../services";
import { computeYAxisDomain } from "../../../utils/computeYAxisDomain";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { LineChartClient } from "./LineChartClient";

import type { DashboardItemProps } from "../../../types";
import type { LineChartData } from "../../../types/visualization";


export const LineChart = async ({
  common,
  config,
}: DashboardItemProps<"line-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink, annotation, rankingLinks } = common;
  const { estatParams, labels, description, yAxisConfig, sharedYDomain, seriesColors, showLatestValues } = config as DashboardItemProps<"line-chart">["config"] & { sharedYDomain?: [number, number]; seriesColors?: string[] };
  const areaCode = area.areaCode;
  const paramsList = Array.isArray(estatParams) ? estatParams : [estatParams];

  let chartData: LineChartData | null = null;
  let fetchErrorMessage: string | null = null;
  let yDomain: [number, number] | undefined = sharedYDomain;

  try {
    if (!yDomain) {
      yDomain = await computeYAxisDomain({
        yAxisConfig,
        estatParams: paramsList,
        domainType: "minMax",
      });
    }

    const responses = await Promise.all(
      paramsList.map((p) => fetchEstatData(areaCode, p))
    );

    const firstError = responses.find((r) => "error" in r);
    if (firstError && "error" in firstError) {
      fetchErrorMessage = firstError.error;
    } else {
      const rawDataList = responses.map((r) => ("data" in r ? r.data : []));
      const hasAnyData = rawDataList.some((d) => d.length > 0);
      if (!hasAnyData) {
        fetchErrorMessage = "データがありません";
      } else {
        chartData = toLineChartData(rawDataList, labels, seriesColors);
      }
    }
  } catch (err) {
    logger.error({ error: err }, "LineChartのデータ取得に失敗しました");
    fetchErrorMessage = "データの取得に失敗しました";
  }

  if (fetchErrorMessage) {
    return <ErrorDisplay title={title} message={fetchErrorMessage} />;
  }

  if (!chartData) {
    return <ErrorDisplay title={title} message="データがありません" />;
  }

  return (
    <ChartPanel
      title={title}
      description={description}
      footer={
        <ChartFooter
          source={sourceName ?? undefined}
          sourceLink={sourceLink}
          sourceLinks={common.sourceLinks}
          annotation={annotation}
          rankingLink={rankingLink}
          rankingLinks={rankingLinks}
        />
      }
    >
      <LineChartClient chartData={chartData} yDomain={yDomain} showLatestValues={showLatestValues} />
    </ChartPanel>
  );
};
