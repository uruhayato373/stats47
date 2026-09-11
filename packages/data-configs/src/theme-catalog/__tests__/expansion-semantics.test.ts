import { describe, expect, it } from 'vitest';

import { METRICS_REGISTRY } from '../../registry';
import { THEME_CATALOGS } from '../index';

describe('拡充テーマの地域・母集団・分母', () => {
  it('K6の推計人数を分母の根拠として保持し、独立カードに重複表示しない', () => {
    const catalog = THEME_CATALOGS.healthcare;
    for (const key of ['k6-score10plus-estimated-persons-12plus', 'k6-known-score-estimated-persons-12plus']) {
      expect(catalog.metrics.find(metric => metric.rankingKey === key)?.role).toBe('context');
      expect(catalog.metricGroups?.some(group => group.rankingKeys.includes(key))).toBe(false);
    }
    expect(catalog.metricGroups?.some(group => group.rankingKeys.includes('k6-score10plus-rate-12plus'))).toBe(true);
  });
  it('県別テーマに市区町村専用の指標を混入しない', () => {
    for (const catalog of Object.values(THEME_CATALOGS)) {
      for (const metric of catalog.metrics) {
        expect(METRICS_REGISTRY[metric.rankingKey]?.entities, `${catalog.key}/${metric.rankingKey}`).toContain('prefecture');
      }
    }
  });
  it('就業・進学・将来推計の問いを別の指標で代用しない', () => {
    const keys = (theme: string, id: number) => THEME_CATALOGS[theme].metricGroups!
      .filter((group) => group.key.startsWith(`candidate-${id}-`)).flatMap((group) => group.rankingKeys);
    expect(keys('aging-society', 36)).toEqual(['elderly-workers-ratio']);
    expect(keys('education-culture', 53)).toEqual(['high-school-advancement-rate']);
    expect(keys('labor-mobility', 37)).toEqual([
      'non-regular-employment-rate', 'nonregular-employees-count',
      'nonregular-continuation-wish-rate', 'nonregular-job-change-wish-rate',
    ]);
    expect(keys('population-dynamics', 47)).toEqual(['future-population', 'future-population-change-rate-2050']);
  });
  it('ひとり親と単身世帯を分け、保育士当たりの児童数を総数と呼ばない', () => {
    expect(THEME_CATALOGS['single-parent-households'].metrics.map((metric) => metric.rankingKey)).not.toContain('single-person-household-ratio');
    const childcare = THEME_CATALOGS['childcare-services'].metrics.find((metric) => metric.rankingKey === 'nursery-children-per-nursery-teacher');
    expect(childcare?.shortLabel).toContain('保育士1人当たり');
  });
  it('森林ストックと造林の実施面積を識別する', () => {
    for (const key of ['forestry-timber', 'natural-environment']) {
      const metrics = THEME_CATALOGS[key].metrics;
      expect(metrics.map((metric) => metric.rankingKey)).toContain('woodland-area');
      expect(metrics.find((metric) => metric.rankingKey === 'artificial-forest-area')?.shortLabel).toBe('人工造林面積');
    }
  });
  it('収集終了した携帯電話込みの系列を現行系列に接続しない', () => {
    const groups = THEME_CATALOGS['communication-access'].metricGroups!;
    expect(groups.some((group) => group.rankingKeys.includes('broadband-service-contract-count') && group.rankingKeys.includes('broadband-contract-count-excluding-39-4g'))).toBe(false);
    expect(METRICS_REGISTRY['broadband-service-contract-count'].years).toEqual({ from: 2010, to: 2017 });
  });
  it('9,304千円の金融負債を930.4万円として表示する', () => {
    const config = METRICS_REGISTRY['financial-debt-balance'];
    expect(config.unit).toBe('千円');
    expect(config.display?.displayUnit).toBe('万円');
    expect(9304 * config.display!.conversionFactor!).toBeCloseTo(930.4, 6);
  });
  it('自治体DXの公表年を利用実績年度に置き換えない', () => {
    expect(METRICS_REGISTRY['prefectural-eltax-online-application-rate'].years).toEqual({ from: 2022, to: 2022 });
    expect(METRICS_REGISTRY['prefectural-auto-environment-tax-online-application-rate'].years).toEqual({ from: 2023, to: 2023 });
    expect(METRICS_REGISTRY['prefectural-dx-online-procedure-rate'].yearFormat).toBe('calendar');
    expect(METRICS_REGISTRY['prefectural-dx-online-procedure-rate'].subtitle).toContain('4月1日');
  });
  it('発明者のPCT集計変更前後を接続せず、ふるさと納税の課税年度を受入年度と分ける', () => {
    expect(METRICS_REGISTRY['patent-inventor-count'].years).toMatchObject({ from: 2016 });
    expect(METRICS_REGISTRY['furusato-donation-amount-prefecture'].years).toMatchObject({ from: 2025 });
    expect(METRICS_REGISTRY['furusato-tax-deduction-municipal-prefecture'].years).toMatchObject({ from: 2026 });
  });

  it('所得格差には丸められたSSDS系列でなくジニ係数の元表を使う', () => {
    expect(METRICS_REGISTRY['gini-coefficient-disposable-income'].source)
      .toMatchObject({ statsDataId: '0003440743', cdTab: '25-2019', cdCat01: '1' });
    expect(METRICS_REGISTRY['gini-coefficient-financial-assets'].source)
      .toMatchObject({ statsDataId: '0003440696', cdTab: '25-2019', cdCat01: '2' });
    for (const key of ['gini-coefficient-disposable-income', 'gini-coefficient-financial-assets', 'home-helper-users-per-office']) {
      expect(METRICS_REGISTRY[key].calculation?.normalizationOptions).toBeUndefined();
    }
  });

  it('県別家計の比較で県庁所在市の家計調査を混ぜない', () => {
    const groups = THEME_CATALOGS['real-income'].metricGroups!
      .filter((group) => group.key.startsWith('candidate-77-'));
    for (const key of groups.flatMap((group) => group.rankingKeys)) {
      expect(METRICS_REGISTRY[key].source).toMatchObject({ statsDataId: '0000010112' });
      expect(METRICS_REGISTRY[key].subtitle).toContain('10〜11月');
    }
    const chart = THEME_CATALOGS['real-income'].charts.find((entry) => entry.componentKey === 'real-income-household-composition');
    const keys = chart?.relatedRankingKeys ?? [];
    expect(keys).toHaveLength(10);
    expect(new Set(keys).size).toBe(10);
    expect(keys).not.toContain('household-survey-consumption-expenditure');
    for (const key of keys) {
      expect(METRICS_REGISTRY[key].source).toMatchObject({ statsDataId: '0000010112' });
      expect(METRICS_REGISTRY[key].years).toEqual({ years: [2019, 2024] });
    }
  });
});
