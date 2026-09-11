import { lookupArea } from '@stats47/area';
import { NUTRITION_SOURCE } from '@stats47/data-configs/theme-catalog';
import { describe, expect, it } from 'vitest';

import { nutritionSnapshotSchema, parseNutritionSnapshot } from '../nutrition-snapshot';

function fixture() {
  const row = (code: string, metric: typeof NUTRITION_SOURCE.metrics[number]) => ({
    areaCode: code,
    areaName: code === '00000' ? '全国' : lookupArea(code)!.areaName,
    metricKey: metric.key,
    mean: code === '00000' ? 8 : 10,
    lower95: 7,
    upper95: 12,
    sampleSize: code === '00000' ? 47 * 100 : 100,
    period: NUTRITION_SOURCE.period,
    ageAdjustment: NUTRITION_SOURCE.ageAdjustment,
    source: { title: '原典の表', url: NUTRITION_SOURCE.url, sha256: NUTRITION_SOURCE.sha256,
      table: metric.table, pdfPage: metric.pdfPage },
  });
  return {
    schemaVersion: 1,
    generatedAt: '2026-09-10T00:00:00.000Z',
    rows: Array.from({ length: 47 }, (_, index) => `${String(index + 1).padStart(2, '0')}000`)
      .flatMap(code => NUTRITION_SOURCE.metrics.map(metric => row(code, metric))),
    national: NUTRITION_SOURCE.metrics.map(metric => row('00000', metric)),
    notes: ['年齢調整した平均で、全国は公式行を使用する。'],
  };
}

describe('栄養の平均・95%信頼区間・集計人数', () => {
  it('公式全国平均は県平均の単純平均に置き換えず保持する', () => {
    const result = nutritionSnapshotSchema.parse(fixture());
    expect(result.national[0].mean).toBe(8);
    expect(result.rows[0].mean).toBe(10);
    expect(result.national[0].sampleSize).toBe(4700);
  });

  it('欠測を0で補わず、不正な区間・母数・原典・重複を拒否する', () => {
    const mutations = [
      (data: ReturnType<typeof fixture>) => { data.rows[0].lower95 = 11; },
      (data: ReturnType<typeof fixture>) => { data.rows[0].sampleSize = 0; },
      (data: ReturnType<typeof fixture>) => { data.rows[0].sampleSize = 99; },
      (data: ReturnType<typeof fixture>) => { data.rows[0].areaName = '青森県'; },
      (data: ReturnType<typeof fixture>) => { data.rows[0] = { ...data.rows[1] }; },
      (data: ReturnType<typeof fixture>) => { data.rows.pop(); },
      (data: ReturnType<typeof fixture>) => { data.national[0].areaCode = '01000'; },
    ];
    for (const mutate of mutations) {
      const data = fixture(); mutate(data);
      expect(parseNutritionSnapshot(data)).toBeNull();
    }
    const data = fixture();
    expect(parseNutritionSnapshot({ ...data, rows: [{ ...data.rows[0], mean: null }, ...data.rows.slice(1)] })).toBeNull();
    expect(parseNutritionSnapshot({ ...data, rows: [{ ...data.rows[0], period: '2023' }, ...data.rows.slice(1)] })).toBeNull();
    expect(parseNutritionSnapshot({ ...data, rows: [{ ...data.rows[0], source: { ...data.rows[0].source, sha256: 'a'.repeat(64) } }, ...data.rows.slice(1)] })).toBeNull();
  });
});
