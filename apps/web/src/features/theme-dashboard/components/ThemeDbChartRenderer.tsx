'use client';

import { useEffect, useState, useTransition } from 'react';

import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { ChartLegendLeadProvider } from '@stats47/visualization/d3/chart-legend-lead';

import { ChartEmptyState, ChartErrorState, ChartLoading } from '@/components/charts/ChartState';
import type { PageComponent } from '@/components/stat-charts';
import { STAT_META_CLASS, STAT_UNIT_CLASS, STAT_VALUE_CLASS } from '@/components/surface';

import { loadThemeChartResultBatched } from '../lib/batched-theme-chart-result';
import { type ThemeChartLoadResult } from '../lib/theme-chart-result';

import { MarkdownSectionRenderer } from './MarkdownSectionRenderer';
import { ThemeChartResultRenderer } from './ThemeChartResultRenderer';

import type { MarkdownSectionComponentProps } from '../types';

interface Props {
  chart: PageComponent;
  prefCode: string;
  prefName: string;
  /** markdown-section の見出しの階層 (テーマの章の中では 3) */
  headingLevel?: 2 | 3;
}

/**
 * DB 管理チャートの統一レンダラー。
 *
 * page_components の componentType に応じてデータを取得し、
 * 実際のチャート描画は ThemeChartResultRenderer に委譲する。
 */
