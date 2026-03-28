import { logger } from "@stats47/logger";

import { toStackedBarChartData } from "../../../adapters";
import { fetchEstatData } from "../../../services";
import { computeYAxisDomain } from "../../../utils/computeYAxisDomain";
import { DashboardCard } from "../../shared/DashboardCard";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { DivergingBarChartClient } from "./DivergingBarChartClient";

import type { DashboardItemProps } from "../../../types";


/**
 * DivergingBarChartDashboard - 上下対称の縦棒グラフ（ダッシュボード用）
 *
 * estatParams[0] が上方向（正）、estatParams[1] が下方向（負）に描画される。
 */
export const DivergingBarChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<"diverging-bar-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink, annotation, rankingLinks } = common;
  const {
    estatParams, labels, unit: unitProp, yAxisConfig, sharedYDomain,
    rateParams, rateLabels,
  } = config as DashboardItemProps<"diverging-bar-chart">["config"] & { sharedYDomain?: [number, number] };
  const areaCode = area.areaCode;

  if (!estatParams || estatParams.length < 2) {
    return (
      <ErrorDisplay title={title} message="設定エラー: 2系列が必要です" />
    );
  }

  let yDomain: [number, number] | undefined = sharedYDomain;

  try {
    if (!yDomain) {
      yDomain = await computeYAxisDomain({
        yAxisConfig,
        estatParams,
        domainType: "symmetric",
      });
    }

    const responses = await Promise.all(
      estatParams.map((p) => fetchEstatData(areaCode, p)),
    );

    const firstError = responses.find((r) => "error" in r);
    if (firstError && "error" in firstError) {
      return <ErrorDisplay title={title} message={firstError.error} />;
    }

    const rawDataList = responses.map((r) => ("data" in r ? r.data : []));
    const seriesLabels = labels ?? rawDataList.map((d) => d[0]?.categoryName ?? "");
    const chartData = toStackedBarChartData(rawDataList, seriesLabels);

    if (chartData.data.length === 0) {
      return <ErrorDisplay title={title} message="データがありません" />;
    }

    const positiveKey = chartData.series[0].dataKey;
    const negativeKey = chartData.series[1].dataKey;
    const positiveName = chartData.series[0].name;
    const negativeName = chartData.series[1].name;
    const unit = unitProp ?? chartData.unit;

    // 最新年度の値を取得
    const lastRow = chartData.data[chartData.data.length - 1];
    const latestPositive = lastRow ? Number(lastRow[positiveKey]) || 0 : 0;
    const latestNegative = lastRow ? Number(lastRow[negativeKey]) || 0 : 0;
    const latestLabel = lastRow ? (lastRow.label as string) ?? String(lastRow[chartData.categoryKey]) : "";

    // 率データの取得（オプション）
    let positiveRate: number | undefined;
    let negativeRate: number | undefined;
    let positiveRateLabel: string | undefined;
    let negativeRateLabel: string | undefined;
    if (rateParams && rateParams.length >= 2) {
      const rateResponses = await Promise.all(
        rateParams.map((p) => fetchEstatData(areaCode, p)),
      );
      const rateData = rateResponses.map((r) => ("data" in r ? r.data : []));
      const lastPositiveRate = rateData[0]?.[rateData[0].length - 1];
      const lastNegativeRate = rateData[1]?.[rateData[1].length - 1];
      if (lastPositiveRate?.value != null) positiveRate = lastPositiveRate.value;
      if (lastNegativeRate?.value != null) negativeRate = lastNegativeRate.value;
      positiveRateLabel = rateLabels?.[0];
      negativeRateLabel = rateLabels?.[1];
    }

    return (
      <DashboardCard
        title={title}
        rankingLink={rankingLink}
        description={undefined}
        source={sourceName ?? undefined}
        sourceLink={sourceLink}
        sourceDetail={unit}
        annotation={annotation}
        rankingLinks={rankingLinks}
        loading={false}
        error={null}
        empty={false}
      >
        <DivergingBarChartClient
          data={chartData.data}
          categoryKey={chartData.categoryKey}
          positiveKey={positiveKey}
          negativeKey={negativeKey}
          positiveName={positiveName}
          negativeName={negativeName}
          positiveColor="#3b82f6"
          negativeColor="#ef4444"
          unit={unit}
          yDomain={yDomain}
          latestValues={{
            label: latestLabel,
            positive: latestPositive,
            negative: latestNegative,
            positiveName,
            negativeName,
            unit: unit ?? "",
            positiveRate,
            negativeRate,
            positiveRateLabel,
            negativeRateLabel,
          }}
        />
      </DashboardCard>
    );
  } catch (err) {
    logger.error(
      { error: err },
      "DivergingBarChartDashboardのデータ取得に失敗しました",
    );
    return <ErrorDisplay title={title} message="データの取得に失敗しました" />;
  }
};
