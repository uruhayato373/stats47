import { logger } from "@stats47/logger";

import { toCompositionChartData } from "../../../adapters/toCompositionChartData";
import { fetchEstatData } from "../../../services";
import { DashboardCard } from "../../shared/DashboardCard";

import { CompositionChartClient } from "./CompositionChartClient";

import type { DashboardItemProps } from "../../../types";
import type { StatsSchema } from "@stats47/types";

/**
 * JIS 地域コード（01000-47000）をデータセット固有コードに変換
 * 工業統計調査 H29 以降は 2 桁プレフィックスが +areaCodeOffset になっている
 */
function mapAreaCode(jisCode: string, offset: number): string {
  const prefix = parseInt(jisCode.slice(0, 2), 10);
  return String(prefix + offset).padStart(2, "0") + "000";
}

export const CompositionChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<"composition-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink, annotation, rankingLinks, componentKey } = common;
  const { segments, description, defaultTab } = config;
  const areaCode = area.areaCode;

  if (!segments?.length || (!config.statsDataId && !config.multipleStatsSources?.length)) {
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

  const labels = segments.map((s) => s.label);
  const colors = segments.map((s) => s.color).filter((c): c is string => !!c);

  // componentKey は将来 R2 snapshot 経由で同等データを返す予定 (Phase 6)。
  // 現状 component_data テーブルは空なので、e-Stat API 直接 fetch のみ。
  void componentKey;

  /* eslint-disable react-hooks/error-boundaries -- server component data fetch pattern */
  try {
    let rawDataList: StatsSchema[][];
    let totalData: StatsSchema[] | undefined;

    if (config.multipleStatsSources?.length) {
      // --- 複数年データソース（各年が別 statsDataId） ---
      const allSegmentData: StatsSchema[][] = segments.map(() => []);
      const allTotalData: StatsSchema[] = [];

      await Promise.all(
        config.multipleStatsSources.map(async (source) => {
          const { statsDataId: srcId, surveyYear, areaCodeOffset = 0, cdCat01Fixed } = source;
          const mappedCode = areaCodeOffset ? mapAreaCode(areaCode, areaCodeOffset) : areaCode;

          const buildParams = (segCode: string) =>
            cdCat01Fixed
              ? { statsDataId: srcId, cdCat01: cdCat01Fixed, cdCat02: segCode }
              : { statsDataId: srcId, cdCat01: segCode };

          const [segResponses, totalResp] = await Promise.all([
            Promise.all(segments.map((seg) => fetchEstatData(mappedCode, buildParams(seg.code)))),
            config.totalCode
              ? fetchEstatData(mappedCode, buildParams(config.totalCode))
              : Promise.resolve(null),
          ]);

          // yearCode/yearName を調査年で上書きし、areaCode を JIS コードに正規化
          const injectYear = (items: StatsSchema[]): StatsSchema[] =>
            items.map((item) => ({
              ...item,
              areaCode,
              yearCode: surveyYear,
              yearName: `${surveyYear}年`,
            }));

          segResponses.forEach((resp, i) => {
            if ("data" in resp) allSegmentData[i].push(...injectYear(resp.data));
          });

          if (totalResp && "data" in totalResp) {
            allTotalData.push(...injectYear(totalResp.data));
          }
        }),
      );

      rawDataList = allSegmentData;
      totalData = allTotalData.length > 0 ? allTotalData : undefined;
    } else {
      // --- 単一 statsDataId（既存ロジック） ---
      const statsDataId = config.statsDataId!;
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

      rawDataList = segmentResponses.map((r) => ("data" in r ? r.data : []));
      totalData =
        totalResponse && "data" in totalResponse ? totalResponse.data : undefined;
    }

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
        <CompositionChartClient chartData={chartData} defaultTab={defaultTab} />
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
