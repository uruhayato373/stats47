import { describe, expect, it } from 'vitest';

import sample from '../../../fixtures/map-carousel-sample.json';
import { MapCarouselDataSchema, MAP_CAROUSEL_SLIDES } from '../types';

describe('MapCarouselDataSchema', () => {
  it('build-ig-map-props.ts の実出力 (fixture) を検証できる', () => {
    const data = MapCarouselDataSchema.parse(sample);
    expect(data.tiles.length).toBe(47);
    expect(data.top5.length).toBe(5);
    expect(data.bottom5.length).toBe(5);
    expect(data.label).toBe('焼酎への支出');
  });

  it('タイルが47件そろわないと拒否する (done_when: 47県そろわない入力は props 生成を失敗させる契約)', () => {
    const invalid = { ...sample, tiles: sample.tiles.slice(0, 46) };
    expect(() => MapCarouselDataSchema.parse(invalid)).toThrow();
  });

  it('上位5・下位5がそれぞれ5件でないと拒否する', () => {
    const invalidTop = { ...sample, top5: sample.top5.slice(0, 4) };
    expect(() => MapCarouselDataSchema.parse(invalidTop)).toThrow();
    const invalidBottom = { ...sample, bottom5: sample.bottom5.slice(0, 4) };
    expect(() => MapCarouselDataSchema.parse(invalidBottom)).toThrow();
  });

  it('year フィールドが欠けると拒否する (必須フィールドの型契約)', () => {
    const { year: _year, ...invalid } = sample;
    expect(() => MapCarouselDataSchema.parse(invalid)).toThrow();
  });

  it('MAP_CAROUSEL_SLIDES は4枚 (表紙→タイル地図→上位/下位5→締め)', () => {
    expect(MAP_CAROUSEL_SLIDES).toEqual(['cover', 'choropleth', 'topbottom', 'outro']);
  });
});
