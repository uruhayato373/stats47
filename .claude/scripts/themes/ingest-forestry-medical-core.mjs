#!/usr/bin/env node
/** Official forestry/medical sources -> canonical payloads. Remote writes are unsupported. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs'),
  { parse: parseCsv } = require('csv-parse/sync');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const {
  parseUnit,
} = require('../../../packages/data-configs/src/unit/unit-semantics.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PREFS = prefectures.map((p) => p.prefCode),
  AREAS = ['00000', ...PREFS];
const names = Object.fromEntries(
  prefectures.map((p) => [p.prefCode, p.prefName])
);
const bare = (n) => (n === '北海道' ? n : n.slice(0, -1));
const clean = (v) => String(v ?? '').replace(/\s/g, '');
export const sha = (v) => createHash('sha256').update(v).digest('hex');
export const FILE_SOURCES = [
  {
    filename: 'forestry-operators.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483801',
    sha256: 'ab06a99a88d5b0ac95b6ab568233ef04654654aa8ccf5a17b7b7afc0cd080a61',
    bytes: 18647,
  },
  {
    filename: 'forestry-employees.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483807',
    sha256: '0a2c8713b7a1077c06033c4fdbcb8d88ba0199ee63e94b1d776ff2afc2384a08',
    bytes: 22888,
  },
  {
    filename: 'forestry-internal-workers.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483808',
    sha256: '6b9e32348b4af0970a8d0965d3b664036a529996d9ac91af132eab02848412ba',
    bytes: 22674,
  },
  {
    filename: 'medical-age.csv',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383757&fileKind=1',
    sha256: 'd3c842115fd850dedcf131eeff57a7a5fd5a2183f5b5c199c7055eb7f97920c0',
    bytes: 32514,
  },
  {
    filename: 'medical-specialty.csv',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040383773&fileKind=1',
    sha256: 'f953ff26592d979063f63ee6fc7372da7b04132a82a1343e15607b61ca05707f',
    bytes: 68406,
  },
  {
    filename: 'forestry-terms.pdf',
    url: 'https://www.maff.go.jp/j/tokei/kouhyou/noucen/gaiyou/attach/pdf/index-28.pdf',
    sha256: '543496985206cc16260c2fd7f8e2ff203884fc1c0fc0bbac6c96b26b7a575d9b',
    bytes: 522577,
  },
  {
    filename: 'forestry-questionnaire.pdf',
    url: 'https://www.maff.go.jp/j/tokei/kouhyou/noucen/gaiyou/attach/pdf/index-24.pdf',
    sha256: '3463b1b617f4a877b1b882ad31a3ed269950e3cdd9877864df0c7c4c2db66229',
    bytes: 1139193,
  },
  {
    filename: 'medical-overview.pdf',
    url: 'https://www.mhlw.go.jp/toukei/saikin/hw/ishi/24/dl/R06_1gaikyo.pdf',
    sha256: '1e844f321edf21e721530273150fa51567dd004c088a371fd99d0f6683d7a0ba',
    bytes: 1638066,
  },
  {
    filename: 'forestry-users.pdf',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040483732&fileKind=2',
    sha256: '437cd37ad6c5e3229550209341d1ff164527cc0b6192f343618b083403263345',
    bytes: 496153,
  },
  {
    filename: 'forestrydefinitions.html',
    url: 'https://www.maff.go.jp/j/tokei/kouhyou/noucen/gaiyou/',
    sha256: '8a43064c155752b44df93419ff4b33a317c5c07c59687979941ae1bcbb119c0d',
    bytes: 68179,
  },
  {
    filename: 'outputdefinitions.html',
    url: 'https://www.maff.go.jp/j/tokei/kouhyou/ringyou_sansyutu/gaiyou/index.html',
    sha256: '9a8385f9833a904023f6b4224841c56e3fcd0dcf0e44b3e2be0b31e8a06a0981',
    bytes: 50453,
  },
];
export const API_SOURCE = {
  filename: 'forestry-output-data.json',
  id: '0004049367',
  url: 'https://www.e-stat.go.jp/dbview?sid=0004049367',
  parameters: {
    statsDataId: '0004049367',
    cdCat02: '1001,1003,1012,1022,1024',
    limit: '10000',
  },
  title: '統計表 都道府県別統計表',
  statisticsName: '林業産出額 確報 令和６年林業産出額',
  rawSha256: '35113bb659b8921d16d88adb74f83736677106af0f5cd7ddc0942775f113d24a',
  statisticalDataSha256:
    'e1f0059659650e460ee090c614e7139f95ffb880404fbfb814b530dfe8a5c1a4',
};
export const FIELDS = [
  {
    key: 'forestry-management-entities',
    title: '林業経営体数',
    family: 'census',
    file: 'forestry-operators.xlsx',
    sheet: 'Ⅲ1',
    column: 4,
    unit: '経営体',
    year: 2025,
    note: '2025年2月1日現在の林業経営体調査・確報。原表の都道府県別経営体集計で、作業場所や労働者の居住県別ではない。保有山林3ha以上で森林経営計画又は過去5年間の継続施業等を満たす者、又は育林・素材生産の受託等（素材生産は過去1年間200m³以上）が対象。すべての森林所有者ではない。',
  },
  {
    key: 'forestry-hired-workers',
    title: '林業経営体の雇用者数',
    family: 'census',
    file: 'forestry-employees.xlsx',
    sheet: 'Ⅲ7',
    column: 5,
    unit: '人',
    year: 2025,
    note: '2025年2月1日現在の林業経営体調査・確報。原表の都道府県別経営体集計で、作業場所や労働者の居住県別ではない。保有山林3ha以上で森林経営計画又は過去5年間の継続施業等を満たす者、又は育林・素材生産の受託等（素材生産は過去1年間200m³以上）が対象。すべての森林所有者ではない。過去1年間の常雇いと臨時雇い（手間替え・ゆい・無償の手伝いを含む）の経営体ごとの実人数合計。複数経営体間で重複を除いた個人数ではなく、年間延べ人日でもない。',
  },
  {
    key: 'forestry-internal-workers',
    title: '林業経営体の内部労働者数',
    family: 'census',
    file: 'forestry-internal-workers.xlsx',
    sheet: 'Ⅲ8',
    column: 5,
    unit: '人',
    year: 2025,
    note: '2025年2月1日現在の林業経営体調査・確報。原表の都道府県別経営体集計で、作業場所や労働者の居住県別ではない。保有山林3ha以上で森林経営計画又は過去5年間の継続施業等を満たす者、又は育林・素材生産の受託等（素材生産は過去1年間200m³以上）が対象。すべての森林所有者ではない。過去1年間に従事した世帯員・役員・山林共同保有者の経営体ごとの実人数（経営主を含む）。個人経営では15歳以上の世帯員。雇用労働とは区別し、役員会出席だけの者・1日も従事しない者を含まない。2025年は個人票から男女・従事日数階級別人数へ把握方法を変更。',
  },
  {
    key: 'forestry-output-value',
    title: '林業産出額',
    family: 'output',
    code: '1001',
    unit: '千万円',
    year: 2024,
    note: '2024年1〜12月の林業産出額・確報（消費税込み）。県別表は全国表と対象が異なり、パルプ工場へ直接入荷するパルプ用素材・輸出丸太・燃料用チップ素材、まき、木ろう・生うるしを除き、他県へ販売したしいたけ原木を含む。47県合計を全国産出額と呼ばない。生産額であり付加価値・所得ではない。原表1,000万円を同じ数量尺度の千万円と表記。四捨五入のため県合計と原表合計はずれる。木材・栽培きのこは総額の内数で、薪炭・林野副産物を除いた2部門だけでは総額にならない。',
  },
  {
    key: 'forestry-timber-output-value',
    title: '木材生産産出額',
    family: 'output',
    code: '1003',
    unit: '千万円',
    year: 2024,
    note: '2024年1〜12月の林業産出額・確報（消費税込み）。県別表は全国表と対象が異なり、パルプ工場へ直接入荷するパルプ用素材・輸出丸太・燃料用チップ素材、まき、木ろう・生うるしを除き、他県へ販売したしいたけ原木を含む。47県合計を全国産出額と呼ばない。生産額であり付加価値・所得ではない。原表1,000万円を同じ数量尺度の千万円と表記。四捨五入のため県合計と原表合計はずれる。',
  },
  {
    key: 'forestry-mushroom-output-value',
    title: '栽培きのこ類産出額',
    family: 'output',
    code: '1012',
    unit: '千万円',
    year: 2024,
    note: '2024年1〜12月の林業産出額・確報（消費税込み）。県別表は全国表と対象が異なり、パルプ工場へ直接入荷するパルプ用素材・輸出丸太・燃料用チップ素材、まき、木ろう・生うるしを除き、他県へ販売したしいたけ原木を含む。47県合計を全国産出額と呼ばない。生産額であり付加価値・所得ではない。原表1,000万円を同じ数量尺度の千万円と表記。四捨五入のため県合計と原表合計はずれる。',
  },
  {
    key: 'medical-physicians-under-40',
    title: '40歳未満の医療施設従事医師数',
    family: 'medical-age',
    file: 'medical-age.csv',
    columns: [5, 6, 7, 8],
    unit: '人',
    year: 2024,
    note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。原表5歳階級を重複なく合算。40歳未満・40〜59歳・60歳以上の3区分で同表医師総数に一致する。人数であり人口当たり医師密度ではない。',
  },
  {
    key: 'medical-physicians-age-40-59',
    title: '40〜59歳の医療施設従事医師数',
    family: 'medical-age',
    file: 'medical-age.csv',
    columns: [9, 10, 11, 12],
    unit: '人',
    year: 2024,
    note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。原表5歳階級を重複なく合算。40歳未満・40〜59歳・60歳以上の3区分で同表医師総数に一致する。人数であり人口当たり医師密度ではない。',
  },
  {
    key: 'medical-physicians-age-60-plus',
    title: '60歳以上の医療施設従事医師数',
    family: 'medical-age',
    file: 'medical-age.csv',
    columns: [13, 14, 15, 16, 17, 18],
    unit: '人',
    year: 2024,
    note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。原表5歳階級を重複なく合算。40歳未満・40〜59歳・60歳以上の3区分で同表医師総数に一致する。人数であり人口当たり医師密度ではない。',
  },
  {
    key: 'medical-physicians-pediatrics',
    title: '小児科の医師数',
    family: 'medical-specialty',
    file: 'medical-specialty.csv',
    columns: [16],
    unit: '人',
    year: 2024,
    note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。主たる診療科が小児科。小児外科は別区分。複数回答の診療科数・専門医資格保持者数とは異なる。3診療科だけでは医師総数の構成にならない。',
  },
  {
    key: 'medical-physicians-obstetrics-gynecology',
    title: '産婦人科系の医師数',
    family: 'medical-specialty',
    file: 'medical-specialty.csv',
    columns: [34, 35, 36],
    unit: '人',
    year: 2024,
    note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。主たる診療科の産婦人科・産科・婦人科を重複なく合算。複数回答の診療科数・専門医資格保持者数とは異なる。3診療科だけでは医師総数の構成にならない。',
  },
  {
    key: 'medical-physicians-emergency-medicine',
    title: '救急科の医師数',
    family: 'medical-specialty',
    file: 'medical-specialty.csv',
    columns: [42],
    unit: '人',
    year: 2024,
    note: '2024年12月31日現在の医療施設従事医師（日本国内に住所を有して届け出た医師）の人数。主たる従業地の都道府県別で、居住地別ではない。病院・診療所に従事する医師を対象とし、常勤換算ではなく医育機関の臨床系大学院生も含む。主たる診療科が救急科。集中治療科や他科医師の救急対応を含む総人数ではない。複数回答の診療科数・専門医資格保持者数とは異なる。3診療科だけでは医師総数の構成にならない。',
  },
];
const EXPECTED_SOURCES = {
  'forestry-management-entities': {
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
  'forestry-hired-workers': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '農林水産省「2025年農林業センサス」',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483807',
    config: {
      source: {
        name: '農林水産省「2025年農林業センサス」',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483807',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483807',
        table: 'Ⅲ7',
        valueColumn: 'Excel column 5; rows31..77',
        dataYear: '2025年2月1日調査',
        accessedAt: '2026-09-10',
        sourceSha256:
          '0a2c8713b7a1077c06033c4fdbcb8d88ba0199ee63e94b1d776ff2afc2384a08',
        extraction:
          'SHA固定原表から対象・単位・47県を検証して抽出。年齢・産婦人科系のみ同一原表の排他的区分を合算。',
        verification:
          '重複・欠測・行列・対象年、全県と公式合計、年齢と診療科の総数一致を検査。県別産出額は別対象の全国表へ比較しない。',
        restore:
          'node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-forestry-medical-core.mjs --write-local',
        definitionUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040483732&fileKind=2',
        releaseStatus: 'final',
        sheet: 'Ⅲ7',
        prefectureRows: [31, 77],
        nationalRow: 10,
        column: 5,
      },
    },
  },
  'forestry-internal-workers': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '農林水産省「2025年農林業センサス」',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483808',
    config: {
      source: {
        name: '農林水産省「2025年農林業センサス」',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483808',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?fileKind=0&statInfId=000040483808',
        table: 'Ⅲ8',
        valueColumn: 'Excel column 5; rows31..77',
        dataYear: '2025年2月1日調査',
        accessedAt: '2026-09-10',
        sourceSha256:
          '6b9e32348b4af0970a8d0965d3b664036a529996d9ac91af132eab02848412ba',
        extraction:
          'SHA固定原表から対象・単位・47県を検証して抽出。年齢・産婦人科系のみ同一原表の排他的区分を合算。',
        verification:
          '重複・欠測・行列・対象年、全県と公式合計、年齢と診療科の総数一致を検査。県別産出額は別対象の全国表へ比較しない。',
        restore:
          'node --env-file=apps/web/.env.development --import tsx .claude/scripts/themes/ingest-forestry-medical-core.mjs --write-local',
        definitionUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040483732&fileKind=2',
        releaseStatus: 'final',
        sheet: 'Ⅲ8',
        prefectureRows: [31, 77],
        nationalRow: 10,
        column: 5,
      },
    },
  },
  'forestry-output-value': {
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
        valueColumn: 'cat01=1001〜1047; cat02=1001',
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
  'forestry-timber-output-value': {
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
  'forestry-mushroom-output-value': {
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
        valueColumn: 'cat01=1001〜1047; cat02=1012',
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
  'medical-physicians-under-40': {
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
        valueColumn: 'CSV 1-based columns 6,7,8,9',
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
        columnsZeroBased: [5, 6, 7, 8],
      },
    },
  },
  'medical-physicians-age-40-59': {
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
  'medical-physicians-age-60-plus': {
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
        valueColumn: 'CSV 1-based columns 14,15,16,17,18,19',
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
        columnsZeroBased: [13, 14, 15, 16, 17, 18],
      },
    },
  },
  'medical-physicians-pediatrics': {
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
        valueColumn: 'CSV 1-based columns 17',
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
        columnsZeroBased: [16],
      },
    },
  },
  'medical-physicians-obstetrics-gynecology': {
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
        valueColumn: 'CSV 1-based columns 35,36,37',
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
        columnsZeroBased: [34, 35, 36],
      },
    },
  },
  'medical-physicians-emergency-medicine': {
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
};
export function assertHash(bytes, expected) {
  assert.equal(sha(bytes), expected, 'source SHA changed');
}
export function count(v) {
  if (v === '-' || v === '－') return 0;
  assert.ok(typeof v === 'number' || typeof v === 'string', 'missing count');
  assert.match(String(v), /^\d+$/, 'missing/suppressed count');
  const n = Number(v);
  assert.ok(Number.isSafeInteger(n) && n >= 0, 'invalid count');
  return n;
}
export function parseForest(books) {
  const out = {};
  for (const f of FIELDS.filter((f) => f.family === 'census')) {
    const w = books.get(f.file);
    assert.equal(w.worksheets.length, 1, 'forest sheet count');
    const s = w.worksheets[0];
    assert.equal(s.name, f.sheet, 'forest sheet');
    assert.equal(clean(s.getCell('D3').value), '令和７年', 'forest period');
    assert.equal(clean(s.getCell('A10').value), '全国', 'forest aggregate row');
    assert.match(
      clean(s.getCell('A30').value),
      /都道府県/,
      'forest prefecture header'
    );
    assert.equal(
      f.unit === '経営体'
        ? clean(s.getCell('G3').value)
        : s.getCell(9, f.column).value,
      f.unit === '経営体' ? '単位：経営体' : '人',
      'forest unit'
    );
    const values = new Map(),
      get = (a) => {
        assert.ok(values.has(a), 'forest missing area');
        return values.get(a);
      };
    let identities = 0;
    for (const [i, a] of AREAS.entries()) {
      const row = i === 0 ? 10 : 30 + i;
      if (i > 0) {
        assert.equal(
          clean(s.getCell(row, 1).value),
          bare(names[a]),
          'forest prefecture identity'
        );
        assert.equal(s.getCell(row, 3).value, 19 + i, 'forest sequence');
      }
      const cell = (c) => count(s.getCell(row, c).value);
      values.set(a, cell(f.column));
      if (f.key === 'forestry-management-entities') {
        assert.equal(
          clean(s.getCell('D5').value),
          '計',
          'operator column header'
        );
        assert.equal(cell(4), cell(5) + cell(6), 'forest operator partition');
        assert.ok(cell(7) <= cell(6), 'corporate subset');
      }
      if (f.key === 'forestry-hired-workers') {
        assert.equal(
          clean(s.getCell('E5').value),
          '人数',
          'hired column header'
        );
        assert.equal(
          cell(5),
          cell(7) + cell(9),
          'hired regular/temporary partition'
        );
        assert.ok(cell(10) <= cell(5), '150day hired subset');
      }
      if (f.key === 'forestry-internal-workers') {
        assert.equal(
          clean(s.getCell('E5').value),
          '人数',
          'internal column header'
        );
        assert.equal(
          cell(5),
          cell(8) + cell(11),
          'internal male/female partition'
        );
        assert.equal(
          cell(6),
          cell(9) + cell(12),
          '150day internal male/female partition'
        );
        assert.ok(cell(6) <= cell(5), '150day internal subset');
      }
      identities++;
    }
    const sum = PREFS.reduce((s, a) => s + get(a), 0);
    assert.equal(sum, get('00000'), 'forest national sum');
    out[f.key] = {
      get,
      checks: {
        prefectures: 47,
        missing: 0,
        duplicates: 0,
        national: sum,
        nationalDifference: 0,
        identities,
      },
    };
  }
  return out;
}
export function parseOutput(raw) {
  const r = raw.GET_STATS_DATA;
  assert.equal(Number(r.RESULT.STATUS), 0, 'API status');
  const d = r.STATISTICAL_DATA;
  assert.equal(d.TABLE_INF['@id'], API_SOURCE.id, 'output id');
  assert.equal(
    d.TABLE_INF.STATISTICS_NAME,
    API_SOURCE.statisticsName,
    'output final/year'
  );
  assert.equal(d.TABLE_INF.SURVEY_DATE, '202401-202412', 'output period');
  assert.equal(d.TABLE_INF.TITLE.$, API_SOURCE.title, 'output table');
  assert.ok(
    d.TABLE_INF.TITLE_SPEC.TABLE_EXPLANATION.includes('都道府県別産出額には') &&
      d.TABLE_INF.TITLE_SPEC.TABLE_EXPLANATION.includes('計上しない'),
    'output national scope caveat'
  );
  assert.equal(d.DATA_INF.VALUE.length, 240, 'output complete response');
  assert.equal(Number(d.RESULT_INF.TOTAL_NUMBER), 240, 'output not truncated');
  const cls = Object.fromEntries(
    d.CLASS_INF.CLASS_OBJ.map((c) => [
      c['@id'],
      new Map(
        (Array.isArray(c.CLASS) ? c.CLASS : [c.CLASS]).map((x) => [
          x['@code'],
          x,
        ])
      ),
    ])
  );
  for (let i = 0; i < 47; i++)
    assert.equal(
      cls.cat01.get(String(1001 + i))['@name'],
      bare(prefectures[i].prefName),
      'output prefecture metadata'
    );
  assert.equal(
    cls.cat01.get('1048')['@name'],
    '合計',
    'output aggregate is not national'
  );
  assert.equal(cls.cat02.get('1001')['@name'], '林業産出額_産出額');
  assert.equal(cls.cat02.get('1003')['@name'], '木材生産_産出額');
  assert.equal(cls.cat02.get('1012')['@name'], '栽培きのこ類生産_産出額');
  assert.equal(parseUnit('千万円').dimension, 'currency');
  assert.equal(
    parseUnit('千万円').scaleExponent,
    7,
    'canonical currency scale'
  );
  const vals = new Map(),
    suppressed = [];
  for (const v of d.DATA_INF.VALUE) {
    assert.ok(
      ['1001', '1003', '1012', '1022', '1024'].includes(v['@cat02']),
      'output selected code'
    );
    assert.ok(cls.cat01.has(v['@cat01']), 'output region');
    assert.equal(v['@unit'], '1,000万円', 'output raw unit');
    const key = v['@cat01'] + '|' + v['@cat02'];
    assert.ok(!vals.has(key), 'output duplicate');
    if (v.$ === 'x' && ['1022', '1024'].includes(v['@cat02'])) {
      vals.set(key, null);
      suppressed.push({
        region: v['@cat01'],
        field: v['@cat02'],
        reason: 'official suppression; not reconstructed',
      });
    } else vals.set(key, count(v.$));
  }
  assert.equal(vals.size, 240, 'output coordinate count');
  const get = (a, c) => {
    const r = a === '00000' ? '1048' : String(1001 + PREFS.indexOf(a));
    assert.ok(a === '00000' || PREFS.includes(a), 'output prefecture');
    const v = vals.get(r + '|' + c);
    assert.ok(Number.isFinite(v), 'output selected missing');
    return v;
  };
  const differences = [];
  for (const c of ['1001', '1003', '1012']) {
    const sum = PREFS.reduce((s, a) => s + get(a, c), 0),
      aggregate = get('00000', c),
      difference = sum - aggregate;
    assert.ok(
      Math.abs(difference) <= 24,
      'output prefecture aggregate rounding'
    );
    differences.push({
      field: c,
      sum,
      aggregate,
      difference,
      aggregateLabel: '県別表の合計（全国表とは異なる）',
    });
  }
  let partitions = 0,
    skippedPartitions = 0;
  for (let r = 1001; r <= 1048; r++) {
    const cs = ['1003', '1012', '1022', '1024'].map((c) =>
      vals.get(r + '|' + c)
    );
    if (cs.some((v) => v === null)) {
      skippedPartitions++;
      continue;
    }
    assert.ok(
      Math.abs(vals.get(r + '|1001') - cs.reduce((s, v) => s + v, 0)) <= 2.5,
      'output four sectors rounding'
    );
    partitions++;
  }
  return {
    get,
    checks: {
      prefectures: 47,
      selectedMissing: 0,
      duplicates: 0,
      differences,
      partitions,
      skippedPartitions,
      suppressed,
    },
  };
}
const AGE_LABELS = [
  '24歳以下',
  '25-29',
  '30-34',
  '35-39',
  '40-44',
  '45-49',
  '50-54',
  '55-59',
  '60-64',
  '65-69',
  '70-74',
  '75-79',
  '80-84',
  '85歳以上',
];
export function decodeCsv(bytes) {
  return parseCsv(new TextDecoder('shift_jis', { fatal: true }).decode(bytes), {
    relax_column_count: true,
    skip_empty_lines: false,
    bom: true,
  });
}
export function parseMedical(age, specialty) {
  for (const rows of [age, specialty]) {
    assert.deepEqual(
      rows[0],
      [
        '令和６年',
        '医師・歯科医師・薬剤師統計',
        '令和６（2024）年12月31日現在',
        '人',
      ],
      'medical period/unit'
    );
  }
  assert.ok(
    age[1][1].includes('第５表') && age[1][1].includes('医療施設従事医師数'),
    'medical age table'
  );
  assert.ok(
    specialty[1][1].includes('第２１表') &&
      specialty[1][1].includes('主たる診療科'),
    'medical specialty table'
  );
  assert.deepEqual(age[2].slice(5, 19), AGE_LABELS, 'medical age headers');
  assert.equal(age[2][4], '総数');
  assert.equal(specialty[5][3], '総数');
  assert.deepEqual(
    [specialty[5][16], ...specialty[5].slice(34, 37), specialty[5][42]],
    ['小児科', '産婦人科', '産科', '婦人科', '救急科'],
    'medical selected specialty headers'
  );
  assert.equal(specialty[5][47], '主たる診療科不詳');
  assert.equal(specialty[5][48], '不詳');
  assert.equal(specialty[4][3], '就業形態', 'medical all employment statuses');
  const values = new Map();
  let partitions = 0;
  for (let i = 0; i < 48; i++) {
    const a = AREAS[i],
      ar = age[i + 3],
      sr = specialty[i + 6];
    assert.equal(ar[0], '総数', 'medical both sexes');
    if (i === 0) {
      assert.equal(ar[2], '全国');
      assert.equal(sr[1], '全国');
    } else {
      const label = String(i).padStart(2, '0') + bare(names[a]);
      assert.equal(ar[1].normalize('NFKC'), label, 'medical age prefecture');
      assert.equal(
        sr[0].normalize('NFKC'),
        label,
        'medical specialty prefecture'
      );
    }
    const total = count(ar[4]);
    assert.equal(count(sr[3]), total, 'same population across medical tables');
    const ageValues = ar.slice(5, 19).map(count),
      specialtyValues = sr.slice(4, 49).map(count);
    assert.equal(
      ageValues.reduce((s, v) => s + v, 0),
      total,
      'medical full age partition'
    );
    assert.equal(
      specialtyValues.reduce((s, v) => s + v, 0),
      total,
      'medical full main-specialty partition'
    );
    values.set(a, {
      total,
      ageValues,
      specialtyValues,
      ageRow: ar,
      specialtyRow: sr,
    });
    partitions += 3;
  }
  assert.equal(values.size, 48, 'medical geography count');
  let nationalChecks = 0;
  for (let col = -1; col < 59; col++) {
    const value = (a) =>
      col === -1
        ? values.get(a).total
        : col < 14
          ? values.get(a).ageValues[col]
          : values.get(a).specialtyValues[col - 14];
    assert.equal(
      PREFS.reduce((s, a) => s + value(a), 0),
      value('00000'),
      'medical national conservation'
    );
    nationalChecks++;
  }
  const get = (a, f) => {
    const v = values.get(a);
    assert.ok(v, 'medical missing area');
    return f.columns.reduce(
      (s, c) =>
        s + count((f.family === 'medical-age' ? v.ageRow : v.specialtyRow)[c]),
      0
    );
  };
  return {
    get,
    values,
    ageLabels: AGE_LABELS,
    specialtyLabels: specialty[5].slice(4, 49),
    checks: {
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      partitions,
      nationalChecks,
      nationalPhysicians: values.get('00000').total,
    },
  };
}
export function medicalSnapshot(parsed, generatedAt) {
  const area = (a) => {
    const r = parsed.values.get(a);
    return {
      areaCode: a,
      areaName: a === '00000' ? '全国' : names[a],
      totalPhysicians: r.total,
      ages: r.ageValues.map((physicians, i) => ({
        ageGroup: parsed.ageLabels[i],
        physicians,
      })),
      specialties: r.specialtyValues.map((physicians, i) => ({
        specialty: parsed.specialtyLabels[i],
        physicians,
      })),
    };
  };
  return {
    schemaVersion: 1,
    period: '2024-12-31',
    unit: '人',
    generatedAt,
    population: '医療施設従事医師・男女計・主たる従業地別',
    source: {
      title: '令和6年医師・歯科医師・薬剤師統計 医師第5表・第21表',
      url: 'https://www.mhlw.go.jp/toukei/saikin/hw/ishi/24/index.html',
      files: FILE_SOURCES.filter(
        (s) => s.filename.startsWith('medical-') && s.filename.endsWith('.csv')
      ).map(({ filename, url, sha256 }) => ({ filename, url, sha256 })),
    },
    areas: PREFS.map(area),
    national: area('00000'),
    notes: [
      '診療科は主として従事する1区分。複数回答や専門医資格とは異なる。',
      '診療科45区分（臨床研修医・全科・その他・主たる診療科不詳・不詳を含む）と年齢14区分はそれぞれ同じ医師総数に一致する。',
      '人数は主たる従業地別の届出値。医療需要や人口当たりの充足度を直接示すものではない。',
      '常勤換算ではない。就業形態総数には医育機関の臨床系大学院生を含む。',
    ],
  };
}
async function sourceBytes(src, dir, isApi = false) {
  const path = resolve(dir, src.filename);
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    let url = src.url;
    if (isApi) {
      assert.ok(process.env.NEXT_PUBLIC_ESTAT_APP_ID, 'e-Stat appId required');
      url = new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');
      url.search = new URLSearchParams({
        appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID,
        lang: 'J',
        ...src.parameters,
      });
    }
    let r;
    try {
      r = await fetch(url, { signal: AbortSignal.timeout(60000) });
    } catch {
      throw Error('source fetch failed ' + src.filename);
    }
    assert.ok(r.ok, 'source HTTP ' + r.status);
    bytes = Buffer.from(await r.arrayBuffer());
  }
  assertHash(
    isApi
      ? JSON.stringify(JSON.parse(bytes).GET_STATS_DATA?.STATISTICAL_DATA)
      : bytes,
    isApi ? src.statisticalDataSha256 : src.sha256
  );
  await mkdir(dir, { recursive: true });
  await writeFile(path, bytes);
  return bytes;
}
async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/2026-09-10-forestry-medical-source'
        ),
      },
      'config-file': { type: 'string' },
      out: {
        type: 'string',
        default: '.local/verification/themes/forestry-medical-core-source.json',
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
  const books = new Map(),
    csvs = new Map();
  for (const s of FILE_SOURCES) {
    const b = await sourceBytes(s, o['source-dir']);
    if (s.filename.endsWith('.xlsx')) {
      const w = new ExcelJS.Workbook();
      await w.xlsx.load(b);
      books.set(s.filename, w);
    }
    if (s.filename.endsWith('.csv')) csvs.set(s.filename, decodeCsv(b));
  }
  const forest = parseForest(books),
    output = parseOutput(
      JSON.parse(await sourceBytes(API_SOURCE, o['source-dir'], true))
    ),
    medical = parseMedical(
      csvs.get('medical-age.csv'),
      csvs.get('medical-specialty.csv')
    );
  const generatedAt = new Date().toISOString(),
    files = [];
  for (const f of FIELDS) {
    const c = configs[f.key];
    assert.ok(c?.isActive, 'inactive/missing config ' + f.key);
    assert.equal(c.unit, f.unit, 'config unit');
    assert.equal(c.yearFormat, 'calendar', 'config calendar period');
    assert.deepEqual(c.years, { from: f.year, to: f.year }, 'config year');
    assert.deepEqual(
      c.source,
      EXPECTED_SOURCES[f.key],
      'config source selection'
    );
    const rows = prefectures.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
      yearCode: String(f.year),
      yearName:
        f.family === 'census'
          ? '2025年2月1日調査'
          : f.family === 'output'
            ? '2024年（確報）'
            : '2024年12月31日現在',
      unit: f.unit,
      value:
        f.family === 'census'
          ? forest[f.key].get(p.prefCode)
          : f.family === 'output'
            ? output.get(p.prefCode, f.code)
            : medical.get(p.prefCode, f),
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
          recipe: buildRecipe(c),
        },
      }),
      content = JSON.stringify(payload);
    files.push({
      key: `app/stats/${f.key}/values.json`,
      metricKey: f.key,
      sha256: sha(content),
      rowCount: 47,
      content,
    });
  }
  const snapshot = medicalSnapshot(medical, generatedAt),
    content = JSON.stringify(snapshot);
  files.push({
    key: 'app/themes/healthcare/medical-workforce.json',
    sha256: sha(content),
    rowCount: 47 * 59,
    content,
  });
  if (o['write-local'])
    for (const f of files) {
      const path = resolve(root, '.local/r2', f.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, f.content);
    }
  const report = {
    generatedAt,
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    fileSources: FILE_SOURCES,
    apiSource: API_SOURCE,
    forestry: Object.fromEntries(
      Object.entries(forest).map(([k, v]) => [k, v.checks])
    ),
    output: output.checks,
    medical: medical.checks,
    files: files.map(({ content, ...f }) => f),
    constraints: [
      '林業労働は経営体ごとの過去1年間の人数。経営体間の個人重複を除いていない。',
      '県別林業産出額は全国表と範囲が異なる。薪炭・副産物の秘匿6セルは復元しない。',
      '医師は主たる従業地・医療施設従事者。3つの例示診療科を全診療科構成にしない。',
    ],
  };
  const out = resolve(root, o.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      metricCount: 12,
      statsRows: 564,
      medicalProfileRows: 2773,
      status: report.status,
      output: out,
    })
  );
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
