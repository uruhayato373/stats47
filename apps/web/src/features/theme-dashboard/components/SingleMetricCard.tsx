'use client';

import { useEffect, useMemo, useState } from 'react';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';
import { MiniLineChart } from '@/components/charts/MiniCharts';

import { type MetricTimeseriesResult } from '../actions';
import { fetchMetricTimeseriesBatched } from '../lib/batched-metric-timeseries';

import { nationalSeriesName } from './MetricSwitcherPanel';

import type { MetricKpi } from './metric-kpi';

const NATIONAL_CODE = '00000';

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

type Trend =
  | { kind: 'chart'; points: { year: number; value: number }[]; seriesName: string }
  | { kind: 'single-year'; yearName: string }
  | { kind: 'none' };

/**
 * 有効指標が 1 件しかないグループのカード (2026-09-17)。
 *
 * 選択肢が 1 つしかないので選択 UI (チェックボックス・タブ・選択タイル) を出さない。
 * 見出し・値・単位・年次・順位・ランキング導線を直接並べ、推移は県選択時に
 * **異なる年が 2 件以上ある場合だけ**小さく描く。空の折れ線枠・ローディング風の
 * 大面積・「推移データがありません」だけの固定高領域は置かない (情報密度を優先)。
 *
 * 時系列は `MetricSwitcherPanel` と同じ action を、この指標 1 件分だけ遅延取得する
 * (自地域 + 全国。47都道府県・未選択では取得しない = GEO-SCOPE-SEPARATION-01 WP2)。
 * 県系列が空なら 全国 → 47 県平均 の順に退避し、平均を「全国」と呼ばない。
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
  const areaCode = selectedPrefectureCode ?? NATIONAL_CODE;
  const wantsTrend = !!selectedPrefectureCode && !summaryOnly;

  const [series, setSeries] = useState<
    Record<string, MetricTimeseriesResult>
  >({});

  // 県選択時だけ、この指標の自地域 + 全国を未取得なら取る (取得済みは再取得しない)。
  useEffect(() => {
    if (!wantsTrend) return;
    const missing = [areaCode, NATIONAL_CODE].filter((code) => !(code in series));
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

  const trend: Trend = useMemo(() => {
    if (!wantsTrend) return { kind: 'none' };
    const areaResult = series[areaCode];
    const nationalResult = series[NATIONAL_CODE];
    if (!areaResult || !nationalResult) return { kind: 'none' };

    let points = areaResult.points;
    let seriesName = areaName;
    if (points.length === 0 && nationalResult.points.length > 0) {
      points = nationalResult.points;
      seriesName = nationalSeriesName(nationalResult);
    } else if (points.length === 0 && metric.series.length > 0) {
      points = metric.series.map((p) => ({
        year: String(p.year),
        yearName: String(p.year),
        value: p.value,
      }));
      // 47 県平均を「全国」と称さない (実数系は全国値の 1/47 になる)
      seriesName = '都道府県平均';
    }
    const distinctYears = new Set(points.map((p) => p.year));
    if (distinctYears.size >= 2) {
      return {
        kind: 'chart',
        seriesName,
        points: points.map((p) => ({ year: Number(p.year), value: p.value })),
      };
    }
    if (points.length === 1) return { kind: 'single-year', yearName: points[0].yearName };
    return { kind: 'none' };
  }, [wantsTrend, series, areaCode, areaName, metric.series]);

  const isReady =
    metric.topRanked !== null || metric.value !== null || metric.series.length > 0;
  const shown = selectedPrefectureCode ? metric.value : metric.topRanked?.value ?? null;

  return (
    <div
      data-theme-component-type="kpi-card"
      data-data-state={isReady ? 'ready' : 'no-data'}
      data-unit={metric.unit}
      data-year={metric.yearName ?? ''}
      data-series-count={isReady ? 1 : 0}
    >
      <ChartPanel
        id={id}
        title={heading}
        contentClassName="p-4"
        footer={
          <ChartFooter
            source={metric.sourceName}
            sourceLink={metric.sourceLink}
            sourceLinks={metric.sourceLinks}
            rankingLink={`/ranking/${metric.metricKey}`}
            rankingLabel="ランキングを見る"
          />
        }
      >
        {/* 見出しと同じ文言を本文で繰り返さない。グループ名が別にあるときだけ指標名を添える */}
        {label !== heading && (
          <p className="text-[11px] leading-4 text-muted-foreground">{label}</p>
        )}
        <p className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-xl font-bold tabular-nums text-foreground">
            {shown !== null
              ? shown.toLocaleString('ja-JP', { maximumFractionDigits: 2 })
              : '—'}
            {metric.unit ? (
              <span className="ml-0.5 text-[11px] font-normal text-muted-foreground">
                {metric.unit}
              </span>
            ) : null}
          </span>
          {metric.yearName && (
            <span className="text-[11px] text-muted-foreground">{metric.yearName}</span>
          )}
          {selectedPrefectureCode ? (
            metric.rank !== null ? (
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {metric.rank}位 / {metric.total}
              </span>
            ) : null
          ) : metric.topRanked !== null ? (
            /* 47都道府県 (未選択): 実在する1位県の事実 (47県平均でも全国値でもない) */
            <span className="text-[11px] tabular-nums text-muted-foreground">
              1位: {metric.topRanked.areaName}
            </span>
          ) : null}
        </p>
        {trend.kind === 'chart' ? (
          <div className="mt-2">
            <MiniLineChart
              points={trend.points}
              seriesName={trend.seriesName}
              unit={metric.unit}
            />
          </div>
        ) : trend.kind === 'single-year' ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {trend.yearName}の単年データのため、推移グラフはありません
          </p>
        ) : null}
      </ChartPanel>
    </div>
  );
}
