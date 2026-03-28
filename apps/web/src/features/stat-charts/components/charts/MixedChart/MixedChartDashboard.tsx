import { logger } from "@stats47/logger";

import { toMixedChartData } from "../../../adapters";
import { fetchEstatData } from "../../../services";
import { DashboardCard } from "../../shared/DashboardCard";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { MixedChartClient } from "./MixedChartClient";

import type { DashboardItemProps } from "../../../types";
import type { MixedChartData } from "../../../types/visualization";


export const MixedChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<"mixed-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const { columnParams, lineParams, columnLabels, lineLabels, leftUnit, rightUnit, description, columnColors, lineColors } = config as typeof config & { columnColors?: string[]; lineColors?: string[] };
  const areaCode = area.areaCode;

  let chartData: MixedChartData | null = null;
  let fetchErrorMessage: string | null = null;

  try {
    const [colResponses, lineResponses] = await Promise.all([
      Promise.all(columnParams.map((p) => fetchEstatData(areaCode, p))),
      Promise.all(lineParams.map((p) => fetchEstatData(areaCode, p))),
    ]);

    const allResponses = [...colResponses, ...lineResponses];
    const firstError = allResponses.find((r) => "error" in r);
    if (firstError && "error" in firstError) {
      fetchErrorMessage = firstError.error;
    } else {
      const colData = colResponses.map((r) => ("data" in r ? r.data : []));
      const lineData = lineResponses.map((r) => ("data" in r ? r.data : []));
      const hasAnyData = [...colData, ...lineData].some((d) => d.length > 0);
      if (!hasAnyData) {
        fetchErrorMessage = "データがありません";
      } else {
        chartData = toMixedChartData(colData, lineData, columnLabels, lineLabels, leftUnit, rightUnit, columnColors, lineColors);
      }
    }
  } catch (err) {
    logger.error({ error: err }, "MixedChartDashboardのデータ取得に失敗しました");
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
      loading={false}
      error={null}
      empty={chartData.data.length === 0}
    >
      <MixedChartClient chartData={chartData} />
    </DashboardCard>
  );
};