export function ThemeDbChartRenderer({ chart, prefCode, prefName, headingLevel }: Props) {
  const [loadResult, setLoadResult] = useState<
    ThemeChartLoadResult | undefined
  >(undefined);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (chart.componentType === 'markdown-section') return;

    let cancelled = false;
    setLoadResult(undefined);

    startTransition(async () => {
      const result = await loadThemeChartResultBatched(chart, prefCode);
      if (!cancelled) {
        setLoadResult(result);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chart object reference changes on every render; key/type/area identify the fetch
  }, [chart.componentKey, chart.componentType, prefCode]);

  if (chart.componentType === 'markdown-section') {
    const props = parseMarkdownSectionComponentProps(chart.componentProps);
    if (!props) {
      return <ChartEmptyState message="markdown が未設定です" />;
    }

    return (
      <div
        data-theme-component-key={chart.componentKey}
        data-theme-component-type="markdown-section"
        data-data-state="ready"
      >
        <MarkdownSectionRenderer
          title={chart.title}
          props={props}
          fallbackSourceName={chart.sourceName}
          headingLevel={headingLevel}
        />
      </div>
    );
  }

  if (isPending || loadResult === undefined) {
    return (
      <div
        data-theme-chart="true"
        data-theme-component-key={chart.componentKey}
        data-theme-component-type={chart.componentType}
        data-data-state="loading"
      >
        <ChartLoading height={200} />
      </div>
    );
  }

  if (loadResult.state === 'source-unavailable') {
    return (
      <div
        data-theme-chart="true"
        data-theme-component-key={chart.componentKey}
        data-theme-component-type={chart.componentType}
        data-data-state="source-unavailable"
      >
        <ChartErrorState
          message="データソースからチャートを取得できません"
          height={200}
          bordered={false}
        />
      </div>
    );
  }

  if (loadResult.state === 'no-data') {
    return (
      <div
        data-theme-chart="true"
        data-theme-component-key={chart.componentKey}
        data-theme-component-type={chart.componentType}
        data-data-state="no-data"
      >
        <ChartEmptyState
          message={loadResult.message ?? 'チャートデータがありません'}
        />
      </div>
    );
  }

  const { result } = loadResult;
  // 全国のページで 47 県の平均しか描けない図は出さない (47 県の平均を全国として見せない。2026-11-01 オーナー決定)。
  // 包むカード (ChartPanel) はこの印を見て自分ごと隠れる
  if (
    prefCode === '00000' &&
    'scopeLabel' in result.contract &&
    result.contract.scopeLabel === '47都道府県平均'
  ) {
    return <div hidden data-national-average-hidden data-theme-component-key={chart.componentKey} />;
  }
  const headline = result.type === 'line' ? latestHeadline(result.data) : null;
  const observationLabel = `${
    'geography' in result.contract && result.contract.geography
      ? result.contract.geography
      : prefCode === '00000'
        ? '全国'
        : prefName
  }${result.contract.year ? ` · ${observationPeriod(result)}` : ''}${
    result.contract.unit ? ` · ${formatUnitForDisplay(result.contract.unit)}` : ''
  }`;
  return (
    <div
      data-theme-chart="true"
      data-theme-component-key={chart.componentKey}
      data-theme-component-type={chart.componentType}
      data-data-state="ready"
      data-unit={result.contract.unit}
      data-year={result.contract.year}
      data-series-count={result.contract.seriesCount}
      className="group/chart"
    >
      {/* 地域・期間・単位。凡例を持つチャートは凡例と同じ 1 行に置き (ChartLegendLeadProvider)、ここの行は隠す
          (見本のチャートのカードと同じ「左に名前、右に凡例」。2026-10-29) */}
      <p
        className="mb-2 text-xs text-muted-foreground group-has-data-chart-legend-lead/chart:hidden"
        data-chart-observation-label
      >
        {observationLabel}
      </p>
      {/* 見本のチャートのカード: 本文の最初に最新の値を大きく、横に前回からの増減 (2026-11-01) */}
      {headline ? (
        <p className="mb-2 flex items-baseline gap-2" data-chart-headline>
          <span className={STAT_VALUE_CLASS}>
            {headline.value.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
            {result.contract.unit ? <span className={STAT_UNIT_CLASS}>{formatUnitForDisplay(result.contract.unit)}</span> : null}
          </span>
          {headline.change !== null ? (
            <span className={STAT_META_CLASS}>
              {headline.change > 0 ? '+' : ''}
              {headline.change.toLocaleString('ja-JP', { maximumFractionDigits: 2 })} ({headline.previousLabel}から)
            </span>
          ) : null}
        </p>
      ) : null}
      <ChartLegendLeadProvider lead={observationLabel}>
        <ThemeChartResultRenderer chartResult={result} />
      </ChartLegendLeadProvider>
    </div>
  );
}

/**
 * 折れ線の最初の系列の最新の値と、1 つ前の観測からの増減 (系列が 1 本のときだけ。複数本はどの値か決まらないので出さない)
 */
function latestHeadline(data: {
  xAxisKey: string;
  data: Array<Record<string, string | number>>;
  lines: Array<{ dataKey: string }>;
}): { value: number; change: number | null; previousLabel: string } | null {
  if (data.lines.length !== 1) return null;
  const key = data.lines[0].dataKey;
  const points = data.data.filter((row) => typeof row[key] === 'number' && Number.isFinite(row[key] as number));
  const last = points.at(-1);
  if (!last) return null;
  const previous = points.at(-2);
  return {
    value: last[key] as number,
    change: previous ? (last[key] as number) - (previous[key] as number) : null,
    previousLabel: previous ? String(previous[data.xAxisKey]) : '',
  };
}

function parseMarkdownSectionComponentProps(
  value: Record<string, unknown>
): MarkdownSectionComponentProps | null {
  const subtitle =
    typeof value.subtitle === 'string' ? value.subtitle : undefined;
  const sources = parseMarkdownSources(value.sources);

  if (value.displayMode === 'faq') {
    const items = parseFaqItems(value.items);
    if (!items) return null;
    return { displayMode: 'faq', items, subtitle, sources };
  }

  if (value.displayMode !== undefined && value.displayMode !== 'prose')
    return null;
  if (typeof value.markdown !== 'string') return null;

  return {
    displayMode: 'prose',
    markdown: value.markdown,
    subtitle,
    sources,
  };
}

function parseFaqItems(
  value: unknown
): Array<{ question: string; answer: string }> | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const items = value.map((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item))
      return null;
    const candidate = item as Record<string, unknown>;
    if (
      typeof candidate.question !== 'string' ||
      candidate.question.trim().length === 0 ||
      typeof candidate.answer !== 'string' ||
      candidate.answer.trim().length === 0
    ) {
      return null;
    }
    return { question: candidate.question, answer: candidate.answer };
  });
  return items.every((item) => item !== null)
    ? (items as Array<{ question: string; answer: string }>)
    : null;
}

function parseMarkdownSources(
  value: unknown
): MarkdownSectionComponentProps['sources'] {
  if (!Array.isArray(value)) return undefined;

  const sources = value.map((item) => {
    if (typeof item !== 'object' || item === null || Array.isArray(item))
      return null;
    const source = item as Record<string, unknown>;
    if (typeof source.label !== 'string') return null;
    return {
      label: source.label,
      url: typeof source.url === 'string' ? source.url : undefined,
    };
  });

  return sources.every((source) => source !== null)
    ? (sources as MarkdownSectionComponentProps['sources'])
    : undefined;
}

/** Show the actual available period instead of implying every chart uses the page's latest year. */
function observationPeriod(
  result: import('../lib/theme-chart-result').ThemeChartResult
): string {
  if (result.type === 'line' || result.type === 'mixed') {
    const years = [
      ...new Set(
        result.data.data.map((row) => String(row[result.data.xAxisKey]))
      ),
    ];
    return years.length > 1
      ? `${years[0]}〜${years.at(-1)}`
      : (years[0] ?? result.contract.year);
  }
  return result.contract.year;
}
