import { getDrizzle, rankingData as rankingDataTable } from "@stats47/database/server";
import { logger } from "@stats47/logger";
import { and, eq, desc } from "drizzle-orm";

import { toRadarChartData } from "../../../adapters";
import { DashboardCard } from "../../shared/DashboardCard";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { RadarChartDashboardClient } from "./RadarChartDashboardClient";

import type { RadarChartData } from "../../../adapters/toRadarChartData";
import type { DashboardItemProps } from "../../../types";


/**
 * レーダーチャートダッシュボードコンポーネント
 *
 * 各軸に対応するランキングキーのデータを取得し、
 * 順位ベースのスコア（47 中の順位を 0-100 にスケール）で描画する。
 */
export const RadarChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<"radar-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const { axes: axesDef, description } = config;
  const areaCode = area.areaCode;

  let chartData: RadarChartData | null = null;
  let fetchErrorMessage: string | null = null;

  try {
    const db = getDrizzle();

    // 各軸のランキングデータを取得
    const axisValues: Record<string, number> = {};
    const resolvedAxes: { key: string; label: string; max: number }[] = [];

    for (const axisDef of axesDef) {
      const rankingKey = axisDef.rankingKey ?? axisDef.key;

      // 最新年度の当該地域データを取得
      const rows = await db
        .select()
        .from(rankingDataTable)
        .where(
          and(
            eq(rankingDataTable.categoryCode, rankingKey),
            eq(rankingDataTable.areaCode, areaCode),
            eq(rankingDataTable.areaType, area.areaType)
          )
        )
        .orderBy(desc(rankingDataTable.yearCode))
        .limit(1);

      const foundRow = rows.length > 0 ? rows[0] : null;

      if (foundRow) {
        // 順位ベースのスコア: 1位=100, 47位≈0 (都道府県47件前提)
        const rank = foundRow.rank ?? 47;
        const score = Math.round(((47 - rank) / 46) * 100);
        axisValues[axisDef.key] = score;
      } else {
        axisValues[axisDef.key] = 0;
      }

      resolvedAxes.push({
        key: axisDef.key,
        label: axisDef.label,
        max: 100,
      });
    }

    chartData = toRadarChartData(resolvedAxes, [
      {
        label: area.areaName,
        values: axisValues,
      },
    ]);
  } catch (err) {
    logger.error({ error: err }, "RadarChartDashboardのデータ取得に失敗しました");
    fetchErrorMessage = "データの取得に失敗しました";
  }

  if (fetchErrorMessage) {
    return <ErrorDisplay title={title} message={fetchErrorMessage} />;
  }

  if (!chartData) {
    return <ErrorDisplay title={title} message="データがありません" />;
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
      empty={false}
    >
      <RadarChartDashboardClient chartData={chartData} />
    </DashboardCard>
  );
};
