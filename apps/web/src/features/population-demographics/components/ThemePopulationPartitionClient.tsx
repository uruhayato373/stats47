'use client';

import { useState } from 'react';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import { useThemePrefecture } from '@/features/theme-dashboard';

import {
  selectPartitionView,
  SEX_LABELS,
  type PopulationSex,
} from '../lib/population-profile-view';

import { PopulationPartitionTable } from './PopulationPartitionTable';
import { PopulationSexSelect } from './PopulationProfileControls';

import type {
  SingleHouseholdsProfile,
  FiveYearResidenceProfile,
} from '@stats47/data-configs/theme-catalog';

export function ThemePopulationPartitionClient({
  snapshot,
}: {
  snapshot: SingleHouseholdsProfile | FiveYearResidenceProfile;
}) {
  const { selectedPrefectureCode } = useThemePrefecture();
  const [sex, setSex] = useState<PopulationSex>('0');
  const isHousehold = snapshot.kind === 'single-households-demographics';
  const title = isHousehold
    ? 'ひとり暮らし世帯の男女・年齢構成'
    : '5年前にはどこに住んでいたか';
  const view = selectPartitionView(snapshot, selectedPrefectureCode, sex);
  if (!view)
    return (
      <ChartPanel title={title}>
        <p role="status" className="text-sm text-muted-foreground">
          選択した地域の確認済みデータを取得できません。
        </p>
      </ChartPanel>
    );
  const areaLabel =
    view.area.areaCode === '00000' ? '全国（公式集計）' : view.area.areaName;
  const sectionKey = isHousehold
    ? 'single-households-demographics'
    : 'five-year-residence';
  return (
    <div
      className="min-w-0"
      data-theme-component-key={sectionKey}
      data-data-state="ready"
      data-area-code={view.area.areaCode}
      data-sex={sex}
    >
      <ChartPanel
        title={title}
        description={`2020年10月1日 · ${areaLabel} · ${SEX_LABELS[sex]} · ${isHousehold ? '単独世帯' : '5歳以上の常住者'}`}
        contentClassName="min-w-0 space-y-4"
        footer={
          <ChartFooter
            source={
              isHousehold
                ? '令和2年国勢調査 人口等基本集計 第12-1表'
                : '令和2年国勢調査 移動人口の男女・年齢等集計 第1表'
            }
            sourceLink={snapshot.sources[0].url}
          />
        }
      >
        <div className="flex flex-wrap gap-3">
          <PopulationSexSelect value={sex} onChange={setSex} />
        </div>
        <p className="text-sm text-muted-foreground">
          {isHousehold
            ? '1人で暮らす一般世帯の構成です。施設等の世帯を含みません。年齢不詳も1つの区分として残しています。'
            : '2020年の住民を2015年の常住地と比較しています。5年間の引越し回数ではありません。5歳未満と年齢不詳を含まず、居住地・移動状況が不詳の人は別区分に残しています。'}
        </p>
        <PopulationPartitionTable
          areaName={`${areaLabel}・${SEX_LABELS[sex]}`}
          category={isHousehold ? '年齢' : '5年前の常住地'}
          unit={snapshot.unit}
          rows={view.rows}
          total={view.total}
        />
      </ChartPanel>
    </div>
  );
}
