import type { MetricConfig } from '../types';

export const interprefectureNetMigrationAge25to34: MetricConfig = {
  entities: ['prefecture'],
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
  key: 'interprefecture-net-migration-age25to34',
  title: '25〜34歳の県間転入超過数',
  description:
    '2025年中の25〜34歳の他都道府県からの転入者数から、他都道府県への転出者数を引いた人数。',
  note: '移動者（外国人を含む）、男女計。県内移動と海外から/への移動を含まない。負数は転出超過。転居時の年齢による暦年件数であり、就職・進学の動機や個人の追跡調査ではない。',
  unit: '人',
  category: 'population',
  years: {
    from: 2025,
    to: 2025,
  },
  source: {
    kind: 'estat',
    statsDataId: '0003419944',
    cdTab: '04',
    cdCat02: '0',
    cdCat03: '60000',
    axisSum: {
      axis: 'cat01',
      codes: [
        '026',
        '027',
        '028',
        '029',
        '030',
        '031',
        '032',
        '033',
        '034',
        '035',
      ],
    },
    displayName: '総務省「住民基本台帳人口移動報告」2025年 年報第9表',
    url: 'https://www.e-stat.go.jp/dbview?sid=0003419944',
  },
};
