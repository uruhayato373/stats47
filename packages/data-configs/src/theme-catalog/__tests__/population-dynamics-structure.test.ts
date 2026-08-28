import { describe, expect, it } from 'vitest';

import { POPULATION_DYNAMICS_CATALOG } from '../population-dynamics';

describe('人口動態テーマの可視化構成', () => {
  it('結果と自然増減を同じ単位の主要カードで比較する', () => {
    expect(POPULATION_DYNAMICS_CATALOG.metricGroups).toEqual([
      {
        key: 'population-change',
        title: '人口増減の結果と自然増減',
        rankingKeys: ['population-growth-rate', 'natural-increase-rate'],
        defaultCheckedKeys: ['population-growth-rate', 'natural-increase-rate'],
      },
    ]);

    const roles = new Map(
      POPULATION_DYNAMICS_CATALOG.metrics.map((metric) => [
        metric.rankingKey,
        metric.role,
      ])
    );
    expect(roles.get('population-growth-rate')).toBe('primary');
    expect(roles.get('natural-increase-rate')).toBe('secondary');
    expect(roles.get('total-population')).toBe('context');
  });

  it('自然増減、社会増減、人口構造の順で重複なく表示する', () => {
    const visualCharts = POPULATION_DYNAMICS_CATALOG.charts.filter(
      (chart) => chart.componentType !== 'markdown-section'
    );

    expect(visualCharts.map((chart) => chart.componentKey)).toEqual([
      'birth-death-count-trend',
      'theme-pop-migration-trend',
      'theme-age-composition',
      'theme-population-pyramid',
    ]);
    expect(visualCharts.map((chart) => chart.sortOrder)).toEqual([
      10, 20, 30, 40,
    ]);
    expect(
      visualCharts.find(
        (chart) => chart.componentKey === 'theme-pop-migration-trend'
      )?.annotation
    ).toBeUndefined();
    expect(
      visualCharts.every((chart) => chart.sourceLink?.startsWith('https://'))
    ).toBe(true);
  });

  it('出生数・死亡数を率として誤表示しない', () => {
    const birthDeath = POPULATION_DYNAMICS_CATALOG.charts.find(
      (chart) => chart.componentKey === 'birth-death-count-trend'
    );
    const refs = birthDeath?.componentProps.seriesRefs as
      | Array<{ metricKey?: string }>
      | undefined;

    expect(birthDeath?.title).toContain('出生数と死亡数');
    expect(refs?.map((ref) => ref.metricKey)).toEqual(['births', 'death-count']);
    expect(
      POPULATION_DYNAMICS_CATALOG.charts.map((chart) => chart.componentKey)
    ).not.toContain('birth-death-rate-trend');
  });
});
