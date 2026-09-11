import { lookupArea } from '@stats47/area';
import { INDUSTRY_SPECIALIZATION_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { describe, expect, it } from 'vitest';

import { parseIndustrySpecializationSnapshot } from '../industry-specialization-snapshot';

function fixture() {
  const area = (code: string) => ({
    areaCode: code,
    areaName: code === '00000' ? '全国' : lookupArea(code)!.areaName,
    totalEmployees: 181 * (code === '00000' ? 47 : 1),
    unclassifiedEmployees: code === '00000' ? 47 : 1,
    industries: Array.from('ABCDEFGHIJKLMNOPQR', (industryCode) => ({
      industryCode,
      industryName: `産業${industryCode}`,
      employees: 10 * (code === '00000' ? 47 : 1),
      sharePercent: (10 / 181) * 100,
      nationalSharePercent: (10 / 181) * 100,
      locationQuotient: 1,
    })),
  });
  return {
    schemaVersion: 1,
    period: source.period,
    generatedAt: '2026-09-10T00:00:00.000Z',
    source: { title: source.title, url: source.url, sha256: source.sha256 },
    population: source.population,
    industryClassification: source.industryClassification,
    denominator: source.denominator,
    formula: source.formula,
    areas: Array.from({ length: 47 }, (_, i) =>
      area(`${String(i + 1).padStart(2, '0')}000`)
    ),
    national: area('00000'),
    notes: [...source.notes],
  };
}

describe('産業別従業者構成と特化係数', () => {
  it('未分類人数を含む公式分母を保持し、18業種へ再正規化しない', () => {
    const data = parseIndustrySpecializationSnapshot(fixture());
    expect(data).not.toBeNull();
    expect(
      data!.areas[0].industries.reduce((sum, row) => sum + row.sharePercent, 0)
    ).toBeLessThan(100);
    expect(data!.national.unclassifiedEmployees).toBe(47);
  });
  it('誤分母・比率・県重複・分類変更・全国不一致を拒否する', () => {
    const mutations = [
      (d: ReturnType<typeof fixture>) => {
        d.areas[0].totalEmployees = 180;
      },
      (d: ReturnType<typeof fixture>) => {
        d.areas[0].industries[0].sharePercent = (1 / 18) * 100;
      },
      (d: ReturnType<typeof fixture>) => {
        d.areas[0].industries[0].locationQuotient = 1.1;
      },
      (d: ReturnType<typeof fixture>) => {
        d.areas[0].industries[0].nationalSharePercent = 0;
      },
      (d: ReturnType<typeof fixture>) => {
        d.areas[0] = structuredClone(d.areas[1]);
      },
      (d: ReturnType<typeof fixture>) => {
        d.areas[0].industries[0].industryCode = 'B';
      },
      (d: ReturnType<typeof fixture>) => {
        d.areas[0].industries[0].industryName = '別の産業';
      },
      (d: ReturnType<typeof fixture>) => {
        d.national.industries[0].employees += 1;
      },
      (d: ReturnType<typeof fixture>) => {
        d.national.unclassifiedEmployees = 0;
      },
    ];
    for (const mutate of mutations) {
      const data = fixture();
      mutate(data);
      expect(parseIndustrySpecializationSnapshot(data)).toBeNull();
    }
    expect(
      parseIndustrySpecializationSnapshot({ ...fixture(), period: '2020' })
    ).toBeNull();
    expect(
      parseIndustrySpecializationSnapshot({
        ...fixture(),
        source: { ...fixture().source, sha256: 'a'.repeat(64) },
      })
    ).toBeNull();
  });
});
