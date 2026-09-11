import type { MetricConfig } from '../types';

export const medicalPhysiciansEmergencyMedicine: MetricConfig = {
  key: 'medical-physicians-emergency-medicine',
  title: '救急科の医師数',
  description: '救急科の医師数を都道府県別に比較する。',
  note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。主たる診療科が救急科。集中治療科や他科医師の救急対応を含む総人数ではない。複数回答の診療科数・専門医資格保持者数とは異なる。3診療科だけでは医師総数の構成にならない。',
  unit: '人',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '厚生労働省「令和6年医師・歯科医師・薬剤師統計」',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383773&fileKind=1',
    config: {
      source: {
        name: '厚生労働省「令和6年医師・歯科医師・薬剤師統計」',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383773&fileKind=1',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383773&fileKind=1',
        table: '医師 第21表',
        valueColumn: 'CSV 1-based columns 43',
        dataYear: '2024年12月31日現在',
        accessedAt: '2026-09-10',
        sourceSha256:
          'f953ff26592d979063f63ee6fc7372da7b04132a82a1343e15607b61ca05707f',
        extraction:
          'SHA固定原表から対象・単位・47県を検証して抽出。年齢・産婦人科系のみ同一原表の排他的区分を合算。',
        verification:
          '重複・欠測・行列・対象年、全県と公式合計、年齢と診療科の総数一致を検査。県別産出額は別対象の全国表へ比較しない。',
        restore:
          'node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-forestry-medical-core.mjs --write-local',
        definitionUrl:
          'https://www.mhlw.go.jp/toukei/saikin/hw/ishi/24/dl/R06_1gaikyo.pdf',
        releaseStatus: 'final',
        encoding: 'shift_jis',
        prefectureRows: [8, 54],
        nationalRow: 7,
        columnsZeroBased: [42],
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
    decimalPlaces: 0,
  },
  isActive: true,
};
