'use client';

import { useEffect, useMemo, useState } from 'react';

import { NATIONAL_AREA_CODE } from '@stats47/area';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { MiniLineChart } from '@/components/charts/MiniCharts';

import { type MetricTimeseriesResult } from '../actions';
import { fetchMetricTimeseriesBatched } from '../lib/batched-metric-timeseries';
import { resolveMetricTrend, shouldFetchMetricTrend } from '../lib/metric-trend';

import { MetricStatTile } from './MetricStatTile';

import type { MetricKpi } from './metric-kpi';

interface SingleMetricCardProps {
  /** SSRとクライアントで同じ見出しIDを使うための固定キー */
  id?: string;
  /** グループ名 (ThemeCatalog.metricGroups[].title)。未指定なら指標ラベルを見出しにする */
  title?: string;
  /** 同じ章の詳細図が系列を描く場合は値だけを出し、推移を取りに行かない */
  summaryOnly?: boolean;
  /** このカードが表す唯一の指標 */
  metric: MetricKpi;
  /** rankingKey → 短ラベル (tabIndicators の tabLabel) */
  tabLabels: Record<string, string>;
  /** 選択中の都道府県コード (null = 47都道府県・未選択) */
  selectedPrefectureCode: string | null;
  /** 表示名 ("47都道府県" or 県名) */
  areaName: string;
}

/**
 * 有効指標が 1 件しかないグループのカード (2026-09-17。2026-10-29 に数値タイル StatTile へ移した)。
 *
 * 選択肢が 1 つしかないので選択 UI (チェックボックス・タブ・選択タイル) を出さない。
 * 部品は台帳 data/design/components.json の stat-tile: 名前 → 値 + 単位 + 順位バッジ → 年 (補足) の順に並べ、
 * 推移の小さなチャートは値の下、出典・ランキングのリンク行は下端に置く。
 *
 * 推移を出すかは lib/metric-trend.ts が決める (県を選んでいる・同じ章に詳しい図が無い・異なる年が 2 つ以上)。
 * 出さないときは何も置かない。取得は県選択時にこの指標 1 件分だけ (自地域 + 全国)。
 * 正典: docs/01_技術設計/04_デザインシステム.md「選択 UI と集合レイアウトの件数規則」
 */
export function SingleMetricCard({
  id,
  title,
  summaryOnly = false,
  metric,
  tabLabels,
  selectedPrefectureCode,
  areaName,
}: SingleMetricCardProps) {
  const label = tabLabels[metric.metricKey] ?? metric.title;
  const heading = title ?? label;
  const areaCode = selectedPrefectureCode ?? NATIONAL_AREA_CODE;
  const wantsTrend = shouldFetchMetricTrend({
    selectedPrefectureCode,
    coveredByChapterChart: summaryOnly,
  });

  const [series, setSeries] = useState<
    Record<string, MetricTimeseriesResult>
  >({});

  // 県選択時だけ、この指標の自地域 + 全国を未取得なら取る (取得済みは再取得しない)。
  useEffect(() => {
    if (!wantsTrend) return;
    const missing = [areaCode, NATIONAL_AREA_CODE].filter((code) => !(code in series));
    if (missing.length === 0) return;
    let cancelled = false;
    void Promise.all(
      missing.map(async (code) => {
        const result = await fetchMetricTimeseriesBatched(
          metric.metricKey,
          code
        ).catch(() => null);
        return [code, result ?? { points: [], source: 'none' }] as const;
      })
    ).then((entries) => {
      if (cancelled) return;
      setSeries((prev) => {
        const next = { ...prev };
        for (const [code, result] of entries) next[code] = result;
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [wantsTrend, areaCode, metric.metricKey, series]);

  const trend = useMemo(
    () =>
      wantsTrend
        ? resolveMetricTrend({
            areaName,
            areaResult: series[areaCode],
            nationalResult: series[NATIONAL_AREA_CODE],
            fallbackSeries: metric.series,
          })
        : ({ kind: 'none' } as const),
    [wantsTrend, series, areaCode, areaName, metric.series]
  );

  const isReady =
    metric.topRanked !== null || metric.value !== null || metric.series.length > 0;
  return (
    <div
      id={id}
      data-theme-component-type="kpi-card"
      data-data-state={isReady ? 'ready' : 'no-data'}
      data-unit={metric.unit}
      data-year={metric.yearName ?? ''}
      data-series-count={isReady ? 1 : 0}
      className="h-full"
    >
      <MetricStatTile
        metric={metric}
        selectedPrefectureCode={selectedPrefectureCode}
        label={
          <>
            {heading}
            {/* 見出しと同じ文言を繰り返さない。グループ名が別にあるときだけ指標名を添える */}
            {label !== heading && (
              <span className="block text-xs leading-4 text-muted-foreground">{label}</span>
            )}
          </>
        }
      >
        {trend.kind === 'chart' ? (
          <MiniLineChart
            points={trend.points}
            seriesName={trend.seriesName}
            unit={formatUnitForDisplay(metric.unit)}
          />
        ) : null}
      </MetricStatTile>
    </div>
  );
}
