import React from "react";

import { logger } from "@stats47/logger";

import { fetchEstatDataWithCategories } from "../../../services";
import { toTreemapData } from "../../../adapters";
import { DashboardCard } from "../../shared/DashboardCard";

import { TreemapChartClient } from "./TreemapChartClient";

import type { DashboardItemProps } from "../../../types";
import type { HierarchyData } from "../../../types/visualization";

import { ErrorDisplay } from "../../shared/ErrorDisplay";

/**
 * ダッシュボード用 Treemap（e-Stat 階層データを D3 treemap で表示）
 * config は Sunburst と同一（statsDataId, rootCode, childCodes）
 */
export const TreemapDashboardChart = async ({
  common,
  config,
}: DashboardItemProps<"treemap">) => {
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
      data = toTreemapData(result.data, {
        rootCode,
        childCodes,
        groups: rest.groups,
      });
    }
  } catch (err) {
    logger.error(
      { error: err },
      "TreemapDashboardChartのデータ取得に失敗しました"
    );
    fetchErrorMessage = "データの取得に失敗しました";
  }

  if (fetchErrorMessage) {
    return <ErrorDisplay title={title} message={fetchErrorMessage} />;
  }

  if (!data?.children?.length) {
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
      <TreemapChartClient data={data} />
    </DashboardCard>
  );
};
