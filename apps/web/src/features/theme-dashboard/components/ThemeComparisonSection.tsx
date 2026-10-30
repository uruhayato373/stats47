'use client';

import { useMemo, useState } from 'react';


import { lookupArea } from '@stats47/area';
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
import { hrefFor } from "@stats47/data-configs/content/href";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { metricDisplayName } from "@stats47/ranking";

import Link from '@/components/atoms/SiteLink';
import { PanelGrid } from '@/components/layout/PageShell';
import { SurfaceCard } from '@/components/surface';

import { RankingVisualizationSection } from '@/features/ranking/widgets';

import { trackNavClick } from '@/lib/analytics/events';

import {
  formatOverviewDifference,
  formatOverviewValue,
  getOverviewMedian,
  getOverviewValues,
  getComparisonMetricKeys,
  getComparisonYearName,
} from '../lib/theme-overview';
import { PREFECTURE_SET_LABEL, type ThemeDashboardClientProps } from '../types';


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
  // 比較する年 (グループの comparisonYear か最新年) をランキングの部品の年として渡す
  const currentRankingItem = current
    ? {
        ...current.data.rankingItem,
        latestYear: current.yearCode
          ? { yearCode: current.yearCode, yearName: current.yearName }
          : current.data.rankingItem.latestYear,
      }
    : undefined;

  if (summaries.length === 0) return null;

  return (
    <PanelGrid className="@container">
      {current && (
        <PanelGrid as="section"
          id="theme-comparison"
          aria-labelledby="theme-comparison-heading"
          className="scroll-mt-24"
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
                if (value === null) return;
                setMetricKey(value);
              }}
              items={mapSummaries.map(({ key, data }) => ({
                value: key,
                label: overviewLabels[key] ?? metricDisplayName(data.rankingItem),
              }))}
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
                    {overviewLabels[key] ?? metricDisplayName(data.rankingItem)}
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
              {/* 地図と表はランキングのページと同じ 1 枚のパネル (RankingVisualizationSection) で描く。
                  県を押すと県の詳細が開き、県のページの県は強調する (2026-10-30 オーナー決定「完全に共通の部品」。
                  旧: テーマ専用の地図 (ThemeOverviewMap) と上位 5 県の表の 2 枚で、凡例の値も丸めていなかった) */}
              <RankingVisualizationSection
                title={`${currentName}の地図と表`}
                rankingItem={currentRankingItem!}
                activeRankingItem={currentRankingItem!}
                rankingValues={current.values}
                areaType="prefecture"
                highlightAreaCode={selectedPrefectureCode}
                cardFooter={
                  <div className="flex flex-wrap justify-end gap-2 text-xs">
                    <Link
                      href={hrefFor("ranking", { rankingKey: current.key })}
                      className="text-primary underline"
                      onClick={() =>
                        trackNavClick({
                          surface: 'theme_ranking',
                          label: `${themeConfig.themeKey}:comparison-map:${current.key}`,
                          href: hrefFor("ranking", { rankingKey: current.key }),
                        })
                      }
                    >
                      定義・出典
                    </Link>
                  </div>
                }
              />
            </>
          ) : (
            <p role="status" className="py-8 text-sm text-muted-foreground">
              この指標の比較データを取得できませんでした。
            </p>
          )}
        </PanelGrid>
      )}

      <PanelGrid as="section"
        id="theme-comparison-table"
        aria-labelledby="theme-table-heading"
        className="scroll-mt-24"
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
            <TableCaption className="px-3 pb-2">
              —：値なし。割合の差：ポイント。
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-32">指標</TableHead>
                <TableHead className="text-right! whitespace-nowrap">
                  {selectedPrefectureCode ? label : '最高値（都道府県）'}
                </TableHead>
                <TableHead className="text-right! whitespace-nowrap">
                  都道府県中央値
                </TableHead>
                <TableHead className="text-right! whitespace-nowrap">
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
                        href={hrefFor("ranking", { rankingKey: key })}
                        className="text-primary underline underline-offset-4"
                        onClick={() =>
                          trackNavClick({
                            surface: 'theme_ranking',
                            label: `${themeConfig.themeKey}:comparison-table:${key}`,
                            href: hrefFor("ranking", { rankingKey: key }),
                          })
                        }
                      >
                        {overviewLabels[key] ?? data.rankingItem.title}
                      </Link>
                      <span className="ml-1 text-xs text-muted-foreground">
                        （{formatUnitForDisplay(unit)}）
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
      </PanelGrid>
    </PanelGrid>
  );
}
