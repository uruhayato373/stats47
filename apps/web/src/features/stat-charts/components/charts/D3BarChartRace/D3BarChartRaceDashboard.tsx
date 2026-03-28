import { logger } from "@stats47/logger";


import { toBarChartRaceData } from "../../../adapters";
import { fetchEstatData } from "../../../services";
import { DashboardCard } from "../../shared/DashboardCard";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { D3BarChartRaceClient } from "./D3BarChartRaceClient";

import type { DashboardItemProps } from "../../../types";
import type { BarChartRaceFrame } from "@stats47/visualization/d3";

export async function D3BarChartRaceDashboard({
  common,
  config,
}: DashboardItemProps<"bar-chart-race">) {
  const areaCode = common.area.areaCode;
  const { estatParams, unit, description, aspectRatio } = config;

  let data: BarChartRaceFrame[] = [];
  let fetchErrorMessage: string | null = null;

  try {
    const result = await fetchEstatData(areaCode, estatParams);
    if ("error" in result) {
      fetchErrorMessage = result.error;
    } else {
      data = toBarChartRaceData(result.data);
    }
  } catch (err) {
    logger.error(
      { error: err },
      "BarChartRaceDashboardのデータ取得に失敗しました"
    );
    fetchErrorMessage = "データの取得に失敗しました";
  }

  if (fetchErrorMessage) {
    return <ErrorDisplay title={common.title} message={fetchErrorMessage} />;
  }

  return (
    <DashboardCard
      title={common.title}
      rankingLink={common.rankingLink}
      description={description}
      source={common.sourceName ?? undefined}
      sourceLink={common.sourceLink}
      loading={false}
      error={null}
      empty={data.length === 0}
    >
      <D3BarChartRaceClient data={data} unit={unit} aspectRatio={aspectRatio} />
    </DashboardCard>
  );
}
