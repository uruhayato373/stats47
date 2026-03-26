import React from "react";

import { logger } from "@stats47/logger";

import { fetchEstatData } from "../../../services";
import { toLineChartData } from "../../../adapters";
import { computeYAxisDomain } from "../../../utils/computeYAxisDomain";
import { DashboardCard } from "../../shared/DashboardCard";

import { LineChartClient } from "./LineChartClient";

import type { DashboardItemProps } from "../../../types";
import type { LineChartData } from "../../../types/visualization";

import { ErrorDisplay } from "../../shared/ErrorDisplay";

export const LineChart = async ({
  common,
  config,
}: DashboardItemProps<"line-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink, annotation, rankingLinks } = common;
  const { estatParams, labels, description, yAxisConfig, sharedYDomain, seriesColors } = config as DashboardItemProps<"line-chart">["config"] & { sharedYDomain?: [number, number]; seriesColors?: string[] };
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
    <DashboardCard
      title={title}
      rankingLink={rankingLink}
      description={description}
      source={sourceName ?? undefined}
      sourceLink={sourceLink}
      annotation={annotation}
      rankingLinks={rankingLinks}
      loading={false}
      error={null}
      empty={chartData.data.length === 0}
    >
      <LineChartClient chartData={chartData} yDomain={yDomain} />
    </DashboardCard>
  );
};
