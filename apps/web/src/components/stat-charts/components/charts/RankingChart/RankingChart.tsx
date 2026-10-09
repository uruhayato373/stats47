import { NATIONAL_AREA_CODE } from '@stats47/area';
import { normalizeUnitForAxis } from '@stats47/data-configs/theme-catalog/types';
import { logger } from '@stats47/logger';
import { readRankingItemFromR2 } from '@stats47/ranking/server';
import { readStatsValues } from '@stats47/stats-r2/readers';
import { isOk, type StatsSchema } from '@stats47/types';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { aggregateMetricTimeseries } from '@/lib/aggregate-metric-timeseries';
import { resolveMetricAxisPolicy } from '@/lib/metric-axis-policy';
import { metricSeriesDomain } from '@/lib/metric-presentation';

import { toBarChartData } from '../../../adapters';
import { toLineChartData } from '../../../adapters/toLineChartData';
import { ErrorDisplay } from '../../shared/ErrorDisplay';
import { BarChartClient } from '../BarChart/BarChartClient';
import { LineChartClient } from '../LineChart/LineChartClient';

import type { DashboardItemProps } from '../../../types';

/** Metric IDs resolve only to generated R2 observations and presentation metadata. */
export const RankingChartDashboard = async ({
  common,
  config,
}: DashboardItemProps<'ranking-chart'>) => {
  const { title, area, rankingLink, sourceName, sourceLink } = common;
  const { rankingKeys, chartType, labels, yAxisConfig } = config;
  if (!rankingKeys?.length)
    return (
      <ErrorDisplay
        title={title}
        message="設定エラー: rankingKeys が未設定です"
      />
    );
  try {
    const resolved = await Promise.all(
      rankingKeys.map(async (key, index) => {
        const [metadata, payload] = await Promise.all([
          readRankingItemFromR2(key, 'prefecture'),
          readStatsValues(key, 'prefecture'),
        ]);
        if (!isOk(metadata) || !metadata.data || !payload)
          throw new Error('Missing metric data: ' + key);
        const series = aggregateMetricTimeseries(payload.rows, area.areaCode);
        const unit = payload.rows.find((row) => row.unit)?.unit;
        if (!unit) throw new Error('Missing metric unit: ' + key);
        const label =
          labels?.[index] ??
          metadata.data.demographicAttr ??
          metadata.data.title;
        const name =
          series.source === 'average' ? label + '（都道府県平均）' : label;
        const rows: StatsSchema[] = series.points.map((point) => ({
          areaCode: area.areaCode,
          areaName:
            series.source === 'average'
              ? '全国平均'
              : area.areaCode === NATIONAL_AREA_CODE
                ? '全国'
                : area.areaCode,
          yearCode: point.year,
          yearName: point.yearName,
          metricKey: key,
          value: point.value,
          unit,
        }));
        return { key, name, rows };
      })
    );
    if (!resolved.some((item) => item.rows.length))
      return (
        <ErrorDisplay
          title={title}
          message="有効なランキングデータが見つかりません"
        />
      );
    const rawDataList = resolved.map((item) => item.rows),
      names = resolved.map((item) => item.name);
    const footer = (
      <ChartFooter
        source={sourceName ?? undefined}
        sourceLink={sourceLink}
        sourceLinks={common.sourceLinks}
        rankingLink={rankingLink}
      />
    );
    if (chartType === 'line-chart') {
      const chartData = toLineChartData(rawDataList, names);
      const units = [
        ...new Set(
          rawDataList.map((rows) => normalizeUnitForAxis(rows[0]?.unit ?? ''))
        ),
      ];
      if (units.length > 2)
        throw new Error('A chart supports at most two units');
      chartData.unit = rawDataList[0]?.[0]?.unit;
      chartData.rightUnit = rawDataList.find(
        (rows) => normalizeUnitForAxis(rows[0]?.unit ?? '') === units[1]
      )?.[0]?.unit;
      chartData.lines = chartData.lines.map((line, index) => ({
        ...line,
        yAxis:
          units[1] &&
          normalizeUnitForAxis(rawDataList[index][0]?.unit ?? '') === units[1]
            ? 'right'
            : 'left',
      }));
      const refsFor = (axis: 'left' | 'right') =>
        resolved
          .filter((_, index) => chartData.lines[index].yAxis === axis)
          .map((item) => ({ metricKey: item.key }));
      const [left, right] = await Promise.all([
        resolveMetricAxisPolicy(refsFor('left'), yAxisConfig),
        resolveMetricAxisPolicy(refsFor('right')),
      ]);
      return (
        <ChartPanel title={title} footer={footer}>
          <LineChartClient
            chartData={chartData}
            yDomain={metricSeriesDomain(
              chartData.data,
              chartData.lines
                .filter((line) => line.yAxis !== 'right')
                .map((line) => line.dataKey),
              left
            )}
            rightYDomain={metricSeriesDomain(
              chartData.data,
              chartData.lines
                .filter((line) => line.yAxis === 'right')
                .map((line) => line.dataKey),
              right
            )}
          />
        </ChartPanel>
      );
    }
    if (
      new Set(
        rawDataList.map((rows) => normalizeUnitForAxis(rows[0]?.unit ?? ''))
      ).size > 1
    )
      throw new Error('Bar series require the same unit');
    const barType = chartType === 'grouped' ? 'grouped' : 'stacked-bar';
    const barData = toBarChartData(rawDataList, names, barType);
    const policy = await resolveMetricAxisPolicy(
      resolved.map((item) => ({ metricKey: item.key })),
      yAxisConfig
    );
    const keys = barData.series.map((series) => series.dataKey);
    const domainRows =
      barType === 'stacked-bar'
        ? barData.data.map((row) => ({
            positive: keys.reduce(
              (sum, key) => sum + Math.max(0, Number(row[key] ?? 0)),
              0
            ),
            negative: keys.reduce(
              (sum, key) => sum + Math.min(0, Number(row[key] ?? 0)),
              0
            ),
          }))
        : barData.data;
    const domain = metricSeriesDomain(
      domainRows,
      barType === 'stacked-bar' ? ['positive', 'negative'] : keys,
      policy,
      true
    );
    return (
      <ChartPanel title={title} footer={footer}>
        <BarChartClient
          chartData={barData}
          chartType={barType}
          xDomain={domain}
        />
      </ChartPanel>
    );
  } catch (error) {
    logger.error({ error }, 'RankingChart data failed');
    return <ErrorDisplay title={title} message="データの取得に失敗しました" />;
  }
};
