import type { MetricConfig } from '../types';

export const consumerConsultationAcceptedCases: MetricConfig = {
  key: 'consumer-consultation-accepted-cases',
  title: '消費生活相談受付件数',
  description:
    '地方公共団体の窓口が年度中に受け付けた消費生活相談の件数を都道府県別に集計した数。',
  note: '2025年度調査で把握した2024年度中の受付件数。都道府県・政令市・市区町村・広域連合・一部事務組合を含む県別の公表合計を使用する。「うちあっせん件数」は内数であり加算しない。相談者の実人数や認定された消費者被害の件数、犯罪認知件数とは異なる。窓口の県別集計であり、相談者の居住県別とはしない。',
  unit: '件',
  category: 'safetyenvironment',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '地方消費者行政の現況調査',
    url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/status_investigation/2025/assets/local_cooperation_cms203_250225_01.pdf',
    config: {
      source: {
        name: '地方消費者行政の現況調査',
        url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/status_investigation/2025/assets/local_cooperation_cms203_250225_01.pdf',
      },
      provenance: {
        url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/status_investigation/2025/assets/local_cooperation_cms203_250225_01.pdf',
        sourceSha256:
          'fb6e4d5b5252eec3481687c6e3afccc03436ab103cec4f0a3324bb4548a33bda',
        publicationIndexUrl:
          'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/status_investigation/2025',
        table:
          '令和7年度 地方消費者行政の現況調査 6-1(4) 消費生活相談の受付件数（続き）',
        valueColumn:
          'PDF95ページ・冊子89ページ、令和6年度の相談受付件数（数値10列中0起算列6）',
        surveyAsOf: '2025-04-01',
        published: '2025-12',
        sourceUnit: '件',
        denominator: null,
        population:
          '都道府県・政令市・市区町村・広域連合・一部事務組合の相談受付',
        geography: '窓口を都道府県別に集計した公表合計',
        dataYear: '2024年度（2025年度調査）',
        periodStart: '2024-04-01',
        periodEnd: '2025-03-31',
        accessedAt: '2026-09-10',
        extraction:
          '原典SHA・表・対象年・列・県名を固定し、欠測記号を0に変換せず厳格抽出する。',
        verification:
          '47県・数値10列合計は全国と全列一致。年度内あっせん内数<=受付、前年比差分は各県と全国で一致。令和6年度全国受付1025965、あっせん103453。受付は自治体種別249674+183609+592682とも一致。',
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
