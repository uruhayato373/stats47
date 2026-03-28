import { logger } from "@stats47/logger";

import { toKpiCardData } from "../../../adapters";
import { fetchEstatData } from "../../../services";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { MultiStatCardClient } from "./MultiStatCardClient";

import type { DashboardItemProps } from "../../../types";


export const MultiStatCard = async ({
  common,
  config,
}: DashboardItemProps<"multi-stats-card">) => {
  const { title, area, rankingLink, rankingLinks } = common;
  const {
    statsDataId,
    categories,
    showTotal = false,
    totalLabel = "合計",
  } = config;
  const areaCode = area.areaCode;

  if (!statsDataId || !categories?.length) {
    return (
      <ErrorDisplay
        title={title}
        message="設定エラー: パラメータがありません"
      />
    );
  }

  let results: Array<{
    label: string;
    value: number | null;
    unit: string | null;
    year: string | null;
  }> = [];
  let fetchErrorMessage: string | null = null;

  try {
    const responses = await Promise.all(
      categories.map((cat) =>
        fetchEstatData(areaCode, {
          statsDataId,
          cdCat01: cat.categoryFilter,
        })
      )
    );

    const firstError = responses.find((r) => "error" in r);
    if (firstError && "error" in firstError) {
      fetchErrorMessage = firstError.error;
    } else {
      results = categories.map((cat, i) => {
        const res = responses[i];
        if (res && "data" in res) {
          const cardData = toKpiCardData(res.data);
          return {
            label: cat.label,
            value: cardData.value,
            unit: cardData.unit,
            year: cardData.year,
          };
        }
        return {
          label: cat.label,
          value: null,
          unit: null,
          year: null,
        };
      });
    }
  } catch (err) {
    logger.error({ error: err }, "MultiStatCardのデータ取得に失敗しました");
    fetchErrorMessage = "データの取得に失敗しました";
  }

  if (fetchErrorMessage) {
    return <ErrorDisplay title={title} message={fetchErrorMessage} />;
  }

  return (
    <MultiStatCardClient
      title={title}
      rankingLink={rankingLink}
      rankingLinks={rankingLinks}
      results={results}
      showTotal={showTotal}
      totalLabel={totalLabel}
    />
  );
};
