'use client';

import { NATIONAL_AREA_CODE } from '@stats47/area/area-code';
import { ChartPanel } from '@stats47/components';
import { BRIDGE_INSPECTION_AGE_SOURCE as SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ValueTable } from '@/components/surface';

import { useThemePrefecture } from '@/features/theme-dashboard';

import type { BridgeInspectionAgeSnapshot } from '../lib/bridge-inspection-age-snapshot';

export function ThemeBridgeInspectionAgeClient({
  snapshot,
}: {
  snapshot: BridgeInspectionAgeSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const selected = selectedPrefectureCode
    ? snapshot.areas.find((a) => a.areaCode === selectedPrefectureCode)
    : snapshot.national;
  const area = selectedPrefectureCode
    ? snapshot.areas.find((a) => a.areaCode === selectedPrefectureCode)
        ?.areaName
    : '全国';
  if (!selected || !area)
    return <p role="status">この地域の架設年度データはありません。</p>;
  return (
    <div
      data-theme-component-key="bridge-inspection-age"
      data-data-state="ready"
      data-area-code={selectedPrefectureCode ?? NATIONAL_AREA_CODE}
    >
      <ChartPanel
        title="当年度点検橋の架設年度分布"
        description={`${snapshot.year}年度点検 · ${area} · 年度末時点で診断中の施設を除く`}
        contentClassName="min-w-0 space-y-4"
        action={
          <ChartFooter
            placement="header"
            source="国土交通省「道路メンテナンス年報」施設名一覧をstats47が集計"
            sourceLink={SOURCE.indexUrl}
            sourceLinks={SOURCE.sources.map((s) => ({ label: `原表（XLSX）${s.title}`, url: s.url }))}
            annotation={['割合は表示時に丸めるため合計100%にならない場合があります。', ...SOURCE.notes]}
          />
        }
      >
        <p
          className="text-sm"
          data-published-count={selected.publishedCount}
          data-known-year-count={selected.knownYearCount}
          data-unknown-year-count={selected.unknownYearCount}
        >
          掲載橋数 {selected.publishedCount.toLocaleString('ja-JP')}
          橋のうち、架設年度が分かる橋は
          {selected.knownYearCount.toLocaleString('ja-JP')}橋、不明は
          {selected.unknownYearCount.toLocaleString('ja-JP')}橋です。
        </p>
        <ValueTable fold
          ariaLabel={`${area}の当年度点検橋の架設年度分布`}
          caption="年度差＝2025年度−架設年度。割合は架設年度不明を含む掲載橋数が分母です。"
          columns={[
            {
              key: 'construction',
              header: (
                <>
                  架設年度
                  <br />
                  （西暦）
                </>
              ),
              rowHeader: true,
            },
            { key: 'diff', header: '年度差', className: 'whitespace-nowrap' },
            { key: 'count', header: '橋数' },
            { key: 'share', header: '割合', className: 'whitespace-nowrap' },
          ]}
          rows={SOURCE.bands.map((band) => {
            const count = selected.bands.find(
              (b) => b.key === band.key
            )!.count;
            const share =
              selected.publishedCount === 0
                ? null
                : (count / selected.publishedCount) * 100;
            return {
              key: band.key,
              attrs: { 'data-band-key': band.key },
              cells: [
                band.constructionLabel,
                band.label,
                { content: count.toLocaleString('ja-JP'), attrs: { 'data-count': count } },
                {
                  content: share === null ? '—' : `${share.toFixed(1)}%`,
                  attrs: {
                    'data-share': share,
                    'data-denominator': selected.publishedCount,
                  },
                },
              ],
            };
          })}
        />
        <p className="text-xs text-muted-foreground">
          管理者別の掲載数：国土交通省{' '}
          {selected.managerCounts.mlit.toLocaleString('ja-JP')}橋、高速道路会社{' '}
          {selected.managerCounts.highway.toLocaleString('ja-JP')}
          橋、地方公共団体{' '}
          {selected.managerCounts.local.toLocaleString('ja-JP')}
          橋。
        </p>
      </ChartPanel>
    </div>
  );
}
