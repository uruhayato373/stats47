import { describe, expect, it } from 'vitest';

import sample from '../../../fixtures/compare-carousel-sample.json';
import { CompareCarouselDataSchema, COMPARE_CAROUSEL_SLIDES } from '../types';

describe('CompareCarouselDataSchema', () => {
  it('build-ig-compare-props.ts の実出力 (fixture) を検証できる', () => {
    const data = CompareCarouselDataSchema.parse(sample);
    expect(data.items.length).toBeGreaterThanOrEqual(5);
    expect(data.items.length).toBeLessThanOrEqual(7);
    expect(data.areaAName).toBe('東京都');
    expect(data.areaBName).toBe('大阪府');
  });

  it('対決が5件未満だと fail-closed で拒否する (done_when: 47県そろわない等の入力不備を props 生成側で止める契約)', () => {
    const invalid = { ...sample, items: sample.items.slice(0, 4) };
    expect(() => CompareCarouselDataSchema.parse(invalid)).toThrow();
  });

  it('対決が7件を超えると拒否する', () => {
    const eight = [...sample.items, ...sample.items].slice(0, 8);
    const invalid = { ...sample, items: eight };
    expect(() => CompareCarouselDataSchema.parse(invalid)).toThrow();
  });

  it('year フィールドが欠けた項目があると拒否する (必須フィールドの型契約)', () => {
    const invalid = {
      ...sample,
      items: sample.items.map((item, i) => {
        if (i !== 0) return item;
        const { year: _year, ...rest } = item;
        return rest;
      }),
    };
    expect(() => CompareCarouselDataSchema.parse(invalid)).toThrow();
  });

  it('COMPARE_CAROUSEL_SLIDES は4枚 (表紙→全項目対決→勝敗まとめ→締め)', () => {
    expect(COMPARE_CAROUSEL_SLIDES).toEqual(['cover', 'duel', 'summary', 'outro']);
  });
});
