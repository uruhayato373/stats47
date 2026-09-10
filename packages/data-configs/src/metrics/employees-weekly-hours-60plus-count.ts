import type { MetricConfig } from '../types';

export const employeesWeeklyHours60plusCount: MetricConfig = {
  key: 'employees-weekly-hours-60plus-count',
  title: '週60時間以上就業する雇用者数',
  subtitle: '役員を除く・年間200日以上就業',
  description:
    '年間200日以上就業する役員を除く雇用者のうち、主な仕事の週間就業時間が60時間以上の人数。',
  note: '2022年10月1日就業構造基本調査。居住地別、15歳以上、男女計、役員を除く雇用者のうち年間就業日数200日以上が対象。年間200〜249日・250〜299日・300日以上を別区分として合計し、各区分の週60〜64・65〜69・70〜74・75時間以上を分子とする。分母は年間200日以上の雇用者総数で、週間就業時間不詳を含む。200日未満の規則的就業者・自営業主・役員は含めない。主な仕事のふだんの週間就業時間で、副業込みの総労働時間や時間外労働時間ではない。公表値の丸めと時間不詳の残差を補完しない。',
  unit: '人',
  category: 'laborwage',
  source: {
    kind: 'estat',
    statsDataId: '0004008493',
    cdTab: '001-2022',
    cdCat01: '0',
    cdCat03: '0',
    cdCat04: '22',
    displayName: '就業構造基本調査',
    url: 'https://www.e-stat.go.jp/dbview?sid=0004008493',
    axisSum: {
      axis: 'cat02',
      codes: [
        '211',
        '212',
        '213',
        '214',
        '311',
        '312',
        '313',
        '314',
        '411',
        '412',
        '413',
        '414',
      ],
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
    decimalPlaces: 0,
  },
  isActive: true,
};
