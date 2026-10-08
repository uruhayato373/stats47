import { describe, expect, it, vi } from 'vitest';

import type { CorrelationByThemeSnapshot } from '../../types/snapshot';

// 相関の計算本体は重い依存を持つので、テーマの指標の決め方だけを差し替える
vi.mock('../build-correlation-snapshot', () => ({ listThemeMembers: () => [] }));

import { findByThemeMismatches } from '../verify-correlation-by-theme';

function snapshot(themeKey: string, items: Array<[string, string]>): CorrelationByThemeSnapshot {
  return {
    generatedAt: '2026-10-08T00:00:00.000Z',
    themeKey,
    items: items.map(([rankingKey, via]) => ({
      rankingKey,
      title: rankingKey,
      populationAdjustedR: 0.8,
      via: { rankingKey: via, title: via },
    })),
  };
}

describe('findByThemeMismatches', () => {
  it('カタログから外した指標を基準にした行を見つける (2026-10-08 の物価テーマの再現)', () => {
    const snapshots = new Map([
      ['consumer-prices', snapshot('consumer-prices', [
        ['kerosene-consumption-expenditure', 'average-temperature'],
        ['utilities-expenditure-total', 'household-survey-utilities-expenditure'],
      ])],
    ]);
    const members = [['consumer-prices', ['household-survey-utilities-expenditure']]] as const;

    expect(findByThemeMismatches(snapshots, members)).toEqual([
      expect.objectContaining({
        themeKey: 'consumer-prices',
        rankingKey: 'kerosene-consumption-expenditure',
        reason: 'via-not-in-theme',
      }),
    ]);
  });

  it('テーマに入った指標が「テーマ外」として残っている行を見つける', () => {
    const snapshots = new Map([['tourism', snapshot('tourism', [['actual-overnight-guests', 'room-utilization-rate']])]]);
    const members = [['tourism', ['room-utilization-rate', 'actual-overnight-guests']]] as const;

    expect(findByThemeMismatches(snapshots, members).map((m) => m.reason)).toEqual(['item-in-theme']);
  });

  it('カタログと合っている snapshot と、snapshot の無いテーマは食い違いにしない', () => {
    const snapshots = new Map([['tourism', snapshot('tourism', [['other-metric', 'room-utilization-rate']])]]);
    const members = [
      ['tourism', ['room-utilization-rate']],
      ['consumer-prices', ['household-survey-utilities-expenditure']],
    ] as const;

    expect(findByThemeMismatches(snapshots, members)).toEqual([]);
  });
});
