import { logger } from "@stats47/logger";

import { fetchEstatDataWithCategories } from "../../../services";
import { DashboardCard } from "../../shared/DashboardCard";

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
        dataByCode.set(item.categoryCode, item.value);
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
    return (
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-lg mb-3">{title}</h3>
        <div className="h-[200px] flex items-center justify-center bg-muted/10 rounded">
          <p className="text-destructive text-sm">
            {errorMessage ?? "データがありません"}
          </p>
        </div>
      </div>
    );
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
      empty={matrixData.rows.length === 0}
    >
      <AttributeMatrixClient data={matrixData} />
    </DashboardCard>
  );
};
