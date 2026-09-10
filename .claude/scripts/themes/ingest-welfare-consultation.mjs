#!/usr/bin/env node
/** Pinned official welfare consultation sources. R2 writes require --write-local. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
export const SOURCES = [
  {
    filename: 'poverty-2024.pdf',
    url: 'https://www.mhlw.go.jp/content/001681642.pdf',
    sha256: 'fff417c55e1149d158e12720a2bdadcb229b0cd9b9becae7c26fa6c04a8e105e',
    bytes: 621752,
  },
  {
    filename: 'poverty-national-2024.pdf',
    url: 'https://www.mhlw.go.jp/content/001681649.pdf',
    sha256: '01a64c98f407807d5703b04acdb9937f826683e37b77f61c614ea223c1076072',
    bytes: 54212,
  },
  {
    filename: 'consumer-2025.pdf',
    url: 'https://www.caa.go.jp/policies/policy/local_cooperation/local_consumer_administration/status_investigation/2025/assets/local_cooperation_cms203_250225_01.pdf',
    sha256: 'fb6e4d5b5252eec3481687c6e3afccc03436ab103cec4f0a3324bb4548a33bda',
    bytes: 3622629,
  },
  {
    filename: 'k6-2025.csv',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040475286&fileKind=1',
    sha256: '167e6199f30e0095c1e23f838675321e4c42175a71971c0639b4f721a9e23464',
    bytes: 90963,
  },
  {
    filename: 'mental-consultation-2024.csv',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040423490&fileKind=1',
    sha256: '0e8e6985697b2c6ce7508bf91d186b1f3231ef8e502c584412fd82ac60ac6151',
    bytes: 17284,
  },
  {
    filename: 'life-terms-2025.pdf',
    url: 'https://www.mhlw.go.jp/toukei/list/dl/20-21-yougo_r7.pdf',
    sha256: '0489966497df4e0a4fc57b6456eea43142f95a5d81e804107d826e70cc842781',
    bytes: 813872,
  },
  {
    filename: 'life-method-2025.pdf',
    url: 'https://www.mhlw.go.jp/toukei/list/dl/20-21-gosa_r7.pdf',
    sha256: 'e2adee7f7c96de8926e00f87592d84fd0f9d0cd90d88d9d62df8497190bb8f5d',
    bytes: 687328,
  },
  {
    filename: 'life-overview-2025.pdf',
    url: 'https://www.mhlw.go.jp/toukei/saikin/hw/k-tyosa/k-tyosa25/dl/01.pdf',
    sha256: 'a66fa95d23c5f68502e2878c41a7fa796a26f1eec0af5810bc5dc7013d93c127',
    bytes: 129898,
  },
];
export const FIELDS = [
  {
    key: 'k6-score10plus-rate-12plus',
    title: 'K6が10点以上の人の割合（12歳以上）',
    unit: '%',
    family: 'k6',
    column: 0,
    year: 2025,
    yearFormat: 'calendar',
    yearName: '2025年6月5日調査',
    decimalPlaces: 1,
    category: 'socialsecurity',
  },
  {
    key: 'k6-score10plus-estimated-persons-12plus',
    title: 'K6が10点以上の推計人数（12歳以上）',
    unit: '千人',
    family: 'k6',
    column: 1,
    year: 2025,
    yearFormat: 'calendar',
    yearName: '2025年6月5日調査',
    decimalPlaces: 0,
    category: 'socialsecurity',
  },
  {
    key: 'k6-known-score-estimated-persons-12plus',
    title: 'K6の点数が判明している推計人数（12歳以上）',
    unit: '千人',
    family: 'k6',
    column: 2,
    year: 2025,
    yearFormat: 'calendar',
    yearName: '2025年6月5日調査',
    decimalPlaces: 0,
    category: 'socialsecurity',
  },
  {
    key: 'municipal-mental-health-consultation-extended-persons',
    title: '市区町村の精神保健福祉相談延人員',
    unit: '人',
    family: 'mental',
    column: 1,
    year: 2024,
    yearFormat: 'fiscal',
    yearName: '2024年度',
    decimalPlaces: 0,
    category: 'socialsecurity',
  },
  {
    key: 'poverty-support-new-consultation-cases',
    title: '生活困窮者自立支援の新規相談受付件数',
    unit: '件',
    family: 'poverty',
    column: 0,
    year: 2024,
    yearFormat: 'fiscal',
    yearName: '2024年度',
    decimalPlaces: 0,
    category: 'socialsecurity',
  },
  {
    key: 'consumer-consultation-accepted-cases',
    title: '消費生活相談受付件数',
    unit: '件',
    family: 'consumer',
    column: 6,
    year: 2024,
    yearFormat: 'fiscal',
    yearName: '2024年度（2025年度調査）',
    decimalPlaces: 0,
    category: 'safetyenvironment',
  },
];
export const EXPECTED_SOURCES = {
  'k6-score10plus-rate-12plus': {
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
  'k6-score10plus-estimated-persons-12plus': {
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
        formula: '10点以上',
      },
    },
  },
  'k6-known-score-estimated-persons-12plus': {
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
        formula: '0〜4点 + 5〜9点 + 10点以上',
      },
    },
  },
  'municipal-mental-health-consultation-extended-persons': {
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
  'poverty-support-new-consultation-cases': {
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
  'consumer-consultation-accepted-cases': {
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
};
export const PROVIDER_ROSTER = [
  ['北海道', '北海道', '都道府県'],
  ['北海道', '札幌市', '指定都市'],
  ['北海道', '函館市', '中核市'],
  ['北海道', '旭川市', '中核市'],
  ['青森県', '青森県', '都道府県'],
  ['青森県', '青森市', '中核市'],
  ['青森県', '八戸市', '中核市'],
  ['岩手県', '岩手県', '都道府県'],
  ['岩手県', '盛岡市', '中核市'],
  ['宮城県', '宮城県', '都道府県'],
  ['宮城県', '仙台市', '指定都市'],
  ['秋田県', '秋田県', '都道府県'],
  ['秋田県', '秋田市', '中核市'],
  ['山形県', '山形県', '都道府県'],
  ['山形県', '山形市', '中核市'],
  ['福島県', '福島県', '都道府県'],
  ['福島県', '福島市', '中核市'],
  ['福島県', '郡山市', '中核市'],
  ['福島県', 'いわき市', '中核市'],
  ['茨城県', '茨城県', '都道府県'],
  ['茨城県', '水戸市', '中核市'],
  ['栃木県', '栃木県', '都道府県'],
  ['栃木県', '宇都宮市', '中核市'],
  ['群馬県', '群馬県', '都道府県'],
  ['群馬県', '前橋市', '中核市'],
  ['群馬県', '高崎市', '中核市'],
  ['埼玉県', '埼玉県', '都道府県'],
  ['埼玉県', 'さいたま市', '指定都市'],
  ['埼玉県', '川越市', '中核市'],
  ['埼玉県', '川口市', '中核市'],
  ['埼玉県', '越谷市', '中核市'],
  ['千葉県', '千葉県', '都道府県'],
  ['千葉県', '千葉市', '指定都市'],
  ['千葉県', '船橋市', '中核市'],
  ['千葉県', '柏市', '中核市'],
  ['東京都', '東京都', '都道府県'],
  ['東京都', '八王子市', '中核市'],
  ['神奈川県', '神奈川県', '都道府県'],
  ['神奈川県', '横浜市', '指定都市'],
  ['神奈川県', '川崎市', '指定都市'],
  ['神奈川県', '相模原市', '指定都市'],
  ['神奈川県', '横須賀市', '中核市'],
  ['新潟県', '新潟県', '都道府県'],
  ['新潟県', '新潟市', '指定都市'],
  ['富山県', '富山県', '都道府県'],
  ['富山県', '富山市', '中核市'],
  ['石川県', '石川県', '都道府県'],
  ['石川県', '金沢市', '中核市'],
  ['福井県', '福井県', '都道府県'],
  ['福井県', '福井市', '中核市'],
  ['山梨県', '山梨県', '都道府県'],
  ['山梨県', '甲府市', '中核市'],
  ['長野県', '長野県', '都道府県'],
  ['長野県', '長野市', '中核市'],
  ['長野県', '松本市', '中核市'],
  ['岐阜県', '岐阜県', '都道府県'],
  ['岐阜県', '岐阜市', '中核市'],
  ['静岡県', '静岡県', '都道府県'],
  ['静岡県', '静岡市', '指定都市'],
  ['静岡県', '浜松市', '指定都市'],
  ['愛知県', '愛知県', '都道府県'],
  ['愛知県', '名古屋市', '指定都市'],
  ['愛知県', '豊橋市', '中核市'],
  ['愛知県', '岡崎市', '中核市'],
  ['愛知県', '一宮市', '中核市'],
  ['愛知県', '豊田市', '中核市'],
  ['三重県', '三重県', '都道府県'],
  ['滋賀県', '滋賀県', '都道府県'],
  ['滋賀県', '大津市', '中核市'],
  ['京都府', '京都府', '都道府県'],
  ['京都府', '京都市', '指定都市'],
  ['大阪府', '大阪府', '都道府県'],
  ['大阪府', '大阪市', '指定都市'],
  ['大阪府', '堺市', '指定都市'],
  ['大阪府', '豊中市', '中核市'],
  ['大阪府', '吹田市', '中核市'],
  ['大阪府', '高槻市', '中核市'],
  ['大阪府', '枚方市', '中核市'],
  ['大阪府', '八尾市', '中核市'],
  ['大阪府', '寝屋川市', '中核市'],
  ['大阪府', '東大阪市', '中核市'],
  ['兵庫県', '兵庫県', '都道府県'],
  ['兵庫県', '神戸市', '指定都市'],
  ['兵庫県', '姫路市', '中核市'],
  ['兵庫県', '尼崎市', '中核市'],
  ['兵庫県', '明石市', '中核市'],
  ['兵庫県', '西宮市', '中核市'],
  ['奈良県', '奈良県', '都道府県'],
  ['奈良県', '奈良市', '中核市'],
  ['和歌山県', '和歌山県', '都道府県'],
  ['和歌山県', '和歌山市', '中核市'],
  ['鳥取県', '鳥取県', '都道府県'],
  ['鳥取県', '鳥取市', '中核市'],
  ['島根県', '島根県', '都道府県'],
  ['島根県', '松江市', '中核市'],
  ['岡山県', '岡山県', '都道府県'],
  ['岡山県', '岡山市', '指定都市'],
  ['岡山県', '倉敷市', '中核市'],
  ['広島県', '広島県', '都道府県'],
  ['広島県', '広島市', '指定都市'],
  ['広島県', '呉市', '中核市'],
  ['広島県', '福山市', '中核市'],
  ['山口県', '山口県', '都道府県'],
  ['山口県', '下関市', '中核市'],
  ['徳島県', '徳島県', '都道府県'],
  ['香川県', '香川県', '都道府県'],
  ['香川県', '高松市', '中核市'],
  ['愛媛県', '愛媛県', '都道府県'],
  ['愛媛県', '松山市', '中核市'],
  ['高知県', '高知県', '都道府県'],
  ['高知県', '高知市', '中核市'],
  ['福岡県', '福岡県', '都道府県'],
  ['福岡県', '北九州市', '指定都市'],
  ['福岡県', '福岡市', '指定都市'],
  ['福岡県', '久留米市', '中核市'],
  ['佐賀県', '佐賀県', '都道府県'],
  ['長崎県', '長崎県', '都道府県'],
  ['長崎県', '長崎市', '中核市'],
  ['長崎県', '佐世保市', '中核市'],
  ['熊本県', '熊本県', '都道府県'],
  ['熊本県', '熊本市', '指定都市'],
  ['大分県', '大分県', '都道府県'],
  ['大分県', '大分市', '中核市'],
  ['宮崎県', '宮崎県', '都道府県'],
  ['宮崎県', '宮崎市', '中核市'],
  ['鹿児島県', '鹿児島県', '都道府県'],
  ['鹿児島県', '鹿児島市', '中核市'],
  ['沖縄県', '沖縄県', '都道府県'],
  ['沖縄県', '那覇市', '中核市'],
];
const require = createRequire(import.meta.url);
const { parse: csvParse } = require('csv-parse/sync');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const clean = (s) => String(s).replace(/\s+/g, '');
export const sha = (b) => createHash('sha256').update(b).digest('hex');
export function assertHash(b, expected) {
  assert.equal(sha(b), expected, 'official source SHA');
}
export function count(s) {
  assert.ok(typeof s === 'string' || typeof s === 'number', 'missing count');
  const t = String(s).replace(/,/g, '');
  assert.match(t, /^\d+$/, 'numeric count, never impute');
  const n = Number(t);
  assert.ok(Number.isSafeInteger(n) && n >= 0);
  return n;
}
const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const byName = (name) => {
  const p = prefectures.find((p) => p.prefName === name);
  assert.ok(p, 'known prefecture ' + name);
  return { areaCode: p.prefCode, areaName: p.prefName };
};
export function requirePrefectures(rows) {
  assert.equal(rows.length, 47, '47 prefectures');
  assert.deepEqual(
    rows.map((r) => r.areaCode).sort(),
    prefectures.map((p) => p.prefCode).sort(),
    'unique geography'
  );
  rows.forEach((r) =>
    assert.deepEqual(byName(r.areaName), {
      areaCode: r.areaCode,
      areaName: r.areaName,
    })
  );
}
export function decodeCsv(b) {
  return csvParse(new TextDecoder('shift_jis', { fatal: true }).decode(b), {
    relax_column_count: true,
    skip_empty_lines: true,
    bom: true,
  });
}
export function pdfText(b, page) {
  return execFileSync(
    'pdftotext',
    [
      ...(page ? ['-f', String(page), '-l', String(page)] : []),
      '-layout',
      '-',
      '-',
    ],
    { input: b, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }
  );
}
export function parseK6(csv, terms, method, overview) {
  assert.equal(csv[0][0], '2025（令和７）年');
  assert.equal(csv[0][1], '国民生活基礎調査');
  assert.equal(csv[0][3], '千人');
  for (const t of [
    '第126表',
    '世帯人員（12歳以上）',
    'こころの状態（点数階級）',
  ])
    assert.ok(clean(csv[1][1]).includes(t), 'K6 table ' + t);
  assert.ok(csv[2][0].includes('入院者は含まない'));
  assert.deepEqual(csv[3].slice(2).map(clean), [
    '総数',
    '０～４点',
    '５～９点',
    '１０点以上',
    '不詳',
  ]);
  for (const t of ['Ｋ６', '６つの質問'])
    assert.ok(clean(terms).includes(t), 'K6 definition ' + t);
  for (const t of ['比推定', '2025（令和７）年６月１日現在', '全国推計値'])
    assert.ok(clean(method).includes(t), 'K6 estimation ' + t);
  for (const t of [
    '2025(令和７)年６月５日',
    '社会福祉施設の入所者',
    '世帯に不在の者',
  ])
    assert.ok(clean(overview).includes(t), 'K6 survey scope ' + t);
  const all = [];
  for (let i = 4; i < csv.length; i++) {
    const name = clean(csv[i][0]);
    if (name !== '全国' && !prefectures.some((p) => p.prefName === name))
      continue;
    assert.equal(csv[i].filter((v) => v !== '').length, 1, 'area header');
    const r = csv[i + 1];
    assert.equal(clean(r[0]), '総数');
    assert.equal(r[1], '');
    assert.equal(r.length, 7);
    const raw = r.slice(2).map(count),
      known = sum(raw.slice(1, 4));
    assert.ok(known > 0, 'known K6 denominator');
    assert.ok(
      Math.abs(raw[0] - sum(raw.slice(1))) <= 1,
      'K6 rounded partition'
    );
    all.push({
      ...(name === '全国'
        ? { areaCode: '00000', areaName: '全国' }
        : byName(name)),
      raw,
      values: [(raw[3] / known) * 100, raw[3], known],
    });
  }
  const rows = all.filter((r) => r.areaCode !== '00000'),
    nationals = all.filter((r) => r.areaCode === '00000');
  requirePrefectures(rows);
  assert.equal(nationals.length, 1);
  const national = nationals[0];
  assert.deepEqual(
    national.raw,
    [96755, 68779, 15686, 9489, 2802],
    'K6 national original'
  );
  const differences = national.raw.map(
    (v, i) => sum(rows.map((r) => r.raw[i])) - v
  );
  assert.deepEqual(
    differences,
    [-1, -3, -3, 1, -1],
    'K6 published rounding difference'
  );
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      asOf: '2025-06-05',
      unit: '千人',
      nationalRoundingDifference: differences,
      partitionRoundingDifference: all.map((r) => ({
        areaCode: r.areaCode,
        difference: r.raw[0] - sum(r.raw.slice(1)),
      })),
      estimateNotRespondentSample: true,
      unknownExcluded: true,
      ageAdjusted: false,
    },
  };
}
export function parseMental(csv) {
  assert.equal(csv[0][0], '令和６年度');
  assert.ok(csv[0][1].includes('市区町村編'));
  assert.ok(
    clean(csv[1][1]).startsWith('第４６表市区町村が実施した精神保健福祉相談')
  );
  for (const col of [3, 4]) {
    assert.equal(csv[2][col], '(再掲)相談');
    assert.equal(csv[6][col], '人');
  }
  assert.equal(csv[3][3], '実人員');
  assert.equal(csv[3][4], '延人員');
  const rows = [],
    national = [];
  for (const r of csv.slice(7)) {
    if (!/^\d+$/.test(r[0])) continue;
    const code = Number(r[0]);
    if (code !== 0 && (code % 1000 !== 0 || code > 47000)) continue;
    const area =
      code === 0 ? { areaCode: '00000', areaName: '全国' } : byName(r[1]);
    assert.equal(Number(area.areaCode), code);
    assert.equal(r[1], area.areaName);
    const values = r.slice(3, 5).map(count);
    assert.ok(values[0] <= values[1], 'real people <= extended people');
    (code === 0 ? national : rows).push({ ...area, values });
  }
  requirePrefectures(rows);
  assert.equal(national.length, 1);
  assert.deepEqual(national[0].values, [307745, 776857]);
  for (let i = 0; i < 2; i++)
    assert.equal(sum(rows.map((r) => r.values[i])), national[0].values[i]);
  return {
    rows,
    national: national[0],
    checks: {
      prefectures: 47,
      missing: 0,
      nationalColumns: 2,
      excludedReprintedCities: true,
      unit: '人',
      countKind: 'extended-persons',
      includesTelephone: false,
      includesEmail: false,
      includesHomeVisit: false,
      municipalityOnly: true,
    },
  };
}
export function parsePoverty(text, nationalText) {
  const flat = clean(text);
  for (const t of [
    '令和６年度',
    '４月～３月累計',
    '新規',
    '相談',
    '受付',
    '件数',
    '管内の市区町村の分を含んでいる',
  ])
    assert.ok(flat.includes(t), 'poverty header ' + t);
  assert.ok(clean(nationalText).includes('令和6年度'));
  assert.ok(clean(nationalText).includes('新規相談受付件数'));
  const providers = [];
  let pref = null;
  for (const line of text.split('\n')) {
    const m = line.match(
      /(\S+)\s+(都道府県|指定都市|中核市)\s+([\d,]+)\s+([\d,]+)\s+/
    );
    if (!m) continue;
    const [, providerName, kind, population, value] = m;
    if (kind === '都道府県') {
      byName(providerName);
      pref = providerName;
    }
    assert.ok(pref, 'city requires county group');
    providers.push({
      prefName: pref,
      providerName,
      kind,
      population: count(population),
      value: count(value),
    });
  }
  assert.deepEqual(
    providers.map((p) => [p.prefName, p.providerName, p.kind]),
    PROVIDER_ROSTER,
    '129 source provider identities and county ownership'
  );
  const rows = prefectures.map((p) => ({
    ...byName(p.prefName),
    values: [
      sum(
        providers.filter((r) => r.prefName === p.prefName).map((r) => r.value)
      ),
    ],
  }));
  requirePrefectures(rows);
  const totals = ['都道府県', '指定都市', '中核市'].map((kind) =>
    sum(providers.filter((p) => p.kind === kind).map((p) => p.value))
  );
  assert.deepEqual(
    totals,
    [172592, 76167, 54069],
    'provider type source totals'
  );
  const nlines = nationalText.split('\n');
  const numericLines = nationalText
    .split('各月における支援状況')[0]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^172,592\s|^指定都市\s|^中核市\s|^合計\s/.test(l));
  assert.deepEqual(
    numericLines.map((l) => count(l.match(/[\d,]+/)[0])),
    [172592, 76167, 54069, 302828],
    'independent national table'
  );
  const months = nlines
    .map((l) => l.match(/^\s*([０-９]+)月分\s+([\d,]+)\s/))
    .filter(Boolean)
    .map((m) => ({
      month: Number(m[1].normalize('NFKC')),
      value: count(m[2]),
    }));
  assert.deepEqual(
    months.map((m) => m.month),
    [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
  );
  assert.equal(sum(months.map((m) => m.value)), 302828, '12 monthly total');
  assert.equal(sum(rows.map((r) => r.values[0])), 302828);
  return {
    rows,
    national: { areaCode: '00000', areaName: '全国', values: [302828] },
    providers,
    checks: {
      prefectures: 47,
      missing: 0,
      providerCounts: [47, 20, 62],
      providerTotals: totals,
      monthlyValues: months,
      countySum: 302828,
      periodStart: '2024-04-01',
      periodEnd: '2025-03-31',
      countKind: 'new-cases',
      noReprintedMunicipalDoubleCount: true,
    },
  };
}
export function parseConsumer(page, whole) {
  const flat = clean(page);
  for (const t of [
    '単位（件）',
    '令和３年度',
    '令和４年度',
    '令和５年度',
    '令和６年度',
    'あっせん',
    '都道府県名',
  ])
    assert.ok(flat.includes(t), 'consumer header ' + t);
  for (const t of [
    '令和７年12月',
    '令和７年４月１日',
    '令和６年度中の状況',
    '広域連合及び一部事務組合',
  ])
    assert.ok(clean(whole).includes(t), 'consumer scope ' + t);
  const rows = [],
    nationals = [];
  for (const line of page.split('\n')) {
    const parts = line.replaceAll('▲', '-').trim().split(/\s+/);
    const name = parts.pop();
    if (name !== '合計' && !prefectures.some((p) => p.prefName === name))
      continue;
    const tokens = parts.join(' ').replace(/-\s+/g, '-').split(' ');
    assert.equal(tokens.length, 10, 'consumer ten columns');
    const values = tokens.map((t, i) =>
      i < 8
        ? count(t)
        : (assert.match(t, /^-?[\d,]+$/), Number(t.replaceAll(',', '')))
    );
    for (let i = 0; i < 8; i += 2)
      assert.ok(values[i + 1] <= values[i], 'mediation is subset');
    assert.equal(
      values[6] - values[4],
      values[8],
      'current minus previous accepted'
    );
    assert.equal(
      values[7] - values[5],
      values[9],
      'current minus previous mediation'
    );
    (name === '合計' ? nationals : rows).push({
      ...(name === '合計'
        ? { areaCode: '00000', areaName: '全国' }
        : byName(name)),
      values,
    });
  }
  requirePrefectures(rows);
  assert.equal(nationals.length, 1);
  const national = nationals[0];
  assert.deepEqual(
    national.values,
    [
      950581, 85386, 1007784, 101352, 1005836, 99225, 1025965, 103453, 20129,
      4228,
    ]
  );
  for (let i = 0; i < 10; i++)
    assert.equal(
      sum(rows.map((r) => r.values[i])),
      national.values[i],
      'consumer national column ' + i
    );
  const marker = whole.indexOf('全自治体計      1,094,041');
  assert.ok(marker >= 0, 'provider national table');
  const block = whole.slice(marker).split('※')[0];
  const providerRows = block
    .split('\n')
    .filter((l) => /^(全自治体計|都道府県|政令市|市区町村等)\s/.test(l))
    .map((l) => ({
      name: l.trim().split(/\s+/)[0],
      values: l.trim().split(/\s+/).slice(1).map(count),
    }));
  assert.equal(providerRows.length, 4);
  providerRows.forEach((r) => assert.equal(r.values.length, 8));
  assert.deepEqual(
    providerRows.map((r) => r.values[6]),
    [1025965, 249674, 183609, 592682]
  );
  assert.equal(
    sum(providerRows.slice(1).map((r) => r.values[6])),
    national.values[6]
  );
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      nationalColumns: 10,
      mediationSubsetChecks: 192,
      yearDifferenceChecks: 96,
      providerRows,
      periodStart: '2024-04-01',
      periodEnd: '2025-03-31',
      surveyAsOf: '2025-04-01',
      pdfPage: 95,
      printedPage: 89,
      countKind: 'accepted-cases',
      notUniqueVictims: true,
    },
  };
}
export function validateConfig(c, f) {
  assert.equal(c?.key, f.key);
  assert.equal(c.isActive, true);
  assert.equal(c.unit, f.unit);
  assert.equal(c.category, f.category);
  assert.deepEqual(c.entities, ['prefecture']);
  assert.deepEqual(c.years, { from: f.year, to: f.year });
  assert.equal(c.yearFormat, f.yearFormat);
  assert.deepEqual(c.display, {
    conversionFactor: 1,
    decimalPlaces: f.decimalPlaces,
  });
  assert.deepEqual(
    c.source,
    EXPECTED_SOURCES[f.key],
    'source definition including denominator'
  );
}
export function makePayloads(
  datasets,
  configs,
  generatedAt = new Date().toISOString()
) {
  return FIELDS.map((f) => {
    validateConfig(configs[f.key], f);
    const data = datasets[f.family];
    requirePrefectures(data.rows);
    const rows = prefectures.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
      yearCode: String(f.year),
      yearName: f.yearName,
      unit: f.unit,
      value: data.rows.find((r) => r.areaCode === p.prefCode).values[f.column],
    }));
    const payload = parseStatsValuesPayload({
      metricKey: f.key,
      entityKind: 'prefecture',
      rows,
      meta: {
        generatedAt,
        rowCount: 47,
        areaCount: 47,
        yearRange: [String(f.year), String(f.year)],
        recipe: buildRecipe(configs[f.key]),
      },
    });
    const content = JSON.stringify(payload);
    return {
      key: `app/stats/${f.key}/values.json`,
      metricKey: f.key,
      rowCount: 47,
      sha256: sha(content),
      content,
    };
  });
}
async function sourceBytes(s, dir) {
  const path = resolve(dir, s.filename);
  let b;
  try {
    b = await readFile(path);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const r = await fetch(s.url, { signal: AbortSignal.timeout(45000) });
    assert.ok(r.ok, 'official HTTP ' + r.status);
    b = Buffer.from(await r.arrayBuffer());
    assertHash(b, s.sha256);
    await mkdir(dir, { recursive: true });
    await writeFile(path, b);
  }
  assertHash(b, s.sha256);
  assert.equal(b.length, s.bytes, 'source byte length');
  return b;
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(root, '.local/verification/themes/welfare-consultation-source'),
      },
      'config-file': { type: 'string' },
      out: {
        type: 'string',
        default:
          resolve(root, '.local/verification/themes/welfare-consultation-source.json'),
      },
    },
  });
  const configs = o['config-file']
    ? Object.fromEntries(
        JSON.parse(await readFile(o['config-file'], 'utf8')).map((c) => [
          c.key,
          c,
        ])
      )
    : require('../../../packages/data-configs/src/registry.ts')
        .METRICS_REGISTRY;
  FIELDS.forEach((f) => validateConfig(configs[f.key], f));
  const b = new Map();
  for (const s of SOURCES)
    b.set(s.filename, await sourceBytes(s, o['source-dir']));
  const datasets = {
    k6: parseK6(
      decodeCsv(b.get('k6-2025.csv')),
      pdfText(b.get('life-terms-2025.pdf')),
      pdfText(b.get('life-method-2025.pdf')),
      pdfText(b.get('life-overview-2025.pdf'))
    ),
    mental: parseMental(decodeCsv(b.get('mental-consultation-2024.csv'))),
    poverty: parsePoverty(
      pdfText(b.get('poverty-2024.pdf')),
      pdfText(b.get('poverty-national-2024.pdf'))
    ),
    consumer: parseConsumer(
      pdfText(b.get('consumer-2025.pdf'), 95),
      pdfText(b.get('consumer-2025.pdf'))
    ),
  };
  const files = makePayloads(datasets, configs);
  if (o['write-local'])
    for (const f of files) {
      const p = resolve(root, '.local/r2', f.key);
      await mkdir(dirname(p), { recursive: true });
      await writeFile(p, f.content);
    }
  const proof = {
    status: 'PASS',
    writeLocal: o['write-local'],
    seriesCount: 6,
    canonicalRows: 282,
    sources: SOURCES,
    datasets,
    files: files.map(({ content, ...f }) => f),
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(proof, null, 2));
  console.log(
    JSON.stringify({
      status: proof.status,
      seriesCount: 6,
      canonicalRows: 282,
      writeLocal: proof.writeLocal,
      out: o.out,
    })
  );
  return proof;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e.stack);
    process.exitCode = 1;
  });
