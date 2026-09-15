import { describe, expect, it } from 'vitest';

import { selectDistinctProfileItems } from '../select-distinct-profile-items';

describe('selectDistinctProfileItems', () => {
  it('同名指標を先頭の1件へまとめ、異なる指標を上限まで返す', () => {
    const items = [
      {
        rankingKey: 'height-men',
        indicator: '平均身長',
        rank: 1,
        value: 170,
        unit: 'cm',
        year: '2024',
      },
      {
        rankingKey: 'height-women',
        indicator: '平均身長',
        rank: 2,
        value: 158,
        unit: 'cm',
        year: '2024',
      },
      {
        rankingKey: 'income',
        indicator: '県民所得',
        rank: 3,
        value: 300,
        unit: '万円',
        year: '2023',
      },
      {
        rankingKey: 'forest',
        indicator: '森林率',
        rank: 4,
        value: 60,
        unit: '%',
        year: '2023',
      },
    ];

    expect(
      selectDistinctProfileItems(items, 2).map((item) => item.rankingKey)
    ).toEqual(['height-men', 'income']);
  });
});
