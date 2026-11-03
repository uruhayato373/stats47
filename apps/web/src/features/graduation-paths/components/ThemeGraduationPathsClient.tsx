'use client';

import { ChartPanel } from '@stats47/components';
import { GRADUATION_PATHS_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ValueTable } from '@/components/surface';

import { useThemePrefecture } from '@/features/theme-dashboard';

import { selectGraduationPathsView } from '../lib/graduation-paths-view';

import type { GraduationPathsSnapshot } from '../lib/graduation-paths-snapshot';

const format = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString('ja-JP', { maximumFractionDigits });

export function ThemeGraduationPathsClient({
  snapshot,
}: {
  snapshot: GraduationPathsSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const view = selectGraduationPathsView(snapshot, selectedPrefectureCode);
  if (!view)
    return (
      <ChartPanel title="高校卒業後の進路">
        <p role="status" className="text-sm text-muted-foreground">
          選択した地域の確認済みデータを取得できません。
        </p>
      </ChartPanel>
    );
  const areaLabel =
    view.areaCode === '00000' ? '全国（公式集計）' : view.areaName;
  return (
    <div
      className="min-w-0"
      data-theme-component-key="graduation-paths"
      data-data-state="ready"
      data-area-code={view.areaCode}
    >
      <ChartPanel
        title="高校卒業後の進路"
        description={`2025年3月卒業 · ${areaLabel} · 国公私立高校の全日制・定時制`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={GRADUATION_PATHS_SOURCE.title}
            sourceLink={GRADUATION_PATHS_SOURCE.url}
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          卒業した学校の所在地で集計しています。通信制高校・中等教育学校・特別支援学校は含みません。表示する県は、ページ共通の地域選択で切り替えられます。
        </p>
        <ValueTable
          ariaLabel={`${areaLabel}の高校卒業後の進路`}
          className="min-w-96"
          scrollRegion
          caption={
            <>
              構成割合の分母は、同じ地域・学校課程の卒業者総数{format(view.total)}
              人です。不詳・死亡を含む8区分の合計は総数と一致し、割合は小数第2位まで丸めています。
            </>
          }
          columns={[
            { key: 'category', header: '進路', rowHeader: true, className: 'min-w-40' },
            { key: 'count', header: '卒業者数（人）' },
            { key: 'share', header: '構成割合（%）' },
          ]}
          rows={[
            ...view.categories.map((category) => ({
              key: category.key,
              attrs: { 'data-category-key': category.key },
              cells: [
                category.label,
                { content: format(category.count), attrs: { 'data-count': category.count } },
                { content: format(category.share, 2), attrs: { 'data-share': category.share } },
              ],
            })),
            {
              key: 'total',
              total: true,
              cells: [
                '卒業者総数',
                { content: format(view.total), attrs: { 'data-total': view.total } },
                '100',
              ],
            },
          ]}
        />
        <p
          className="text-sm text-muted-foreground"
          data-overlap-employed={view.overlapEmployed}
        >
          進学しながら就職している人は{format(view.overlapEmployed)}
          人です。進学4区分の内数として既に含まれており、合計に加算しません。
        </p>
        <p className="text-sm text-muted-foreground">
          大学等進学には、大学・短期大学の通信教育部への進学も含みます。「左記以外の者」には外国の大学等への入学者や家事手伝い等も含まれます。
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          この表の「就職者等」は進学者を除く排他的な区分です。再掲の就職者から計算する公式の就職割合とは定義が異なります。各進学率・就職率カードとは、対象年と定義を分けて読んでください。
        </p>
      </ChartPanel>
    </div>
  );
}
