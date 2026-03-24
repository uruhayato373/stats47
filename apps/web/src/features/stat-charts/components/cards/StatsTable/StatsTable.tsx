import React from "react";

import { logger } from "@stats47/logger";

import { fetchEstatData } from "../../../services";
import { toStatsTableData } from "../../../adapters";

import { StatsTableClient } from "./StatsTableClient";

import type { DashboardItemProps } from "../../../types";

import { ErrorDisplay } from "../../shared/ErrorDisplay";

export const StatsTable = async ({
  common,
  config,
}: DashboardItemProps<"stats-table">) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const { statsDataId, rows: rowDefs, description } = config;
  const areaCode = area.areaCode;

  if (!statsDataId || !rowDefs?.length) {
    return (
      <ErrorDisplay
        title={title}
        message="設定エラー: パラメータがありません"
      />
    );
  }

  let fetchErrorMessage: string | null = null;

  try {
    const responses = await Promise.all(
      rowDefs.map((row) =>
        fetchEstatData(areaCode, {
          statsDataId,
          cdCat01: row.categoryFilter,
        })
      )
    );

    const firstError = responses.find((r) => "error" in r);
    if (firstError && "error" in firstError) {
      fetchErrorMessage = firstError.error;
    } else {
      const rawDataList = responses.map((r) =>
        "data" in r ? r.data : []
      );
      const tableData = toStatsTableData(rawDataList, rowDefs);

      return (
        <StatsTableClient
          title={title}
          rankingLink={rankingLink}
          description={description}
          years={tableData.years}
          dataByYear={tableData.dataByYear}
          sourceName={sourceName}
          sourceLink={sourceLink}
        />
      );
    }
  } catch (err) {
    logger.error({ error: err }, "StatsTableのデータ取得に失敗しました");
    fetchErrorMessage = "データの取得に失敗しました";
  }

  return <ErrorDisplay title={title} message={fetchErrorMessage ?? "エラー"} />;
};
