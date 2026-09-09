'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { lookupArea } from '@stats47/area';
import { Badge } from '@stats47/components/atoms/ui/badge';
import { Button } from '@stats47/components/atoms/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';

import { ChartPanel } from '@/components/charts/ChartPanel';
import { SurfaceCard } from '@/components/surface';

import {
  formatOverviewDifference,
  formatOverviewValue,
  getOverviewMedian,
  getOverviewValues,
} from '../lib/theme-overview';
import { PREFECTURE_SET_LABEL, type ThemeDashboardClientProps } from '../types';

import { ThemeMetricsDashboard } from './ThemeMetricsDashboard';
import { ThemeOverviewMap } from './ThemeOverviewMap';
import { useThemePrefecture } from './ThemePrefectureContext';

import type { CatalogOverview } from '@stats47/data-configs/theme-catalog';

const PREVIEW_ROW_COUNT = 5;
const areaName = (code: string) => lookupArea(code)?.areaName ?? code;

export function ThemeOverviewDashboard({
  overview,
  overviewLabels = {},
  hasEvidence = false,
  themeConfig,
  indicatorDataMap,
  pageCharts,
  chartSourceLinks,
}: ThemeDashboardClientProps & { overview: CatalogOverview }) {
  const { selectedPrefectureCode, selectedAreaName, setSelected } =
    useThemePrefecture();
  const label = selectedAreaName ?? PREFECTURE_SET_LABEL;
  const hasCharts = (pageCharts ?? []).some(
    (chart) => !['kpi-card', 'markdown-section'].includes(chart.componentType)
  );
  const hasMarkdown = (pageCharts ?? []).some(
    (chart) => chart.componentType === 'markdown-section'
  );
  const [metricKey, setMetricKey] = useState(overview.comparisonRankingKeys[0]);
  const [showAll, setShowAll] = useState(false);
  const summaries = useMemo(
    () =>
      overview.comparisonRankingKeys.flatMap((key) => {
        const data = indicatorDataMap[key];
        if (!data) return [];
        const values = getOverviewValues(data);
        return [{ key, data, values, median: getOverviewMedian(values) }];
      }),
    [overview.comparisonRankingKeys, indicatorDataMap]
  );
  const current =
    summaries.find(({ key }) => key === metricKey) ?? summaries[0];
  const currentName = current
    ? (overviewLabels[current.key] ?? current.data.rankingItem.title)
    : '';
  const currentSelected = current?.values.find(
    ({ areaCode }) => areaCode === selectedPrefectureCode
  );
  const visibleRows =
    current?.values.slice(0, showAll ? undefined : PREVIEW_ROW_COUNT) ?? [];
  if (
    !showAll &&
    currentSelected &&
    !visibleRows.some(({ areaCode }) => areaCode === currentSelected.areaCode)
  ) {
    visibleRows.push(currentSelected);
  }

  return (
    <div className="@container min-w-0 space-y-5">
      <section
        id="theme-indicators"
        aria-labelledby="theme-overview-heading"
        className="scroll-mt-24"
      >
        <p className="mb-2 text-xs leading-5 text-muted-foreground">
          {overview.introduction}
        </p>
        <h2 id="theme-overview-heading" className="sr-only">
          {label}の主要指標
        </h2>
        <dl className="grid grid-cols-2 gap-2 @sm:grid-cols-4">
          {overview.headlineRankingKeys.map((key) => {
            const summary = summaries.find((item) => item.key === key);
            const row = selectedPrefectureCode
              ? summary?.values.find(
                  ({ areaCode }) => areaCode === selectedPrefectureCode
                )
              : summary?.values[0];
            const title = overviewLabels[key] ?? key;
            return (
              <SurfaceCard
                key={key}
                className="relative min-w-0 p-3 hover:border-primary/40 focus-within:ring-2 focus-within:ring-primary"
              >
                <dt className="text-sm font-medium">
                  <a
                    href="#theme-comparison"
                    aria-label={`${title}の地図と順位`}
                    onClick={() => {
                      setMetricKey(key);
                      setShowAll(false);
                    }}
                    className="after:absolute after:inset-0"
                  >
                    {title}
                  </a>
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="min-w-0 max-w-full break-words font-mono text-2xl font-semibold tabular-nums">
                    {formatOverviewValue(row?.value)}
                    <span className="ml-1 inline-block whitespace-nowrap text-xs font-normal">
                      {summary?.data.rankingItem.unit.normalize('NFKC')}
                    </span>
                  </span>
                  {selectedPrefectureCode && row && (
                    <Badge
                      variant="secondary"
                      className="shrink-0 whitespace-nowrap px-1.5 py-0 text-xs font-medium leading-5"
                    >
                      {row.rank}位
                    </Badge>
                  )}
                </dd>
                <dd className="mt-1 text-xs leading-4 text-muted-foreground">
                  {!row &&
                    (selectedPrefectureCode
                      ? 'この地域のデータなし'
                      : 'データなし')}
                  {!selectedPrefectureCode &&
                    row &&
                    `最高値：${areaName(row.areaCode)}`}
                  <span className="block">
                    {summary?.data.rankingItem.latestYear?.yearName ??
                      '年次不明'}
                  </span>
                </dd>
              </SurfaceCard>
            );
          })}
        </dl>
        <nav
          aria-label="データの見方"
          className="mt-1 flex flex-wrap gap-x-5 text-sm"
        >
          <a
            href="#theme-comparison"
            className="py-2 text-primary hover:underline"
          >
            地図・順位
          </a>
          <a
            href="#theme-comparison-table"
            className="py-2 text-primary hover:underline"
          >
            比較表
          </a>
          {hasCharts && (
            <a
              href="#theme-charts"
              className="py-2 text-primary hover:underline"
            >
              グラフ
            </a>
          )}
          {hasEvidence && (
            <a
              href="#theme-evidence"
              className="py-2 text-primary hover:underline"
            >
              解説・出典
            </a>
          )}
        </nav>
      </section>

      <section
        id="theme-comparison"
        aria-labelledby="theme-comparison-heading"
        className="scroll-mt-24 space-y-2"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="theme-comparison-heading" className="text-base font-semibold">
            地域差
          </h2>
          <Select
            value={current?.key ?? metricKey}
            onValueChange={(value) => {
              setMetricKey(value);
              setShowAll(false);
            }}
          >
            <SelectTrigger
              aria-label="地図と一覧の指標"
              className="w-44 sm:w-56"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {summaries.map(({ key }) => (
                <SelectItem key={key} value={key}>
                  {overviewLabels[key] ?? key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {current && current.values.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">
              {current.data.rankingItem.latestYear?.yearName} ·{' '}
              {current.data.rankingItem.unit.normalize('NFKC')} ·{' '}
              {current.values.length}都道府県
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {overview.mapNotes[current.key]}
            </p>
            <div className="grid min-w-0 items-start gap-3 @[640px]:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              <ChartPanel
                id={`theme-${themeConfig.themeKey}-map`}
                title={`${currentName}の分布`}
                headerClassName="px-3 py-2"
                footerClassName="px-3 py-2"
                contentClassName="p-0"
                footer={
                  <div className="flex flex-wrap justify-between gap-2">
                    <span>県を選択して比較</span>
                    <Link
                      href={`/ranking/${current.key}`}
                      className="text-primary underline"
                    >
                      定義・出典
                    </Link>
                  </div>
                }
              >
                <ThemeOverviewMap
                  data={{ ...current.data, rankingValues: current.values }}
                  selectedCode={selectedPrefectureCode}
                  onSelect={setSelected}
                />
              </ChartPanel>
              <ChartPanel
                id={`theme-${themeConfig.themeKey}-ranking`}
                title="都道府県別の値"
                headerClassName="px-3 py-2"
                contentClassName="px-2 py-1"
              >
                {selectedPrefectureCode && (
                  <div
                    aria-live="polite"
                    className="flex items-center justify-between border-b border-border px-2"
                  >
                    <p className="text-xs">選択：{label}</p>
                    <Button
                      variant="link"
                      className="h-9 px-2 text-xs"
                      aria-label="都道府県の選択を解除"
                      onClick={() => setSelected(null)}
                    >
                      解除
                    </Button>
                  </div>
                )}
                <Table className="[&_td]:py-0 [&_th]:h-8">
                  <TableCaption className="mt-2">
                    {showAll ? '全県' : '上位5県＋選択県'} ·
                    高い順（同値は同順位）
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>順位</TableHead>
                      <TableHead>都道府県</TableHead>
                      <TableHead className="text-right">
                        {current.data.rankingItem.unit.normalize('NFKC')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleRows.map((row) => (
                      <TableRow
                        key={row.areaCode}
                        data-state={
                          row.areaCode === selectedPrefectureCode
                            ? 'selected'
                            : undefined
                        }
                      >
                        <TableCell className="tabular-nums">
                          {row.rank}
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => setSelected(row.areaCode)}
                            aria-pressed={
                              row.areaCode === selectedPrefectureCode
                            }
                            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4 sm:min-h-8"
                          >
                            {areaName(row.areaCode)}
                          </button>
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatOverviewValue(row.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {current.values.length > PREVIEW_ROW_COUNT && (
                  <Button
                    variant="outline"
                    className="mt-2 h-9 w-full"
                    onClick={() => setShowAll((value) => !value)}
                  >
                    {showAll
                      ? '上位5県に戻す'
                      : `${current.values.length}都道府県を表示`}
                  </Button>
                )}
              </ChartPanel>
            </div>
          </>
        ) : (
          <p role="status" className="py-8 text-sm text-muted-foreground">
            この指標の比較データを取得できませんでした。
          </p>
        )}
      </section>

      <section
        id="theme-comparison-table"
        aria-labelledby="theme-table-heading"
        className="scroll-mt-24 space-y-2"
      >
        <h2 id="theme-table-heading" className="text-base font-semibold">
          指標の比較
        </h2>
        <p
          id="theme-table-note"
          className="text-xs leading-5 text-muted-foreground"
        >
          中央値は都道府県値の中央（全国平均ではありません）。調査年は指標ごとに異なります。
        </p>
        <div className="min-w-0 border border-border bg-card">
          <Table aria-describedby="theme-table-note">
            <TableCaption className="mt-2 px-3 pb-2">
              —：値なし。割合の差：ポイント。
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-32">指標</TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  {selectedPrefectureCode ? label : '最高値（都道府県）'}
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  都道府県中央値
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  中央値との差
                </TableHead>
                <TableHead className="whitespace-nowrap">年次・県数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map(({ key, data, values, median }) => {
                const row = selectedPrefectureCode
                  ? values.find(
                      ({ areaCode }) => areaCode === selectedPrefectureCode
                    )
                  : values[0];
                const unit = data.rankingItem.unit.normalize('NFKC');
                return (
                  <TableRow key={key}>
                    <TableCell>
                      <Link
                        href={`/ranking/${key}`}
                        className="text-primary underline underline-offset-4"
                      >
                        {overviewLabels[key] ?? data.rankingItem.title}
                      </Link>
                      <span className="ml-1 text-xs text-muted-foreground">
                        （{unit}）
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatOverviewValue(row?.value)}
                      {!selectedPrefectureCode && row && (
                        <span className="block font-sans text-xs text-muted-foreground">
                          {areaName(row.areaCode)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {formatOverviewValue(median)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatOverviewDifference(row?.value, median, unit)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {data.rankingItem.latestYear?.yearName}
                      <span className="ml-1 text-muted-foreground">
                        · {values.length}県
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </section>

      {(hasCharts || hasMarkdown) && (
        <div className="space-y-2">
          {hasCharts && <h2 className="text-base font-semibold">構成・推移</h2>}
          {hasCharts && !selectedPrefectureCode && (
            <p className="text-xs text-muted-foreground">
              未選択時の集計方法は各グラフの凡例に表示します。
            </p>
          )}
          <ThemeMetricsDashboard
            themeConfig={themeConfig}
            indicatorDataMap={indicatorDataMap}
            pageCharts={pageCharts}
            chartSourceLinks={chartSourceLinks}
            selectedPrefectureCode={selectedPrefectureCode}
            chartsOnly
          />
        </div>
      )}
    </div>
  );
}
