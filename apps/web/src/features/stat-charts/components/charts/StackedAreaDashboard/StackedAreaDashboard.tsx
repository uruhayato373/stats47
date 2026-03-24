import React from "react";

import { logger } from "@stats47/logger";

import { fetchEstatData } from "../../../services";
import { toStackedAreaData } from "../../../adapters";
import { computeYAxisDomain } from "../../../utils/computeYAxisDomain";
import { DashboardCard } from "../../shared/DashboardCard";

import { StackedAreaDashboardClient } from "./StackedAreaDashboardClient";

import type { DashboardItemProps } from "../../../types";
import type { StackedAreaData } from "../../../adapters/toStackedAreaData";

import { ErrorDisplay } from "../../shared/ErrorDisplay";

export const StackedAreaDashboard = async ({
  common,
  config,
}: DashboardItemProps<"stacked-area">) => {
  const { title, area, rankingLink, sourceName, sourceLink, annotation, rankingLinks } = common;
  const { estatParams, labels, normalize, description, yAxisConfig, sharedYDomain } = config as DashboardItemProps<"stacked-area">["config"] & { sharedYDomain?: [number, number] };
  const areaCode = area.areaCode;

  let chartData: StackedAreaData | null = null;
  let fetchErrorMessage: string | null = null;
  let yDomain: [number, number] | undefined = sharedYDomain;

  try {
    if (!yDomain && !normalize) {
      yDomain = await computeYAxisDomain({
        yAxisConfig,
        estatParams,
        domainType: "stackedMax",
      });
    }

    const responses = await Promise.all(
      estatParams.map((p) => fetchEstatData(areaCode, p))
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
        chartData = toStackedAreaData(rawDataList, labels);
      }
    }
  } catch (err) {
    logger.error({ error: err }, "StackedAreaDashboardのデータ取得に失敗しました");
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
      <StackedAreaDashboardClient chartData={chartData} normalize={normalize} yDomain={yDomain} />
    </DashboardCard>
  );
};
