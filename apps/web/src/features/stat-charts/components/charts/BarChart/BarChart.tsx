import React from "react";

import { logger } from "@stats47/logger";

import { fetchEstatData } from "../../../services";
import { toBarChartData } from "../../../adapters";
import { computeYAxisDomain } from "../../../utils/computeYAxisDomain";
import { DashboardCard } from "../../shared/DashboardCard";

import { BarChartClient } from "./BarChartClient";

import type { DashboardItemProps } from "../../../types";
import type { BarChartData } from "../../../types/visualization";

import { ErrorDisplay } from "../../shared/ErrorDisplay";

/**
 * 汎用棒グラフ（ダッシュボード用）
 * 通常の棒グラフと積み上げ棒グラフの両方に対応（D3 描画）
 */
export const DashboardBarChart = async ({
  common,
  config,
}: DashboardItemProps<"bar-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const {
    estatParams,
    labels,
    unit: unitProp,
    chartType = "stacked-bar",
    yAxisConfig,
  } = config;
  const areaCode = area.areaCode;

  if (!estatParams?.length) {
    return (
      <ErrorDisplay title={title} message="設定エラー: 系列が未設定です" />
    );
  }

  let chartData: BarChartData | null = null;
  let fetchErrorMessage: string | null = null;
  let xDomain: [number, number] | undefined;

  try {
    xDomain = await computeYAxisDomain({
      yAxisConfig,
      estatParams,
      domainType: "zeroMax",
    });

    const responses = await Promise.all(
      estatParams.map((p) => fetchEstatData(areaCode, p))
    );

    const firstError = responses.find((r) => "error" in r);
    if (firstError && "error" in firstError) {
      fetchErrorMessage = firstError.error;
    } else {
      const rawDataList = responses.map((r) => ("data" in r ? r.data : []));
      chartData = toBarChartData(rawDataList, labels, chartType);
      if (chartData.data.length === 0) {
        fetchErrorMessage = "データがありません";
      }
    }
  } catch (err) {
    logger.error(
      { error: err },
      "DashboardBarChartのデータ取得に失敗しました"
    );
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
      description={undefined}
      source={sourceName ?? undefined}
      sourceLink={sourceLink}
      sourceDetail={unitProp}
      loading={false}
      error={null}
      empty={chartData.data.length === 0}
    >
      <BarChartClient chartData={chartData} chartType={chartType} xDomain={xDomain} />
    </DashboardCard>
  );
};
