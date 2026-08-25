import { logger } from "@stats47/logger";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";

import { fetchEstatDataWithCategories } from "../../../services";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { AttributeMatrixClient } from "./AttributeMatrixClient";

import type { DashboardItemProps } from "../../../types";
import type { AttributeMatrixData } from "../../../types/visualization";

/**
 * 属性マトリクス（ダッシュボード用）
 * 行×列の属性をヒートマップ風テーブルで表示（例: 男女 × 年齢階級）
 */
export const AttributeMatrixDashboard = async ({
  common,
  config,
}: DashboardItemProps<"attribute-matrix">) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const { statsDataId, rows, columns, unit, description } = config;
  const areaCode = area.areaCode;

  // Collect all category codes from all rows
  const allCodes = rows.flatMap((row) => row.codes);

  let matrixData: AttributeMatrixData | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetchEstatDataWithCategories(
      areaCode,
      statsDataId,
      allCodes
    );

    if ("error" in response) {
      errorMessage = response.error;
    } else {
      // Build matrix from response data
      const dataByCode = new Map<string, number>();
      for (const item of response.data) {
        dataByCode.set(item.metricKey, item.value ?? 0);
      }

      const matrixRows = rows.map((row) => ({
        label: row.label,
        values: row.codes.map((code) => dataByCode.get(code) ?? null),
      }));

      matrixData = {
        columns: columns,
        rows: matrixRows,
        unit: unit,
      };
    }
  } catch (err) {
    logger.error(
      { error: err },
      "AttributeMatrixのデータ取得に失敗しました"
    );
    errorMessage = "データの取得に失敗しました";
  }

  if (errorMessage || !matrixData) {
    return <ErrorDisplay title={title} message={errorMessage ?? "データがありません"} />;
  }

  return (
    <ChartPanel
      title={title}
      description={description}
      footer={
        <ChartFooter
          source={sourceName ?? undefined}
          sourceLink={sourceLink}
          sourceLinks={common.sourceLinks}
          rankingLink={rankingLink}
        />
      }
    >
      <AttributeMatrixClient data={matrixData} />
    </ChartPanel>
  );
};
