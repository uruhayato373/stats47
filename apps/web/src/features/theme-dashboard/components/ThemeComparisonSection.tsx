'use client';

import { useMemo, useState } from 'react';

import Link from 'next/link';

import { lookupArea } from '@stats47/area';
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
  getComparisonMetricKeys,
  getComparisonYearName,
} from '../lib/theme-overview';
import { PREFECTURE_SET_LABEL, type ThemeDashboardClientProps } from '../types';

import { ThemeOverviewMap } from './ThemeOverviewMap';
import { useThemePrefecture } from './ThemePrefectureContext';

const PREVIEW_ROW_COUNT = 5;
const areaName = (code: string) => lookupArea(code)?.areaName ?? code;

export function ThemeComparisonSection({
  themeConfig,
  metricGroups,
  indicatorDataMap,
  selectedPrefectureCode,
}: Pick<
  ThemeDashboardClientProps,
  'themeConfig' | 'metricGroups' | 'indicatorDataMap'
> & {
  selectedPrefectureCode: string | null;
}) {
  const { setSelected } = useThemePrefecture();
  const label = selectedPrefectureCode
    ? areaName(selectedPrefectureCode)
    : PREFECTURE_SET_LABEL;
  const comparisonKeys = useMemo(
    () => getComparisonMetricKeys(themeConfig, metricGroups),
    [themeConfig, metricGroups]
  );
  const overviewLabels = useMemo(
    () =>
      Object.fromEntries(
        themeConfig.tabIndicators.map((item) => [
          item.rankingKey,
          item.tabLabel,
        ])
      ),
    [themeConfig.tabIndicators]
  );
  const [metricKey, setMetricKey] = useState(themeConfig.defaultRankingKey);
  const [showAll, setShowAll] = useState(false);
  const summaries = useMemo(
    () =>
      comparisonKeys.flatMap((key) => {
        const data = indicatorDataMap[key];
        if (!data) return [];
        const group = metricGroups?.find((item) =>
          item.rankingKeys.includes(key)
        );
        const yearCode =
          group?.comparisonYear ?? data.rankingItem.latestYear?.yearCode;
        const values = getOverviewValues(data, yearCode);
        if (values.length === 0) return [];
        return [
          {
            key,
            data,
            values,
            median: getOverviewMedian(values),
            yearCode,
            yearName: getComparisonYearName(data, yearCode),
            showMap: !group?.comparisonMap,
          },
        ];
      }),
    [comparisonKeys, indicatorDataMap, metricGroups]
  );
  const mapSummaries = summaries.filter((item) => item.showMap);
  const current =
    mapSummaries.find(({ key }) => key === metricKey) ?? mapSummaries[0];
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

  if (summaries.length === 0) return null;

  return (
    <div className="@container min-w-0 space-y-5">
      {current && (
        <section
          id="theme-comparison"
          aria-labelledby="theme-comparison-heading"
          className="scroll-mt-24 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id="theme-comparison-heading"
              className="text-base font-semibold"
            >
              都道府県の分布
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
                {mapSummaries.map(({ key, data }) => (
                  <SelectItem key={key} value={key}>
                    {overviewLabels[key] ??
                      data.rankingItem.readerLabel ??
                      data.rankingItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {current && current.values.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground">
                {current.yearName} ·{' '}
                {current.data.rankingItem.unit.normalize('NFKC')} ·{' '}
                {current.values.length}都道府県
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {current.data.rankingItem.annotation ??
                  current.data.rankingItem.description ??
                  '値は同じ年次の都道府県で比較しています。指標の定義・対象・単位は出典で確認できます。'}
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
                    data={{
                      ...current.data,
                      rankingItem: {
                        ...current.data.rankingItem,
                        latestYear: current.yearCode
                          ? {
                              yearCode: current.yearCode,
                              yearName: current.yearName,
                            }
                          : undefined,
                      },
                      rankingValues: current.values,
                    }}
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
      )}

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
        <SurfaceCard className="min-w-0 p-0">
          <Table
            aria-label="指標の横断比較"
            aria-describedby="theme-table-note"
          >
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
              {summaries.map(({ key, data, values, median, yearName }) => {
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
                      {yearName}
                      <span className="ml-1 text-muted-foreground">
                        · {values.length}県
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </SurfaceCard>
      </section>
    </div>
  );
}
