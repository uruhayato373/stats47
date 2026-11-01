'use client';

import type { ReactNode } from 'react';



import { PREFECTURE_LIST_2DIGIT as PREFECTURES } from '@stats47/area';
import { hrefFor } from "@stats47/data-configs/content/href";
import { LOCAL_FINANCE_RATIO_METRICS } from '@stats47/data-configs/theme-catalog';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartLegend } from '@/components/charts/ChartLegend';
import { getChartColors } from '@/components/charts/ChartPalette';
import { KeyMetricsTableCard } from '@/components/charts/KeyMetricsTableCard';
import {
  MiniBarChart,
  MiniLineChart,
  MiniStackedBarChart,
  type ChartPoint,
  type StackPoint,
} from '@/components/charts/MiniCharts';
import { StatTile, StatTileGrid } from '@/components/surface';

import {
  FinanceSankey,
  LOCAL_FINANCE_SOURCE_LINKS,
  type FinanceFlowData,
} from '@/features/finance-flow/client';

import {
  validateLocalFinanceSections,
  type LocalFinanceEmbeddedKey,
} from '../lib/finance-sections';
import {
  type FinanceCardsData,
  type YearRecord,
} from '../lib/load-finance-cards';

import type { CatalogSection } from '@stats47/data-configs/theme-catalog/types';

interface Props {
  cards: FinanceCardsData;
  sections: CatalogSection[];
  initialFinanceFlow?: FinanceFlowData;
  /** Controlled by the same regional selection as every theme. */
  prefCode: string | null;
}

const OKU = 1 / 100000; // 千円 → 億円
const FUND_COLORS = getChartColors(3);
const FUND_LEGEND_ITEMS = [
  { label: '財政調整基金', color: FUND_COLORS[0] },
  { label: '減債基金', color: FUND_COLORS[1] },
  { label: 'その他特定目的', color: FUND_COLORS[2] },
];

