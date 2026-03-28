import { logger } from "@stats47/logger";

import { toCompositionChartData } from "../../../adapters/toCompositionChartData";
import { fetchEstatData } from "../../../services";
import { DashboardCard } from "../../shared/DashboardCard";

import { CompositionChartClient } from "./CompositionChartClient";

import type { DashboardItemProps } from "../../../types";

export const CompositionChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<"composition-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink, annotation, rankingLinks } = common;
  const { statsDataId, segments, description } = config;
  const areaCode = area.areaCode;

  if (!statsDataId || !segments?.length) {
    return (
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
          {title}
        </h3>
        <div className="text-destructive text-sm">
          設定エラー: パラメータがありません
        </div>
      </div>
    );
  }

  /* eslint-disable react-hooks/error-boundaries -- server component data fetch pattern */
  try {
    const { totalCode } = config;

    const [segmentResponses, totalResponse] = await Promise.all([
      Promise.all(
        segments.map((seg) =>
          fetchEstatData(areaCode, { statsDataId, cdCat01: seg.code }),
        ),
      ),
      totalCode
        ? fetchEstatData(areaCode, { statsDataId, cdCat01: totalCode })
        : Promise.resolve(null),
    ]);

    const firstError = segmentResponses.find((r) => "error" in r);
    if (firstError && "error" in firstError) {
      return (
        <div className="bg-card border rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            {title}
          </h3>
          <div className="text-destructive text-sm">{firstError.error}</div>
        </div>
      );
    }

    const rawDataList = segmentResponses.map((r) => ("data" in r ? r.data : []));
    const labels = segments.map((s) => s.label);
    const colors = segments.map((s) => s.color).filter((c): c is string => !!c);
    const totalData =
      totalResponse && "data" in totalResponse ? totalResponse.data : undefined;

    const chartData = toCompositionChartData(rawDataList, labels, colors, totalData);

    if (chartData.trendData.length === 0) {
      return (
        <DashboardCard
          title={title}
          rankingLink={rankingLink}
          description={description}
          source={sourceName ?? undefined}
          sourceLink={sourceLink}
          annotation={annotation}
          rankingLinks={rankingLinks}
          loading={false}
          error={null}
          empty
        >
          <div />
        </DashboardCard>
      );
    }

    return (
      <DashboardCard
        title={title}
        rankingLink={rankingLink}
        description={description}
        source={sourceName ?? undefined}
        sourceLink={sourceLink}
        annotation={annotation}
        rankingLinks={rankingLinks}
        loading={false}
        error={null}
        empty={false}
      >
        <CompositionChartClient chartData={chartData} />
      </DashboardCard>
    );
  } catch (err) {
    logger.error(
      { error: err },
      "CompositionChartのデータ取得に失敗しました",
    );
    return (
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
          {title}
        </h3>
        <div className="text-destructive text-sm">
          データの取得に失敗しました
        </div>
      </div>
    );
  }
  /* eslint-enable react-hooks/error-boundaries */
};
