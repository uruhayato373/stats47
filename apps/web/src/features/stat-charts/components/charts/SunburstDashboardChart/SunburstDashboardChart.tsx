import React from "react";

import { logger } from "@stats47/logger";

import { fetchEstatDataWithCategories } from "../../../services";
import { toSunburstData } from "../../../adapters";
import { DashboardCard } from "../../shared/DashboardCard";

import { SunburstChartClient } from "./SunburstChartClient";

import type { DashboardItemProps } from "../../../types";
import type { HierarchyData } from "../../../types/visualization";

import { ErrorDisplay } from "../../shared/ErrorDisplay";

export const SunburstDashboardChart = async ({
  common,
  config,
}: DashboardItemProps<"sunburst">) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const { description, statsDataId, rootCode, childCodes, ...rest } = config;
  const areaCode = area.areaCode;

  let data: HierarchyData | null = null;
  let fetchErrorMessage: string | null = null;

  try {
    const categoryCodes = [rootCode, ...childCodes];
    const result = await fetchEstatDataWithCategories(
      areaCode,
      statsDataId,
      categoryCodes
    );
    if ("error" in result) {
      fetchErrorMessage = result.error;
    } else {
      data = toSunburstData(result.data, {
        rootCode,
        childCodes,
        groups: rest.groups,
      });
    }
  } catch (err) {
    logger.error(
      { error: err },
      "SunburstDashboardChartのデータ取得に失敗しました"
    );
    fetchErrorMessage = "データの取得に失敗しました";
  }

  if (fetchErrorMessage) {
    return <ErrorDisplay title={title} message={fetchErrorMessage} />;
  }

  if (!data) {
    return <ErrorDisplay title={title} message="データがありません" />;
  }

  return (
    <DashboardCard
      title={title}
      rankingLink={rankingLink}
      description={description}
      source={sourceName ?? undefined}
      sourceLink={sourceLink}
      sourceDetail={statsDataId}
      loading={false}
      error={null}
      empty={false}
    >
      <SunburstChartClient data={data} />
    </DashboardCard>
  );
};
