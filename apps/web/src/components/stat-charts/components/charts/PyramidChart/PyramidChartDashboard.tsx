import { logger } from "@stats47/logger";

import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";

import { toPyramidChartData } from "../../../adapters";
import { fetchEstatData } from "../../../services";
import { ErrorDisplay } from "../../shared/ErrorDisplay";

import { PyramidChartClient } from "./PyramidChartClient";

import type { DashboardItemProps } from "../../../types";


/**
 * PyramidChartDashboard - 人口ピラミッド（ダッシュボード用）
 *
 * maleParams と femaleParams で男女の年齢階級別人口データを取得し、
 * PyramidChart（D3）で描画する。
 */
export const PyramidChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<"pyramid-chart">) => {
  const { title, rankingLink, sourceName, sourceLink, annotation, rankingLinks } = common;
  const { maleParams, femaleParams, ageGroups, description } = config;
  const areaCode = common.area.areaCode;

  if (!maleParams?.length || !femaleParams?.length) {
    return (
      <ErrorDisplay title={title} message="設定エラー: 男女のパラメータが必要です" />
    );
  }

  try {
    // 男女それぞれの年齢階級データを並列取得
    const [maleResponses, femaleResponses] = await Promise.all([
      Promise.all(maleParams.map((p) => fetchEstatData(areaCode, p))),
      Promise.all(femaleParams.map((p) => fetchEstatData(areaCode, p))),
    ]);

    const maleError = maleResponses.find((r) => "error" in r);
    if (maleError && "error" in maleError) {
      return <ErrorDisplay title={title} message={maleError.error} />;
    }
    const femaleError = femaleResponses.find((r) => "error" in r);
    if (femaleError && "error" in femaleError) {
      return <ErrorDisplay title={title} message={femaleError.error} />;
    }

    const maleDataList = maleResponses.map((r) => ("data" in r ? r.data : []));
    const femaleDataList = femaleResponses.map((r) => ("data" in r ? r.data : []));

    const chartData = toPyramidChartData(maleDataList, femaleDataList, ageGroups);

    if (chartData.length === 0) {
      return <ErrorDisplay title={title} message="データがありません" />;
    }

    // 最新年度を取得（最初の男性データの最新レコードから）
    const latestMaleData = maleDataList[0];
    const latestYear = latestMaleData?.[latestMaleData.length - 1]?.yearName;

    return (
      <ChartPanel
        title={title}
        description={description}
        footer={
          <ChartFooter
            source={sourceName ?? undefined}
            sourceLink={sourceLink}
            sourceLinks={common.sourceLinks}
            sourceDetail="人"
            annotation={annotation}
            rankingLink={rankingLink}
            rankingLinks={rankingLinks}
          />
        }
      >
        <PyramidChartClient chartData={chartData} year={latestYear} />
      </ChartPanel>
    );
  } catch (err) {
    logger.error(
      { error: err },
      "PyramidChartDashboardのデータ取得に失敗しました",
    );
    return <ErrorDisplay title={title} message="データの取得に失敗しました" />;
  }
};
