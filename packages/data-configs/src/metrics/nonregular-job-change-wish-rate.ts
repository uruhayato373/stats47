import type { MetricConfig } from '../types';

export const nonregularJobChangeWishRate: MetricConfig = {
  key: 'nonregular-job-change-wish-rate',
  title: '非正規雇用者の転職希望割合',
  subtitle: '現在の仕事を辞めて他の仕事を希望',
  description:
    '非正規の職員・従業員総数に占める、現在の仕事を辞めて別の仕事へ移ることを希望する人の割合。',
  note: '2022年10月1日就業構造基本調査。居住地別の15歳以上、男女計、非正規の職員・従業員が対象。会社などの役員を含まない。継続・追加・転職・休止の希望は別区分で、継続希望は現在の仕事を続けながら他の仕事も希望する追加就業希望者を含まない。希望意識であって、その後の転職実績や雇用継続の保証ではない。標本調査の推計値で、総数と希望4区分の差は不詳と丸めを含む残差として保持する。 割合は転職希望者÷非正規の職員・従業員総数×100。分母には希望不詳を含む。',
  unit: '％',
  category: 'laborwage',
  source: {
    kind: 'estat',
    statsDataId: '0004008518',
    cdTab: '001-2022',
    cdCat01: '0',
    cdCat02: '00',
    cdCat04: '222',
    displayName: '就業構造基本調査',
    url: 'https://www.e-stat.go.jp/dbview?sid=0004008518',
    axisRatio: {
      axis: 'cat03',
      numeratorCodes: ['3'],
      denominatorCodes: ['0'],
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2022,
    to: 2022,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  isActive: true,
};
