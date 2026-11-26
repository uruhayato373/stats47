import { describe, expect, it } from 'vitest';

import {
  authoredNormalizationType,
  denominatorLabel,
  isAuthoredRatioOption,
  seriesOptionLabel,
  toRatioNormalizationOption,
} from '../value-display';

describe('denominatorLabel', () => {
  it('分母の型から文言を 1 通りに作る (手書きは「千人」「1000人」「あたり」「当たり」に割れていた)', () => {
    expect(denominatorLabel({ kind: 'population', per: 100000 })).toBe('人口10万人当たり');
    expect(denominatorLabel({ kind: 'population', per: 1000000 })).toBe('人口100万人当たり');
    expect(denominatorLabel({ kind: 'population', per: 1000 })).toBe('人口千人当たり');
    expect(denominatorLabel({ kind: 'population', per: 100 })).toBe('人口100人当たり');
    expect(denominatorLabel({ kind: 'population', per: 1 })).toBe('人口1人当たり');
    expect(denominatorLabel({ kind: 'area', per: 100 })).toBe('面積100km²当たり');
    expect(denominatorLabel({ kind: 'household', per: 1 })).toBe('1世帯当たり');
    expect(denominatorLabel({ kind: 'household', per: 1000 })).toBe('千世帯当たり');
    expect(denominatorLabel({ kind: 'person', per: 1 })).toBe('1人当たり');
  });

  it('4 種類で書けない分母は other と数え方 (counter) で書く (公表資料の項目名と同じ文言になる)', () => {
    expect(denominatorLabel({ kind: 'other', per: 1, counter: '住宅' })).toBe('1住宅当たり');
    expect(denominatorLabel({ kind: 'other', per: 1000, scope: '道路実延長', counter: 'km' })).toBe('道路実延長千km当たり');
    expect(denominatorLabel({ kind: 'other', per: 100, scope: '建物火災', counter: '件' })).toBe('建物火災100件当たり');
    expect(denominatorLabel({ kind: 'other', per: 1000, counter: '施設' })).toBe('千施設当たり');
    expect(denominatorLabel({ kind: 'other', per: 1000, scope: '出生数' })).toBe('出生数千当たり');
    expect(denominatorLabel({ kind: 'other', per: 100000, scope: '出産数' })).toBe('出産数10万当たり');
    expect(denominatorLabel({ kind: 'other', per: 1, scope: '農家', counter: '戸' })).toBe('農家1戸当たり');
    expect(denominatorLabel({ kind: 'area', per: 1, scope: '耕地', counter: 'ヘクタール' })).toBe('耕地面積1ヘクタール当たり');
  });

  it('対象を限る分母は scope を前に付ける', () => {
    expect(denominatorLabel({ kind: 'population', per: 100000, scope: '0〜5歳' })).toBe('0〜5歳人口10万人当たり');
    expect(denominatorLabel({ kind: 'area', per: 1, scope: '可住地' })).toBe('可住地面積1km²当たり');
    expect(denominatorLabel({ kind: 'person', per: 1, scope: '従業者' })).toBe('従業者1人当たり');
  });
});

describe('定義の選択肢を配信の形にする', () => {
  const authored = { denominator: { kind: 'population', per: 100000 }, unit: '人/10万人', decimalPlaces: 1 } as const;

  it('識別子・係数・名前を分母から作る (定義には書かない)', () => {
    expect(toRatioNormalizationOption(authored)).toEqual({
      type: 'per_population',
      label: '人口10万人当たり',
      unit: '人/10万人',
      scaleFactor: 100000,
      decimalPlaces: 1,
    });
    expect(toRatioNormalizationOption({ denominator: { kind: 'area', per: 100 }, unit: '人/100km²', decimalPlaces: 2 }).type).toBe('per_area');
  });

  it('series の名前は選んだ先の指標の分母から作り、分母の型が無いときだけ定義の label を使う', () => {
    expect(seriesOptionLabel({ type: 'series', metric: 'x', label: '人口当たり' }, { kind: 'other', per: 1, counter: '学級' })).toBe('1学級当たり');
    expect(seriesOptionLabel({ type: 'series', metric: 'x', label: '従業員当たり' }, undefined)).toBe('従業員当たり');
    expect(seriesOptionLabel({ type: 'series', metric: 'x', label: '従業員当たり' }, 'population')).toBe('従業員当たり');
    expect(seriesOptionLabel({ type: 'series', metric: 'x' }, undefined)).toBeNull();
  });

  it('series は割り算をしない選択肢として見分ける', () => {
    const series = { type: 'series', metric: 'x-per-employee', label: '従業者1人当たり' } as const;
    expect(isAuthoredRatioOption(authored)).toBe(true);
    expect(isAuthoredRatioOption(series)).toBe(false);
    expect(authoredNormalizationType(authored)).toBe('per_population');
    expect(authoredNormalizationType(series)).toBe('series');
  });
});
