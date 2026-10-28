import { logger } from "@stats47/logger";
import { resolveValuePrecision } from "@stats47/utils";

import { ChartErrorState } from "@/components/charts/ChartState";

import { toKpiCardData } from "../../../adapters";
import { fetchEstatData } from "../../../services";

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
      <ChartErrorState
        title={title}
        message="設定エラー: APIパラメータがありません"
      />
    );
  }

  /* eslint-disable react-hooks/error-boundaries -- server component data fetch pattern */
  try {
    const result = await fetchEstatData(areaCode, estatParams);
    if ("error" in result) {
      return <ChartErrorState title={title} message={result.error} />;
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
        precision={
          typeof cardData.value === "number"
            ? resolveValuePrecision([cardData.value])
            : undefined
        }
      />
    );
  } catch (err) {
    logger.error({ error: err }, "KpiCardのデータ取得に失敗しました");
    return <ChartErrorState title={title} message="データの取得に失敗しました" />;
  }
  /* eslint-enable react-hooks/error-boundaries */
};
