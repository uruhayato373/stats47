import { logger } from "@stats47/logger";

import { toKpiCardData } from "../../../adapters";
import { fetchEstatData } from "../../../services";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { KpiCardClient } from "./KpiCardClient";

import type { DashboardItemProps } from "../../../types";


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

  /* eslint-disable react-hooks/error-boundaries -- server component data fetch pattern */
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
  /* eslint-enable react-hooks/error-boundaries */
};
