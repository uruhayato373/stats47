import type { MetricConfig } from '../types';

export const prefecturalAssemblyFemaleShare: MetricConfig = {
  key: 'prefectural-assembly-female-share',
  title: '都道府県議会議員に占める女性の割合',
  description: '都道府県議会の議員現員数に占める女性議員の公表割合。',
  note: '2024年12月31日現在の総務省資料を用いた公表値。分母は定数ではなく議員現員数。市区議会・町村議会の議員や政令市の再掲分は含めない。2025年度報告書に掲載されているが、観測年は2024年。県職員管理職の女性割合とは時点・対象が異なる。',
  unit: '%',
  category: 'administrativefinancial',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
    url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/21-1.pdf',
    config: {
      source: {
        name: '地方公共団体における男女共同参画社会の形成又は女性に関する施策の推進状況',
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/21-1.pdf',
      },
      provenance: {
        url: 'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/pdf/rep/21-1.pdf',
        sourceSha256:
          'cae9de08cf01567f7abbc094f6fb3fe9bab035889ed0f306f6895d3d3cc89076',
        publicationIndexUrl:
          'https://www.gender.go.jp/research/kenkyu/suishinjokyo/2025/report.html',
        publicationIndexSha256:
          '233e4c5c2ae276f39c94e2b6b6e8d8a623f7df4c4fb8f1c9fba9f8b220461ae7',
        published: '2026-05',
        sourceUnit: '%',
        table: '参考1 地方議会における女性議員の状況 都道府県議会',
        pdfPage: 1,
        valueColumn:
          '数値0起算列0=分母、1=女性人数、2=女性比率。47県と最初の計のみ。',
        asOf: '2024-12-31',
        denominator: '都道府県議会議員の現員数（定数ではない）。',
        geography: '都道府県の機関。指定都市及び市区町村を除外。',
        formula: '女性人数 / 同じ表の対象総数 * 100 の公表小数1桁値を保持',
        verification:
          '47県の6計数列sumと県計が全一致。3比率を各県・県計で人数から検算（丸め0.05pt以内）。県議会現員2614人、女性382人、公表14.6%。',
        dataYear: '2024年12月31日現在',
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
    from: 2024,
    to: 2024,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  isActive: true,
};
