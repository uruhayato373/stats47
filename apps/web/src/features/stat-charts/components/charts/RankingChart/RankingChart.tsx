import { logger } from "@stats47/logger";
import {
  readRankingItemByKeyAndAreaTypeFromR2,
  readRankingItemFromR2,
  readRankingValuesFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import type { AreaType } from "@stats47/types";

import { toBarChartData } from "../../../adapters";
import { toLineChartData } from "../../../adapters/toLineChartData";
import { fetchEstatData } from "../../../services";
import { computeYAxisDomain } from "../../../utils/computeYAxisDomain";
import { DashboardCard } from "../../shared/DashboardCard";
import { ErrorDisplay } from "../../shared/ErrorDisplay";
import { BarChartClient } from "../BarChart/BarChartClient";
import { LineChartClient } from "../LineChart/LineChartClient";

import type { DashboardItemProps } from "../../../types";
import type { GetStatsDataParams } from "@stats47/estat-api/server";
import type { StatsSchema } from "@stats47/types";

/**
 * R2 partition snapshot から (rankingKey, areaCode) の時系列を再構築する。
 * 各年 partition (~13KB) を並列 fetch し、areaCode で 1 行抽出して連結する。
 * soumu データ等で e-Stat 直接 fetch ができない場合のフォールバック。
 */
async function fetchRankingDataDirect(
  areaCode: string,
  categoryCode: string,
  areaType: string,
): Promise<StatsSchema[]> {
  const itemResult = await readRankingItemFromR2(
    categoryCode,
    areaType as AreaType,
  );
  if (!isOk(itemResult) || !itemResult.data) return [];
  const yearCodes = (itemResult.data.availableYears ?? []).map((y) => y.yearCode);
  if (yearCodes.length === 0) return [];

  const responses = await Promise.all(
    yearCodes.map((y) =>
      readRankingValuesFromR2(categoryCode, areaType as AreaType, y),
    ),
  );

  const points: StatsSchema[] = [];
  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    if (!isOk(r)) continue;
    const match = r.data.find((v) => v.areaCode === areaCode);
    if (!match) continue;
    points.push({
      areaCode: match.areaCode,
      areaName: match.areaName,
      yearCode: match.yearCode,
      yearName: match.yearName,
      categoryCode: match.categoryCode,
      categoryName: match.categoryName,
      value: match.value,
      unit: match.unit,
    });
  }
  return points.sort((a, b) => (a.yearCode < b.yearCode ? -1 : 1));
}

/**
 * RankingChart - ranking_items の source_config から estatParams を動的解決するチャート
 *
 * componentProps に rankingKeys を指定するだけで、DB から e-Stat パラメータを取得し、
 * 指定された chartType でレンダリングする。
 *
 * source_config に statsDataId がない soumu データの場合は、
 * ranking_data テーブルから直接時系列データを取得するフォールバックパスを使用する。
 */
