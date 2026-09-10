import type { MetricConfig } from '../types';

export const k6Score10plusRate12plus: MetricConfig = {
  key: 'k6-score10plus-rate-12plus',
  title: 'K6が10点以上の人の割合（12歳以上）',
  description:
    'こころの状態（K6）の点数が判明している12歳以上の推計世帯人員に占める10点以上の割合。',
  note: '12歳以上の世帯人員（入院者を除く）。不詳を除いた0〜4点・5〜9点・10点以上の公表推計人数の合計を分母とする。人数は千人単位に丸めた推計値で、実際の回答者数ではない。割合は丸め済みの級別推計人数から算出し、年齢調整は行っていない。K6は心理的苦痛の尺度で、精神疾患の診断率ではない。',
  unit: '%',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '国民生活基礎調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040475286&fileKind=1',
    config: {
      source: {
        name: '国民生活基礎調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040475286&fileKind=1',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040475286&fileKind=1',
        sourceSha256:
          '167e6199f30e0095c1e23f838675321e4c42175a71971c0639b4f721a9e23464',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/toukei/saikin/hw/k-tyosa/k-tyosa25/index.html',
        table: '2025年 健康票 第126表（男女・年齢総数、47都道府県）',
        valueColumn:
          '各県ブロック直後の総数行、0起算列3・4・5の既知3区分と列5の10点以上',
        governmentStatisticsCode: '00450061',
        asOf: '2025-06-05',
        sourceUnit: '千人',
        denominator:
          '公表0〜4点+5〜9点+10点以上の推計人数（千人）。不詳は除く。実回答者数ではない。',
        ageAdjustment: 'none',
        population:
          '12歳以上の世帯人員。入院者及び調査対象から除かれる世帯不在者を除く。',
        geography: '調査世帯の都道府県',
        rounding:
          '公表各セルが千人単位に丸められている。県合計と全国、区分合計と総数の丸め差を保持。',
        definitionSources: [
          {
            filename: 'life-terms-2025.pdf',
            url: 'https://www.mhlw.go.jp/toukei/list/dl/20-21-yougo_r7.pdf',
            sha256:
              '0489966497df4e0a4fc57b6456eea43142f95a5d81e804107d826e70cc842781',
            bytes: 813872,
          },
          {
            filename: 'life-method-2025.pdf',
            url: 'https://www.mhlw.go.jp/toukei/list/dl/20-21-gosa_r7.pdf',
            sha256:
              'e2adee7f7c96de8926e00f87592d84fd0f9d0cd90d88d9d62df8497190bb8f5d',
            bytes: 687328,
          },
          {
            filename: 'life-overview-2025.pdf',
            url: 'https://www.mhlw.go.jp/toukei/saikin/hw/k-tyosa/k-tyosa25/dl/01.pdf',
            sha256:
              'a66fa95d23c5f68502e2878c41a7fa796a26f1eec0af5810bc5dc7013d93c127',
            bytes: 129898,
          },
        ],
        dataYear: '2025年6月5日調査',
        accessedAt: '2026-09-10',
        extraction:
          '原典SHA・表・対象年・列・県名を固定し、欠測記号を0に変換せず厳格抽出する。',
        verification:
          '47県、欠測0。全国公表5列96755/68779/15686/9489/2802千人。県合計との誤差-1/-3/-3/+1/-1千人。各行区分合計と総数の差は最大1千人。全国既知3区分93954千人、10点以上9489千人。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-welfare-consultation.mjs --write-local',
        formula: '10点以上 / (0〜4点 + 5〜9点 + 10点以上) * 100',
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
