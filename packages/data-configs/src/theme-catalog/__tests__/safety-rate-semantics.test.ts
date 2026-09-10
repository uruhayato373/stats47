import { describe, expect, it } from 'vitest';

import { getMetricConfig } from '../../registry';
import { SAFETY_CATALOG } from '../safety';

// e-Stat 項目定義: https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/{K,I}
const rates = [
  ['penal-code-offenses-recognized-per-1000', '#K06101', '人口千人当たり', '件'],
  ['annual-emergency-dispatches-per-1000', '#I11201', '人口千人当たり', '件'],
  ['building-fire-count-per-100-thousand-people', '#K02101', '人口10万人当たり', '件'],
  ['traffic-accident-count-per-population', '#K04101', '人口10万人当たり', '件'],
  ['traffic-accident-deaths-per-100k', '#K04106', '人口10万人当たり', '人'],
  ['traffic-accident-injuries-per-100k', '#K04107', '人口10万人当たり', '人'],
  ['theft-offenses-recognized-per-1000', '#K06104', '人口千人当たり', '件'],
  ['juvenile-criminal-arrest-person-per-population', '#K06301', '14～19歳人口千人当たり', '人'],
  ['drug-enforcement-arrest-count-per-population', '#K06503', '人口10万人当たり', '件'],
  ['traffic-accident-deaths-per-100-accidents', '#K04202', '交通事故100件当たり', '人'],
  ['fire-damage-casualties-per-population', '#K02203', '人口10万人当たり', '人'],
  ['disaster-damage-amount-per-person', '#K07105', '人口1人当たり', '円'],
  ['suicides-per-100k', '#I06201', '日本人人口10万人当たり', '人'],
  ['accidental-deaths-per-100k', '#K08101', '人口10万人当たり', '人'],
  ['police-officer-count-per-population', '#K05103', '人口千人当たり', '人'],
] as const;

const rawKeys = [
  'serious-crime-per-100k', 'criminal-recognition-count', 'violent-crime-per-100k',
  'intellectual-crime-per-100k', 'traffic-accident-count', 'traffic-accident-casualties-elderly-65plus',
  'fire-deaths-per-100k', 'traffic-accident-injuries',
];
const otherRates = ['criminal-arrest-rate', 'theft-criminal-arrest-rate', 'suicide-rate-per-100k'];

describe('安全テーマの人口当たり指標', () => {
  it.each(rates.map(([key, code, denominator, unit]) => ({ metric: getMetricConfig(key)!, code, denominator, unit })))('$metric.key は公式の分母をラベルへ保持し、再び人口や面積で割らない', ({ metric, code, denominator, unit }) => {
    expect(metric.source).toMatchObject({ kind: 'estat', cdCat01: code });
    expect(metric.unit).toBe(unit);
    expect(metric.subtitle).toBe(denominator);
    expect(metric.display?.conversionFactor).toBe(1);
    expect(metric.calculation?.normalizationOptions ?? []).toEqual([]);
    expect(metric.description).toContain(denominator);
    const entry = SAFETY_CATALOG.metrics.find(({ rankingKey }) => rankingKey === metric.key);
    expect(entry?.shortLabel).toContain(denominator);
    expect(metric.seoTitle).toContain(denominator);
    expect(metric.seoDescription).toContain(denominator);
  });

  it('全26定義を率と総数に分け、raw総数の正規化設定を保持する', () => {
    const reviewedKeys = [...rates.map(([key]) => key), ...rawKeys, ...otherRates];
    expect(SAFETY_CATALOG.metrics.map(({ rankingKey }) => rankingKey).sort()).toEqual(reviewedKeys.sort());
    for (const key of rawKeys) {
      const metric = getMetricConfig(key)!;
      expect(metric.calculation?.normalizationOptions?.map(({ type }) => type), key).toEqual(['per_population', 'per_area']);
      expect(metric.description, key).not.toMatch(/人口.*当たり/);
    }
    for (const key of otherRates) expect(getMetricConfig(key)?.calculation?.normalizationOptions ?? [], key).toEqual([]);
    expect(JSON.stringify(SAFETY_CATALOG.charts)).not.toContain('"normalization"');
  });

  it('犯罪・救急・火災の図は分母を明示し、総数の図とは区別する', () => {
    const crime = SAFETY_CATALOG.charts.find(({ componentKey }) => componentKey === 'crime-count-arrest-rate-trend');
    expect(crime?.componentProps).toMatchObject({ leftUnit: '件/千人', columnLabels: ['認知件数（人口千人当たり）'] });
    expect(crime?.title).toContain('人口千人当たり');
    expect(SAFETY_CATALOG.charts.find(({ componentKey }) => componentKey === 'fire-emergency-trend')?.title).toContain('人口千人当たり');
    expect(SAFETY_CATALOG.charts.find(({ componentKey }) => componentKey === 'fire-emergency-trend-fire')?.title).toContain('人口10万人当たり');

    const trafficTotals = SAFETY_CATALOG.charts.find(({ componentKey }) => componentKey === 'traffic-accident-deaths-trend');
    expect(trafficTotals?.componentProps).toMatchObject({ seriesRefs: [{ metricKey: 'traffic-accident-count' }, { metricKey: 'traffic-accident-injuries' }] });
    const rateKeys = rates.map(([key]) => key);
    for (const chart of SAFETY_CATALOG.charts.filter(({ componentType }) => componentType === 'donut-chart')) {
      for (const key of rateKeys) expect(JSON.stringify(chart.componentProps)).not.toContain(key);
    }
  });
});