export const RankingChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<"ranking-chart">) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const { rankingKeys, chartType, labels, yAxisConfig } = config;
  const areaCode = area.areaCode;

  if (!rankingKeys?.length) {
    return <ErrorDisplay title={title} message="設定エラー: rankingKeys が未設定です" />;
  }

  try {
    // 各 rankingKey を解決: e-Stat パラメータまたは ranking_data 直接取得
    const resolvedEstatParams: (GetStatsDataParams | null)[] = [];
    const directDataList: StatsSchema[][] = [];
    const resolvedLabels: string[] = [];
    const useDirectFetch: boolean[] = [];

    for (let i = 0; i < rankingKeys.length; i++) {
      const key = rankingKeys[i];
      const result = await readRankingItemByKeyAndAreaTypeFromR2(key, "prefecture");

      if (!result.success || result.data.length === 0) {
        logger.warn({ rankingKey: key }, "RankingChart: ranking_item not found");
        continue;
      }

      const item = result.data[0];
      const sc = item.sourceConfig;

      if (sc?.statsDataId && sc?.cdCat01) {
        // e-Stat パラメータが利用可能
        const params: GetStatsDataParams = {
          statsDataId: sc.statsDataId,
          cdCat01: sc.cdCat01,
          ...(sc.cdCat02 && { cdCat02: sc.cdCat02 }),
          ...(sc.cdCat03 && { cdCat03: sc.cdCat03 }),
          ...(sc.cdTab && { cdTab: sc.cdTab }),
        };
        resolvedEstatParams.push(params);
        directDataList.push([]);
        useDirectFetch.push(false);
      } else {
        // フォールバック: ranking_data テーブルから直接取得
        const data = await fetchRankingDataDirect(areaCode, key, "prefecture");
        resolvedEstatParams.push(null);
        directDataList.push(data);
        useDirectFetch.push(true);
      }

      resolvedLabels.push(labels?.[i] ?? item.demographicAttr ?? item.title);
    }

    if (resolvedLabels.length === 0) {
      return <ErrorDisplay title={title} message="有効なランキングデータが見つかりません" />;
    }

    // データ取得: e-Stat と ranking_data 直接取得を統合
    const rawDataList: StatsSchema[][] = [];
    const estatIndicesToFetch: number[] = [];
    const estatParamsToFetch: GetStatsDataParams[] = [];

    for (let i = 0; i < resolvedLabels.length; i++) {
      if (useDirectFetch[i]) {
        rawDataList.push(directDataList[i]);
      } else {
        rawDataList.push([]); // プレースホルダー（後で上書き）
        estatIndicesToFetch.push(i);
        const param = resolvedEstatParams[i];
        if (param) estatParamsToFetch.push(param);
      }
    }

    // e-Stat データを一括取得
    if (estatParamsToFetch.length > 0) {
      const responses = await Promise.all(
        estatParamsToFetch.map((p) => fetchEstatData(areaCode, p)),
      );

      for (let j = 0; j < responses.length; j++) {
        const resp = responses[j];
        const targetIdx = estatIndicesToFetch[j];
        if ("data" in resp) {
          rawDataList[targetIdx] = resp.data;
        } else {
          logger.warn({ error: resp.error }, "RankingChart: e-Stat fetch failed");
        }
      }
    }

    // 全系列のデータが空でないか確認
    const hasData = rawDataList.some((d) => d.length > 0);
    if (!hasData) {
      return <ErrorDisplay title={title} message="有効なランキングデータが見つかりません" />;
    }

    // Y 軸ドメイン計算（e-Stat パラメータがある場合のみ sync 可能）
    const validEstatParams = resolvedEstatParams.filter((p): p is GetStatsDataParams => p !== null);
    const sharedDomain = validEstatParams.length > 0
      ? await computeYAxisDomain({
          yAxisConfig,
          estatParams: validEstatParams,
          domainType: "minMax",
        })
      : undefined;

    // Render based on chartType
    if (chartType === "line-chart") {
      const chartData = toLineChartData(rawDataList, resolvedLabels);

      return (
        <DashboardCard
          title={title}
          rankingLink={rankingLink}
          source={sourceName ?? undefined}
          sourceLink={sourceLink}
          loading={false}
          error={null}
          empty={chartData.data.length === 0}
        >
          <LineChartClient chartData={chartData} yDomain={sharedDomain} />
        </DashboardCard>
      );
    }

    // bar-chart or grouped
    const barChartType = chartType === "grouped" ? "grouped" : "stacked-bar";
    const barData = toBarChartData(rawDataList, resolvedLabels, barChartType);

    return (
      <DashboardCard
        title={title}
        rankingLink={rankingLink}
        source={sourceName ?? undefined}
        sourceLink={sourceLink}
        loading={false}
        error={null}
        empty={barData.data.length === 0}
      >
        <BarChartClient chartData={barData} chartType={barChartType} xDomain={sharedDomain} />
      </DashboardCard>
    );
  } catch (err) {
    logger.error({ error: err }, "RankingChartのデータ取得に失敗しました");
    return <ErrorDisplay title={title} message="データの取得に失敗しました" />;
  }
};
