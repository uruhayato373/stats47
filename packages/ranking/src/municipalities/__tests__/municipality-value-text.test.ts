import { describe, expect, it } from 'vitest';

import { formatMunicipalityValueText } from '../municipality-value-text';

describe('市区町村の文で値を書く', () => {
  it('10 万未満は万に寄せず桁区切りで書く (札幌市の出生数が「1万人」になっていた)', () => {
    expect(formatMunicipalityValueText(10352, '人')).toBe('10,352人');
    expect(formatMunicipalityValueText(947, '人')).toBe('947人');
  });

  it('10 万以上と、倍率付きの単位 (百万円) は共通の整形で万・億・兆に寄せる', () => {
    expect(formatMunicipalityValueText(3_750_000, '人')).toBe('375万人');
    expect(formatMunicipalityValueText(20_527_151, '百万円')).toBe('20.5兆円');
  });

  it('無次元の単位は付けない (「1.48指数」と読めない書き方をしない)', () => {
    expect(formatMunicipalityValueText(1.48, '指数')).toBe('1.48');
  });

  it('率は今までどおり (％)', () => {
    expect(formatMunicipalityValueText(31.2, '％')).toContain('31.2');
  });
});
