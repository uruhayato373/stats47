import type { MetricConfig } from '../types';

export const prefecturalManagerFemaleShare: MetricConfig = {
  key: 'prefectural-manager-female-share',
  title: '都道府県の管理職に占める女性の割合',
  description:
    '都道府県職員の部局長・次長相当職と課長相当職の総数に占める女性の公表割合。',
  note: '調査時点は原則2025年4月1日。一部自治体は事情により異なる。全体欄の管理職総数を分母に用い、一般行政職だけに限定しない。教職員を除く定員内職員が対象で、国家公務員の身分での出向者等は含まない。政令市・市区町村の職員、民間企業の管理職は含めない。県議会女性割合とは時点・対象が異なる。',
  unit: '%',
  category: 'administrativefinancial',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
    url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/05-1.pdf',
    config: {
      source: {
        name: '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/05-1.pdf',
      },
      provenance: {
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/05-1.pdf',
        sourceSha256:
          '0220a8468e5fd3f5fcf35633a55cbd11d3e1fedc499fb3598cf71a02b00ffc6b',
        publicationIndexUrl:
          'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/report.html',
        publicationIndexSha256:
          '233e4c5c2ae276f39c94e2b6b6e8d8a623f7df4c4fb8f1c9fba9f8b220461ae7',
        published: '2026-05',
        sourceUnit: '%',
        table: '表5-1 全体 管理職総数（部局長・次長・課長相当職）',
        pdfPage: 1,
        valueColumn:
          '数値0起算列0=分母、1=女性人数、2=女性比率。47県と最初の計のみ。',
        asOf: '2025-04-01 (原則・自治体により異なる場合あり)',
        denominator:
          '都道府県職員の部局長・次長相当職+課長相当職の総数。教職員を除く。',
        geography: '都道府県の機関。指定都市及び市区町村を除外。',
        formula: '女性人数 / 同じ表の対象総数 * 100 の公表小数1桁値を保持',
        verification:
          '47県の12計数列sumと全国県計が全一致。6比率を各県・県計で人数から検算（丸め0.05pt以内）。対象37711人、女性5740人、公表15.2%。',
        dataYear: '原則2025年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          '公式原表SHAを固定し、対象列・期間・県・分母を確認して抽出。欠測を0に変換しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-energy-gender.mjs --write-local',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2025,
    to: 2025,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  isActive: true,
};
