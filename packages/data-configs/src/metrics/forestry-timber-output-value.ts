import type { MetricConfig } from '../types';

export const forestryTimberOutputValue: MetricConfig = {
  key: 'forestry-timber-output-value',
  title: '木材生産産出額',
  description: '木材生産産出額を都道府県別に比較する。',
  note: '2024年1〜12月の林業産出額・確報（消費税込み）。県別表は全国表と対象が異なり、パルプ工場へ直接入荷するパルプ用素材・輸出丸太・燃料用チップ素材、まき、木ろう・生うるしを除き、他県へ販売したしいたけ原木を含む。47県合計を全国産出額と呼ばない。生産額であり付加価値・所得ではない。原表1,000万円を同じ数量尺度の千万円と表記。四捨五入のため県合計と原表合計はずれる。',
  unit: '千万円',
  category: 'agriculture',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '農林水産省「令和6年林業産出額」',
    url: 'https://www.e-stat.go.jp/dbview?sid=0004049367',
    config: {
      source: {
        name: '農林水産省「令和6年林業産出額」',
        url: 'https://www.e-stat.go.jp/dbview?sid=0004049367',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/dbview?sid=0004049367',
        table: '都道府県別統計表 第2表',
        valueColumn: 'cat01=1001〜1047; cat02=1003',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        sourceSha256:
          'e1f0059659650e460ee090c614e7139f95ffb880404fbfb814b530dfe8a5c1a4',
        extraction:
          'SHA固定原表から対象・単位・47県を検証して抽出。年齢・産婦人科系のみ同一原表の排他的区分を合算。',
        verification:
          '重複・欠測・行列・対象年、全県と公式合計、年齢と診療科の総数一致を検査。県別産出額は別対象の全国表へ比較しない。',
        restore:
          'node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-forestry-medical-core.mjs --write-local',
        definitionUrl:
          'https://www.maff.go.jp/j/tokei/kouhyou/ringyou_sansyutu/gaiyou/index.html',
        releaseStatus: 'final',
        apiParameters: {
          statsDataId: '0004049367',
          cdCat02: '1001,1003,1012,1022,1024',
          limit: '10000',
        },
        geographyDimension: 'cat01',
        aggregateCode: '1048',
        aggregateLabel: '県別表合計（全国表とは対象範囲が異なる）',
        sourceUnit: '1,000万円',
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
