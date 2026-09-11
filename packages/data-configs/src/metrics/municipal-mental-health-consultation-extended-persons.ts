import type { MetricConfig } from '../types';

export const municipalMentalHealthConsultationExtendedPersons: MetricConfig = {
  key: 'municipal-mental-health-consultation-extended-persons',
  title: '市区町村の精神保健福祉相談延人員',
  description:
    '市区町村が実施した精神保健福祉相談の延人員を都道府県別に集計した数。',
  note: '同じ人の複数回の相談を含む延人員。市区町村編第46表の「相談・延人員」を使用し、実人員、電話・電子メール相談、デイ・ケア、訪問支援は加算しない。都道府県・保健所側の相談を含む総数ではない。県内市区町村の実施集計であり、相談者の居住県別や精神疾患の人数を表すものではない。K6の調査年・対象集団とは異なる。',
  unit: '人',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '地域保健・健康増進事業報告',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040423490&fileKind=1',
    config: {
      source: {
        name: '地域保健・健康増進事業報告',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040423490&fileKind=1',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040423490&fileKind=1',
        sourceSha256:
          '0e8e6985697b2c6ce7508bf91d186b1f3231ef8e502c584412fd82ac60ac6151',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/toukei/saikin/hw/c-hoken/24/index.html',
        table: '令和6年度 市区町村編 第46表',
        valueColumn:
          '0起算列4（相談・延人員）。全国code0、都道府県code1000〜47000。再掲市区は除外。',
        governmentStatisticsCode: '00450025',
        sourceUnit: '人',
        denominator: null,
        population: '市区町村が実施した精神保健福祉相談の被支援延人員',
        geography: '実施市区町村の都道府県集計',
        dataYear: '2024年度',
        periodStart: '2024-04-01',
        periodEnd: '2025-03-31',
        accessedAt: '2026-09-10',
        extraction:
          '原典SHA・表・対象年・列・県名を固定し、欠測記号を0に変換せず厳格抽出する。',
        verification:
          '47県の相談実人員合計307745、延人員合計776857は各全国値と一致。全48行で実人員<=延人員。',
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
