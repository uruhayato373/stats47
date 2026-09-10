import type { MetricConfig } from '../types';

export const povertySupportNewConsultationCases: MetricConfig = {
  key: 'poverty-support-new-consultation-cases',
  title: '生活困窮者自立支援の新規相談受付件数',
  description:
    '生活困窮者自立支援制度の自立相談支援機関で年度中に新たに受け付けた相談件数。',
  note: '2024年4月〜2025年3月の新規受付。管内市区町村を含む都道府県枠に、同じ県の指定都市・中核市の別掲分を一度ずつ加算する。継続相談の延べ回数や困窮者・生活保護受給者の人数ではない。実施機関の管轄を県に集約し、相談者の居住県別人数とはしない。人口10万人当たりの月平均値は使用しない。',
  unit: '件',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '生活困窮者自立支援制度支援状況調査',
    url: 'https://www.mhlw.go.jp/content/001681642.pdf',
    config: {
      source: {
        name: '生活困窮者自立支援制度支援状況調査',
        url: 'https://www.mhlw.go.jp/content/001681642.pdf',
      },
      provenance: {
        url: 'https://www.mhlw.go.jp/content/001681642.pdf',
        sourceSha256:
          'fff417c55e1149d158e12720a2bdadcb229b0cd9b9becae7c26fa6c04a8e105e',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000092189.html',
        table:
          '令和6年度 生活困窮者自立支援制度における支援状況 自治体別集計表（4月〜3月累計）',
        valueColumn:
          'PDF1〜3ページ 実施主体/種別/対象地区人口に続く新規相談受付件数',
        sourceUnit: '件',
        denominator: null,
        population: '制度の自立相談支援機関への年度新規受付',
        geography: '管内市区町村を含む県枠47+指定都市20+中核市62を県別に集約',
        definitionSources: [
          {
            filename: 'poverty-national-2024.pdf',
            url: 'https://www.mhlw.go.jp/content/001681649.pdf',
            sha256:
              '01a64c98f407807d5703b04acdb9937f826683e37b77f61c614ea223c1076072',
            bytes: 54212,
          },
        ],
        dataYear: '2024年度',
        periodStart: '2024-04-01',
        periodEnd: '2025-03-31',
        accessedAt: '2026-09-10',
        extraction:
          '原典SHA・表・対象年・列・県名を固定し、欠測記号を0に変換せず厳格抽出する。',
        verification:
          '129実施主体を重複なく47県に集約。実施主体種別172592+76167+54069=302828件。別の全国原表の合計及び12か月の新規受付件数合計と一致。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-welfare-consultation.mjs --write-local',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: 'fiscal',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
