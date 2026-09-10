import type { MetricConfig } from '../types';

export const birthsThirdChildPlus: MetricConfig = {
  key: 'births-third-child-plus',
  title: '第3子以降の出生数',
  subtitle: '2024年・子の住所地別・確定数',
  description: '第3子以降の出生数を子の住所地の都道府県別に比較する。',
  note: '2024年1〜12月に日本で発生した日本人の出生の確定数。男女計、地域は子の住所であり出産施設の所在地ではない。日本における外国人の出生や、外国で発生した日本人の出生はこの系列に含めない。全国は住所が外国の18人を含むため47県合計と異なる。母の年齢不詳12人を原典記録に保持し、年齢別5区分には含めない。出生順位は同じ母親がこれまでに生んだ出生子を数えた順序であり、第1子、第2子、第3子以降は重複しない。出生数の内訳であり年齢別出生率や母親の人数ではない。',
  unit: '人',
  category: 'population',
  source: {
    kind: 'estat',
    statsDataId: '0003411918',
    cdTab: '10040',
    cdCat01: '00100',
    displayName: '人口動態統計',
    url: 'https://www.e-stat.go.jp/dbview?sid=0003411918',
    axisSum: {
      axis: 'cat02',
      codes: [
        '00140',
        '00150',
        '00170',
        '00180',
        '00190',
        '00200',
        '00210',
        '00220',
      ],
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
