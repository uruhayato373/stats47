import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CategoryHeatmap } from '../CategoryHeatmap/CategoryHeatmap';
import { DonutChart } from '../DonutChart/DonutChart';
import { HorizontalDivergingBarChart } from '../HorizontalDivergingBarChart/HorizontalDivergingBarChart';
import { LineChart } from '../LineChart/LineChart';
import { MixedChart } from '../MixedChart/MixedChart';
import { PyramidChart } from '../PyramidChart/PyramidChart';

describe('theme chart SVG accessibility', () => {
  it('折れ線グラフを系列・期間・単位で識別できる', () => {
    render(
      <LineChart
        title="人口推移"
        data={[
          { category: '2020', label: '2020年', population: 10 },
          { category: '2021', label: '2021年', population: 12 },
        ]}
        series={[{ dataKey: 'population', name: '人口', color: 'blue' }]}
        unit="万人"
      />
    );

    expect(
      screen.getByRole('img', {
        name: '折れ線グラフ「人口推移」。系列: 人口。期間: 2020年から2021年。左軸単位: 万人',
      })
    ).toBeTruthy();
  });

  it('複合グラフを棒・折れ線系列と両軸単位で識別できる', () => {
    render(
      <MixedChart
        title="出生と出生率"
        data={[
          { category: '2020', label: '2020年', births: 10, rate: 1.2 },
          { category: '2021', label: '2021年', births: 11, rate: 1.3 },
        ]}
        columns={[{ dataKey: 'births', name: '出生数', color: 'blue' }]}
        lines={[{ dataKey: 'rate', name: '出生率', color: 'red' }]}
        leftUnit="人"
        rightUnit="%"
      />
    );

    expect(
      screen.getByRole('img', {
        name: '棒・折れ線複合グラフ「出生と出生率」。棒系列: 出生数。折れ線系列: 出生率。期間: 2020年から2021年。左軸単位: 人。右軸単位: %',
      })
    ).toBeTruthy();
  });

  it('ドーナツグラフを内訳と合計で識別できる', () => {
    render(
      <DonutChart
        title="産業構成"
        data={[
          { name: '第一次産業', value: 20 },
          { name: '第二次産業', value: 80 },
        ]}
        unit="%"
        centerText="100%"
      />
    );

    expect(
      screen.getByRole('img', {
        name: 'ドーナツグラフ「産業構成」。内訳: 第一次産業、第二次産業。合計: 100%。中央表示: 100%',
      })
    ).toBeTruthy();
  });

  it('ドーナツグラフの合計をデータセット精度で表示する', () => {
    render(
      <DonutChart
        title="産業構成"
        data={[
          { name: '第一次産業', value: 20.5 },
          { name: '第二次産業', value: 79 },
        ]}
        unit="%"
      />
    );

    expect(
      screen.getByRole('img', {
        name: 'ドーナツグラフ「産業構成」。内訳: 第一次産業、第二次産業。合計: 99.5%',
      })
    ).toBeTruthy();
  });

  it('水平乖離棒グラフを基準値・項目・値域で識別できる', () => {
    render(
      <HorizontalDivergingBarChart
        data={[
          { label: '食料', value: 98 },
          { label: '住居', value: 103 },
        ]}
        baseline={100}
      />
    );

    expect(
      screen.getByRole('img', {
        name: '基準値からの乖離を示す水平棒グラフ。基準値: 100。項目: 食料、住居。値の範囲: 98から103',
      })
    ).toBeTruthy();
  });

  it('水平乖離棒グラフの基準値と値域の小数桁を揃える', () => {
    render(
      <HorizontalDivergingBarChart
        data={[
          { label: '食料', value: 98 },
          { label: '住居', value: 103.5 },
        ]}
        baseline={100}
      />
    );

    expect(
      screen.getByRole('img', {
        name: '基準値からの乖離を示す水平棒グラフ。基準値: 100.0。項目: 食料、住居。値の範囲: 98.0から103.5',
      })
    ).toBeTruthy();
  });

  it('ヒートマップを両軸と基準値で識別できる', () => {
    render(
      <CategoryHeatmap
        data={[
          { x: '2020年', y: '食料', value: 98 },
          { x: '2021年', y: '食料', value: 101 },
          { x: '2020年', y: '住居', value: 102 },
        ]}
        baseline={100}
      />
    );

    expect(
      screen.getByRole('img', {
        name: 'カテゴリヒートマップ。横軸: 2020年、2021年。縦軸: 食料、住居。基準値: 100',
      })
    ).toBeTruthy();
  });

  it('人口ピラミッドを年齢階級と男女合計で識別できる', async () => {
    render(
      <PyramidChart
        title="年齢構成"
        chartData={[
          { ageGroup: '0〜4歳', male: -100, female: 110 },
          { ageGroup: '5〜9歳', male: -120, female: 130 },
        ]}
      />
    );

    expect(
      await screen.findByRole('img', {
        name: '人口ピラミッド「年齢構成」。年齢階級: 0〜4歳、5〜9歳。男性合計: 220人。女性合計: 240人',
      })
    ).toBeTruthy();
  });

  it('人口ピラミッドの男女合計の小数桁を揃える', async () => {
    render(
      <PyramidChart
        title="年齢構成"
        chartData={[
          { ageGroup: '0〜4歳', male: -100, female: 110 },
          { ageGroup: '5〜9歳', male: -120.5, female: 130 },
        ]}
      />
    );

    expect(
      await screen.findByRole('img', {
        name: '人口ピラミッド「年齢構成」。年齢階級: 0〜4歳、5〜9歳。男性合計: 220.5人。女性合計: 240.0人',
      })
    ).toBeTruthy();
  });
});
