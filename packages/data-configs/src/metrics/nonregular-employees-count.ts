import type { MetricConfig } from '../types';

export const nonregularEmployeesCount: MetricConfig = {
  key: 'nonregular-employees-count',
  title: '非正規の職員・従業員数',
  subtitle: '15歳以上・役員を除く',
  description: '非正規の職員・従業員の推計人数を居住都道府県別に比較する。',
  note: '2022年10月1日就業構造基本調査。居住地別の15歳以上、男女計、非正規の職員・従業員が対象。会社などの役員を含まない。継続・追加・転職・休止の希望は別区分で、継続希望は現在の仕事を続けながら他の仕事も希望する追加就業希望者を含まない。希望意識であって、その後の転職実績や雇用継続の保証ではない。標本調査の推計値で、総数と希望4区分の差は不詳と丸めを含む残差として保持する。',
  unit: '人',
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
    cdCat03: '0',
  },
  entities: ['prefecture'],
  years: {
    from: 2022,
    to: 2022,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