function oku(thousandYen: number): string {
  const v = thousandYen * OKU;
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)} 兆円`;
  return `${Math.round(v).toLocaleString('ja-JP')} 億円`;
}

interface RatioMeta {
  key: keyof YearRecord;
  componentKey: string;
  rankingKey: string;
  label: string;
  unit: string;
  decimals: number;
}
const RATIO_METRICS = LOCAL_FINANCE_RATIO_METRICS satisfies readonly RatioMeta[];

export function LocalFinanceDashboard({
  cards,
  sections,
  initialFinanceFlow,
  prefCode,
}: Props) {
  const sectionErrors = validateLocalFinanceSections(sections);
  if (sectionErrors.length) throw new Error(sectionErrors.join("; "));
  const { years, latestYear } = cards;
  const prefCard = prefCode ? cards.cards[prefCode] : undefined;
  const prefName =
    prefCard?.name ?? PREFECTURES.find((p) => p.code === prefCode)?.name ?? '';

  const activeName = `${prefName}（都道府県の会計）`;
  const recordFor = (year: number): YearRecord | undefined =>
    prefCard?.years[String(year)];

  const latest = recordFor(latestYear);

  const lineSeries = (key: keyof YearRecord, scale: number): ChartPoint[] =>
    years.flatMap((y) => {
      const r = recordFor(y);
      return r ? [{ year: y, value: r[key] * scale }] : [];
    });
  const fundStacks: StackPoint[] = years.flatMap((y) => {
    const r = recordFor(y);
    return r
      ? [
          {
            year: y,
            segments: [
              r.fundAdjust * OKU,
              r.fundRedemption * OKU,
              r.fundOther * OKU,
            ],
          },
        ]
      : [];
  });
  const fundTotalLatest = latest
    ? latest.fundAdjust + latest.fundRedemption + latest.fundOther
    : 0;

  // 県を選んでいないときに 47 都道府県を並べていた比較の表は外した (2026-10-31。比較はランキングのページ)
  const embedded: Record<LocalFinanceEmbeddedKey, ReactNode> = {
    'finance-overview': prefCode ? (
        <StatTileGrid>
          <KeyMetricsTableCard
            title={activeName}
            subtitle="主要指標"
            rows={[
              { label: '歳入総額', value: latest ? oku(latest.revenue) : '—' },
              {
                label: '歳出総額',
                value: latest ? oku(latest.expenditure) : '—',
              },
              {
                label: '標準財政規模',
                value: latest ? oku(latest.standardScale) : '—',
              },
            ]}
            footer={`${latestYear}年度`}
          />

          <StatTile label="実質収支" value={latest ? oku(latest.realBalance) : null}>
            <MiniLineChart points={lineSeries('realBalance', OKU)} unit="億円" />
          </StatTile>

          <StatTile label="積立金現在高" value={latest ? oku(fundTotalLatest) : null}>
            <div>
              <MiniStackedBarChart points={fundStacks} colors={FUND_COLORS} />
              <ChartLegend items={FUND_LEGEND_ITEMS} className="mt-1" />
            </div>
          </StatTile>

          <StatTile label="地方債現在高" value={latest ? oku(latest.localDebt) : null}>
            <MiniBarChart points={lineSeries('localDebt', OKU)} />
          </StatTile>
        </StatTileGrid>
    ) : null,
    'finance-sustainability': prefCode ? (
        <StatTileGrid>
          {RATIO_METRICS.map((meta) => {
            const latestVal = latest ? latest[meta.key] : null;
            const points = lineSeries(meta.key, 1);
            return (
              <div
                key={String(meta.key)}
                data-theme-chart="true"
                data-theme-component-key={meta.componentKey}
                data-theme-component-type="kpi-card"
                data-data-state={points.length > 0 ? 'ready' : 'no-data'}
                data-unit={meta.unit || '指数'}
                data-year={`${latestYear}年度`}
                data-series-count={points.length}
              >
                {/* 定義・ランキングへの導線もタイルの中に置く (タイルと文章を別々に包むと文章が格子の線に接する) */}
                <StatTile
                  label={meta.label}
                  value={latestVal == null ? null : latestVal.toFixed(meta.decimals)}
                  unit={formatUnitForDisplay(meta.unit)}
                  footer={
                    <ChartFooter
                      rankingLink={hrefFor("ranking", { rankingKey: meta.rankingKey })}
                      rankingLabel={`${meta.label}の定義・ランキング`}
                    />
                  }
                >
                  <MiniLineChart points={points} unit={meta.unit} />
                </StatTile>
              </div>
            );
          })}
        </StatTileGrid>
    ) : null,
    'finance-flow': prefCode ? (
      <>
        <p className="mb-3 text-sm text-muted-foreground">
          歳入の財源（地方税・地方交付税・国庫支出金・地方債など）が一般会計を通じて
          目的別歳出（民生費・教育費・土木費など）へ流れる様子をフロー図で表します。
        </p>
        <p className="mb-3 text-sm text-muted-foreground">
          決算カードは{latestYear}
          年度の決算です。フローは図に記した年度の構成で、決算カードと年度が異なる場合があります。
        </p>
        <FinanceSankey
          code={prefCode}
          initialData={
            initialFinanceFlow?.focusCode === prefCode
              ? initialFinanceFlow
              : undefined
          }
        />
      </>
    ) : (
      <p className="text-sm text-muted-foreground">
        都道府県を選ぶと、その県の歳入・歳出のフローを表示します。年度は図に記載します。
      </p>
    ),
  };

  return (
    <div className="space-y-8 py-2">
      <div className="border-b border-border pb-3">
        <p className="font-semibold text-foreground">
          {prefCode ? `${prefName}の地方財政` : '全国の地方財政'}
          <span className="ml-2 text-base font-normal text-muted-foreground">{latestYear}年度</span>
        </p>
        <ChartFooter
          source="地方財政状況調査（決算カード）"
          sourceLinks={LOCAL_FINANCE_SOURCE_LINKS}
          sourceDetail={prefCode && years.length > 1 ? `${years[0]}〜${latestYear}年度` : `${latestYear}年度`}
        />
      </div>
      {sections.map((section) => (
        <section key={section.key} id={`theme-section-${section.key}`} className="scroll-mt-24">
          <h2 className="mb-2 text-lg font-semibold">{section.title}</h2>
          {section.description && <p className="mb-3 text-sm text-muted-foreground">{section.description}</p>}
          {section.embeddedSectionKeys?.map((key) => (
            <div key={key} data-theme-embedded-key={key}>
              {embedded[key as LocalFinanceEmbeddedKey]}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
