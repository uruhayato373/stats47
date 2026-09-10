import type { MetricConfig } from '../types';

export const medicalPhysiciansAge4059: MetricConfig = {
  key: 'medical-physicians-age-40-59',
  title: '40〜59歳の医療施設従事医師数',
  description: '40〜59歳の医療施設従事医師数を都道府県別に比較する。',
  note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。原表5歳階級を重複なく合算。40歳未満・40〜59歳・60歳以上の3区分で同表医師総数に一致する。人数であり人口当たり医師密度ではない。',
  unit: '人',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '厚生労働省「令和6年医師・歯科医師・薬剤師統計」',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383757&fileKind=1',
    config: {
      source: {
        name: '厚生労働省「令和6年医師・歯科医師・薬剤師統計」',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383757&fileKind=1',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383757&fileKind=1',
        table: '医師 第5表',
        valueColumn: 'CSV 1-based columns 10,11,12,13',
        dataYear: '2024年12月31日現在',
        accessedAt: '2026-09-10',
        sourceSha256:
          'd3c842115fd850dedcf131eeff57a7a5fd5a2183f5b5c199c7055eb7f97920c0',
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
        prefectureRows: [5, 51],
        nationalRow: 4,
        columnsZeroBased: [9, 10, 11, 12],
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
