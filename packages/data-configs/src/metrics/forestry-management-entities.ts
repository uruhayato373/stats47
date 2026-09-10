import type { MetricConfig } from '../types';

export const forestryManagementEntities: MetricConfig = {
  key: 'forestry-management-entities',
  title: '林業経営体数',
  description: '林業経営体数を都道府県別に比較する。',
  note: '2025年2月1日現在の林業経営体調査・確報。原表の都道府県別経営体集計で、作業場所や労働者の居住県別ではない。保有山林3ha以上で森林経営計画又は過去5年間の継続施業等を満たす者、又は育林・素材生産の受託等（素材生産は過去1年間200m³以上）が対象。すべての森林所有者ではない。',
  unit: '経営体',
  category: 'agriculture',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '農林水産省「2025年農林業センサス」',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483801',
    config: {
      source: {
        name: '農林水産省「2025年農林業センサス」',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483801',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483801',
        table: 'Ⅲ1',
        valueColumn: 'Excel column 4; rows31..77',
        dataYear: '2025年2月1日調査',
        accessedAt: '2026-09-10',
        sourceSha256:
          'ab06a99a88d5b0ac95b6ab568233ef04654654aa8ccf5a17b7b7afc0cd080a61',
        extraction:
          'SHA固定原表から対象・単位・47県を検証して抽出。年齢・産婦人科系のみ同一原表の排他的区分を合算。',
        verification:
          '重複・欠測・行列・対象年、全県と公式合計、年齢と診療科の総数一致を検査。県別産出額は別対象の全国表へ比較しない。',
        restore:
          'node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-forestry-medical-core.mjs --write-local',
        definitionUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040483732&fileKind=2',
        releaseStatus: 'final',
        sheet: 'Ⅲ1',
        prefectureRows: [31, 77],
        nationalRow: 10,
        column: 4,
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
    decimalPlaces: 0,
  },
  isActive: true,
};
