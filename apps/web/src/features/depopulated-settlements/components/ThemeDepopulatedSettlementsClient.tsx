'use client';

import { ChartPanel } from '@stats47/components';
import { DEPOPULATED_SETTLEMENTS_SOURCE } from '@stats47/data-configs/theme-catalog';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ValueTable } from '@/components/surface';

import { useThemePrefecture } from '@/features/theme-dashboard';

import { selectDepopulatedSettlementsView } from '../lib/depopulated-settlements-view';

import type { DepopulatedSettlementsSnapshot } from '../lib/depopulated-settlements-snapshot';

const format = (value: number, maximumFractionDigits = 0) =>
  value.toLocaleString('ja-JP', { maximumFractionDigits });

export function ThemeDepopulatedSettlementsClient({
  snapshot,
}: {
  snapshot: DepopulatedSettlementsSnapshot;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const view = selectDepopulatedSettlementsView(
    snapshot,
    selectedPrefectureCode
  );
  if (!view)
    return (
      <ChartPanel title="過疎地域等の集落と高齢化">
        <p role="status" className="text-sm text-muted-foreground">
          選択した県に対応する地方ブロックを確認できません。
        </p>
      </ChartPanel>
    );
  const region =
    view.geography === 'national'
      ? '全国（調査対象集落）'
      : `${view.blockName}（地方ブロックの集計）`;
  return (
    <div
      className="min-w-0"
      data-theme-component-key="depopulated-settlements"
      data-data-state="ready"
      data-geography={view.geography}
      data-block-code={view.blockCode}
    >
      <ChartPanel
        title="過疎地域等の集落と高齢化"
        description={`2024年4月1日時点 · ${region}`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={DEPOPULATED_SETTLEMENTS_SOURCE.title}
            sourceLink={`${DEPOPULATED_SETTLEMENTS_SOURCE.url}#page=81`}
          />
        }
      >
        {view.geography === 'survey-block' ? (
          <p className="text-sm" data-geography-notice>
            選択中の{view.requestedPrefectureName}に対応する
            <strong>{view.blockName}全体</strong>
            の値です。
            {view.memberPrefectureNames.length === 1
              ? 'このブロックは1道県だけで構成されます。全国47県を個別に比較する県別表ではありません。'
              : '県単独の値はこの表に公表されていません。'}
            <br />
            対象ブロック：{view.memberPrefectureNames.join('・')}
            。県の値への配分はしていません。
          </p>
        ) : (
          <p className="text-sm" data-geography-notice>
            全国と10地方ブロックで公表された集落数です。県を選択すると、その県に対応する地方ブロック全体の値を表示します。
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          {DEPOPULATED_SETTLEMENTS_SOURCE.universe}
        </p>
        <p className="text-sm" data-half-or-more={view.age65Share50plus}>
          住民の半数以上が65歳以上の集落は{format(view.age65Share50plus)}集落（
          {format(view.age65Share50plusPercent, 1)}
          %）。このうち全員が65歳以上の集落は{format(view.age65Share100)}
          集落です。いずれも下表の内数です。
        </p>
        <ValueTable
          ariaLabel={`${region}の集落高齢化プロフィール`}
          className="min-w-96"
          scrollRegion
          caption={
            <>
              集落数の構成割合は、無回答を含む{format(view.total)}
              集落を分母に計算しています。住民人数の構成比ではありません。割合は小数第1位に丸めています。
            </>
          }
          columns={[
            { key: 'category', header: '集落人口に占める65歳以上割合', rowHeader: true },
            { key: 'count', header: '集落数' },
            { key: 'share', header: '構成割合（%）' },
          ]}
          rows={[
            ...view.categories.map((category) => ({
              key: category.key,
              attrs: { 'data-category-key': category.key },
              cells: [
                category.label,
                { content: format(category.count), attrs: { 'data-count': category.count } },
                { content: format(category.share, 1), attrs: { 'data-share': category.share } },
              ],
            })),
            {
              key: 'total',
              total: true,
              cells: [
                '対象集落総数',
                { content: format(view.total), attrs: { 'data-total': view.total } },
                '100',
              ],
            },
          ]}
        />
        {view.geography === 'national' && (
          <ValueTable
            ariaLabel="10地方ブロックの対象集落と高齢化"
            className="min-w-96"
            scrollRegion
            caption="各地方ブロックの対象集落数と、住民の半数以上が65歳以上の集落数。無回答は各ブロックの総数に含みます。"
            columns={[
              { key: 'block', header: '地方ブロック', rowHeader: true },
              { key: 'total', header: '対象集落' },
              { key: 'half', header: '65歳以上が半数以上' },
              { key: 'noAnswer', header: '無回答' },
            ]}
            rows={snapshot.rows.map((row) => ({
              key: row.blockCode,
              cells: [
                row.blockName,
                format(row.total),
                format(row.age65Share50plus),
                format(row.categories[6].count),
              ],
            }))}
          />
        )}
        <p className="text-sm text-muted-foreground">
          無回答は高齢者がいない集落とは異なります。集落の定義は市町村の社会生活・行政上の単位に基づき、国勢調査や農林業センサスの地域区分とは異なります。原発事故に伴い過去の調査時点で避難指示区域にあった5町村は調査対象外です。
        </p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          地域の範囲は
          <a
            href={`${DEPOPULATED_SETTLEMENTS_SOURCE.url}#page=19`}
            className="underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            原典の地方ブロック定義（図表1-5）
          </a>
          に従っています。新潟県は東北圏、福井県は北陸圏です。
        </p>
      </ChartPanel>
    </div>
  );
}
