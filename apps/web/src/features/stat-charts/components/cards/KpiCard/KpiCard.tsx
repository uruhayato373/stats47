import React from "react";

import { logger } from "@stats47/logger";

import { fetchEstatData } from "../../../services";
import { toKpiCardData } from "../../../adapters";

import { KpiCardClient } from "./KpiCardClient";

import type { DashboardItemProps } from "../../../types";

import { ErrorDisplay } from "../../shared/ErrorDisplay";

export const KpiCard = async ({
  common,
  config,
}: DashboardItemProps<"kpi-card">) => {
  const { title, area } = common;
  const { estatParams, unit: initialUnit } = config;
  const areaCode = area.areaCode;

  if (!estatParams) {
    return (
      <ErrorDisplay
        title={title}
        message="設定エラー: APIパラメータがありません"
      />
    );
  }

  try {
    const result = await fetchEstatData(areaCode, estatParams);
    if ("error" in result) {
      return <ErrorDisplay title={title} message={result.error} />;
    }

    const cardData = toKpiCardData(result.data);
    return (
      <KpiCardClient
        title={title}
        value={cardData.value}
        unit={cardData.unit ?? initialUnit ?? ""}
        year={cardData.year}
        changeRate={cardData.changeRate}
        changeDirection={cardData.changeDirection}
      />
    );
  } catch (err) {
    logger.error({ error: err }, "KpiCardのデータ取得に失敗しました");
    return <ErrorDisplay title={title} message="データの取得に失敗しました" />;
  }
};
