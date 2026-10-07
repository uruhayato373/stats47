import { describe, expect, it } from 'vitest';

import { resolveComparisonYears } from '../resolve-comparison-years';

import type { CatalogMetricGroup } from '@stats47/data-configs/theme-catalog';

const group = (key: string, rankingKeys: string[], comparisonYear?: string): CatalogMetricGroup =>
  ({ key, title: key, rankingKeys, defaultCheckedKeys: rankingKeys.slice(0, 1), ...(comparisonYear ? { comparisonYear } : {}) }) as CatalogMetricGroup;
const years = (entries: Record<string, string[] | undefined>) => new Map(Object.entries(entries));

describe('年を固定した比較カードの年の追従', () => {
  it('全指標に値がそろう新しい年があれば、その最新年へ進む', () => {
    const [resolved] = resolveComparisonYears(
      [group('waste', ['a', 'b'], '2021')],
      years({ a: ['2021', '2022', '2023'], b: ['2021', '2022', '2023'] }),
    );
    expect(resolved.comparisonYear).toBe('2023');
  });

  it('1 指標でも値が無い年へは進まない (指標ごとの最新年にも代替しない)', () => {
    const [resolved] = resolveComparisonYears(
      [group('waste', ['a', 'b'], '2021')],
      years({ a: ['2021', '2023'], b: ['2021', '2022'] }),
    );
    expect(resolved.comparisonYear).toBe('2021');
  });

  it('起点より古い年へは戻らない', () => {
    const [resolved] = resolveComparisonYears(
      [group('census', ['a'], '2021')],
      years({ a: ['2016', '2021'] }),
    );
    expect(resolved.comparisonYear).toBe('2021');
  });

  it('年度コード (10 桁) も先頭 4 桁の年で比べる', () => {
    const [resolved] = resolveComparisonYears(
      [group('fiscal', ['a'], '2021')],
      years({ a: ['2021100000', '2022100000'] }),
    );
    expect(resolved.comparisonYear).toBe('2022');
  });

  it('年の一覧が無い指標があれば起点の年のまま', () => {
    const [resolved] = resolveComparisonYears(
      [group('waste', ['a', 'b'], '2021')],
      years({ a: ['2021', '2023'], b: undefined }),
    );
    expect(resolved.comparisonYear).toBe('2021');
  });

  it('読めなかった指標 (表示されない) は判定から外す', () => {
    const [resolved] = resolveComparisonYears(
      [group('waste', ['a', 'missing'], '2021')],
      years({ a: ['2021', '2023'] }),
    );
    expect(resolved.comparisonYear).toBe('2023');
  });

  it('同じ指標を含む比較グループは同じ年にそろえる', () => {
    const resolved = resolveComparisonYears(
      [group('g1', ['a', 'b'], '2021'), group('g2', ['b', 'c'], '2021')],
      years({ a: ['2021', '2023'], b: ['2021', '2022', '2023'], c: ['2021', '2022'] }),
    );
    expect(resolved.map((g) => g.comparisonYear)).toEqual(['2021', '2021']);
  });

  it('比較年の無いグループと並び順は変えない', () => {
    const plain = group('trend', ['x']);
    const resolved = resolveComparisonYears(
      [plain, group('fixed', ['a'], '2021')],
      years({ x: ['2024'], a: ['2021', '2024'] }),
    );
    expect(resolved[0]).toBe(plain);
    expect(resolved[1].comparisonYear).toBe('2024');
  });
});
