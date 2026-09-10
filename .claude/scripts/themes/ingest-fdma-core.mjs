#!/usr/bin/env node
/** Official FDMA/Cabinet Office tables. Only --write-local stages canonical values. Requires pdftotext. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const { parse: parseCsv } = require('csv-parse/sync');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PREFS = prefectures.map((p) => p.prefCode);
const names = Object.fromEntries(
  prefectures.map((p) => [p.prefCode, p.prefName])
);
const nameToCode = Object.fromEntries(
  prefectures.map((p) => [p.prefName, p.prefCode])
);
export const SOURCES = [
  {
    filename: 'heat-2025.pdf',
    url: 'https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf',
    sha256: '9b35222aedb8496f6292b5057106b916b7ac234cbfd0f4d5c1ea29e6dbcfaa47',
    bytes: 897115,
  },
  {
    filename: 'disaster-2024.xlsx',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    sha256: '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
    bytes: 47588,
  },
  {
    filename: 'disaster-2024.csv',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
    sha256: '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
    bytes: 6272,
  },
  {
    filename: 'plan-2026.pdf',
    url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
    sha256: '376e669d6034a7b748dd16422e50b11a22320f9b51a1933a3b75e20f241a386c',
    bytes: 1932500,
  },
  {
    filename: 'rescue-2024.pdf',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    sha256: '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
    bytes: 2926976,
  },
];
export const FIELDS = [
  {
    key: 'heatstroke-emergency-transports',
    title: '熱中症救急搬送人員',
    unit: '人',
    year: 2025,
    yearName: '2025年5〜9月',
    family: 'heat',
    columns: null,
  },
  {
    key: 'natural-disaster-deaths',
    title: '自然災害による死者数',
    unit: '人',
    year: 2024,
    yearName: '2024年（2025年4月1日現在）',
    family: 'disaster',
    columns: [2],
  },
  {
    key: 'natural-disaster-missing-persons',
    title: '自然災害による行方不明者数',
    unit: '人',
    year: 2024,
    yearName: '2024年（2025年4月1日現在）',
    family: 'disaster',
    columns: [4],
  },
  {
    key: 'natural-disaster-injured-persons',
    title: '自然災害による負傷者数',
    unit: '人',
    year: 2024,
    yearName: '2024年（2025年4月1日現在）',
    family: 'disaster',
    columns: [5, 6],
  },
  {
    key: 'natural-disaster-destroyed-houses',
    title: '自然災害による全壊住家棟数',
    unit: '棟',
    year: 2024,
    yearName: '2024年（2025年4月1日現在）',
    family: 'disaster',
    columns: [7],
  },
  {
    key: 'natural-disaster-half-destroyed-houses',
    title: '自然災害による半壊住家棟数',
    unit: '棟',
    year: 2024,
    yearName: '2024年（2025年4月1日現在）',
    family: 'disaster',
    columns: [8],
  },
  {
    key: 'natural-disaster-partially-damaged-houses',
    title: '自然災害による一部破損住家棟数',
    unit: '棟',
    year: 2024,
    yearName: '2024年（2025年4月1日現在）',
    family: 'disaster',
    columns: [9],
  },
  {
    key: 'individual-evacuation-plan-listed-persons',
    title: '避難行動要支援者名簿の掲載人数',
    unit: '人',
    year: 2026,
    yearName: '2026年4月1日現在',
    family: 'plan',
    columns: null,
  },
  {
    key: 'individual-evacuation-plan-covered-persons',
    title: '個別避難計画が作成された人数',
    unit: '人',
    year: 2026,
    yearName: '2026年4月1日現在',
    family: 'plan',
    columns: null,
  },
  {
    key: 'individual-evacuation-plan-coverage-rate',
    title: '個別避難計画の作成率',
    unit: '％',
    year: 2026,
    yearName: '2026年4月1日現在',
    family: 'plan',
    columns: null,
  },
  {
    key: 'ambulance-transported-persons',
    title: '救急自動車による搬送人員',
    unit: '人',
    year: 2024,
    yearName: '2024年',
    family: 'rescue',
    columns: [5],
  },
  {
    key: 'ambulance-transported-deaths',
    title: '救急搬送人員（初診時死亡）',
    unit: '人',
    year: 2024,
    yearName: '2024年',
    family: 'rescue',
    columns: [0],
  },
  {
    key: 'ambulance-transported-severe',
    title: '救急搬送人員（重症）',
    unit: '人',
    year: 2024,
    yearName: '2024年',
    family: 'rescue',
    columns: [1],
  },
  {
    key: 'ambulance-transported-moderate',
    title: '救急搬送人員（中等症）',
    unit: '人',
    year: 2024,
    yearName: '2024年',
    family: 'rescue',
    columns: [2],
  },
  {
    key: 'ambulance-transported-mild',
    title: '救急搬送人員（軽症）',
    unit: '人',
    year: 2024,
    yearName: '2024年',
    family: 'rescue',
    columns: [3],
  },
  {
    key: 'ambulance-transported-other',
    title: '救急搬送人員（その他）',
    unit: '人',
    year: 2024,
    yearName: '2024年',
    family: 'rescue',
    columns: [4],
  },
];
export const EXPECTED_SOURCES = {
  'heatstroke-emergency-transports': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「熱中症による救急搬送状況」',
    url: 'https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf',
    config: {
      source: {
        name: '消防庁「熱中症による救急搬送状況」',
        url: 'https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf',
        sourceSha256:
          '9b35222aedb8496f6292b5057106b916b7ac234cbfd0f4d5c1ea29e6dbcfaa47',
        publicationIndexUrl:
          'https://www.fdma.go.jp/disaster/heatstroke/post1.html',
        table:
          '資料4-2 都道府県別の年齢区分別、初診時における傷病程度別救急搬送人員',
        valueColumn: '資料4-2 年齢区分別の合計列',
        dataYear: '2025年5〜9月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFの資料4-2（PDF10ページ）をpdftotext -layoutで抽出。47県の年齢5区分合計と初診時傷病5区分合計が一致する搬送総数を取得。',
        verification:
          '全県/全国の年齢及び傷病区分合計、12列の47県計=全国、確定期間、単位、47県一意、欠測を検査。全国100510人。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'final',
        asOf: '2025-09-30',
        pdfPage: 10,
        periodStart: '2025-05-01',
        periodEnd: '2025-09-30',
        releasedAt: '2025-10-29',
        timeScope: 'seasonal-May-September',
      },
    },
  },
  'natural-disaster-deaths': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「消防白書」自然災害等の被害状況',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    config: {
      source: {
        name: '消防庁「消防白書」自然災害等の被害状況',
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
        sourceSha256:
          '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html',
        table:
          '資料1-5-2 令和6年中に発生した自然災害等による都道府県別被害状況',
        valueColumn: 'B6:B52 死者',
        dataYear: '2024年（2025年4月1日現在）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県6〜52行と公式CSVの同セルを照合。負傷者のみ重傷E列+軽傷F列を合算。空欄を0へ変換しない。',
        verification:
          '人的/住家B:Kの480セルがXLSX/CSV一致。各列47県計=全国、関連死<=死者。欠測・重複・単位・原表年度を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2025-04-01',
        corroboration: {
          url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
          sha256:
            '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
        },
      },
    },
  },
  'natural-disaster-missing-persons': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「消防白書」自然災害等の被害状況',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    config: {
      source: {
        name: '消防庁「消防白書」自然災害等の被害状況',
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
        sourceSha256:
          '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html',
        table:
          '資料1-5-2 令和6年中に発生した自然災害等による都道府県別被害状況',
        valueColumn: 'D6:D52 行方不明者',
        dataYear: '2024年（2025年4月1日現在）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県6〜52行と公式CSVの同セルを照合。負傷者のみ重傷E列+軽傷F列を合算。空欄を0へ変換しない。',
        verification:
          '人的/住家B:Kの480セルがXLSX/CSV一致。各列47県計=全国、関連死<=死者。欠測・重複・単位・原表年度を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2025-04-01',
        corroboration: {
          url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
          sha256:
            '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
        },
      },
    },
  },
  'natural-disaster-injured-persons': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「消防白書」自然災害等の被害状況',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    config: {
      source: {
        name: '消防庁「消防白書」自然災害等の被害状況',
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
        sourceSha256:
          '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html',
        table:
          '資料1-5-2 令和6年中に発生した自然災害等による都道府県別被害状況',
        valueColumn: 'E6:F52 重傷+軽傷',
        dataYear: '2024年（2025年4月1日現在）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県6〜52行と公式CSVの同セルを照合。負傷者のみ重傷E列+軽傷F列を合算。空欄を0へ変換しない。',
        verification:
          '人的/住家B:Kの480セルがXLSX/CSV一致。各列47県計=全国、関連死<=死者。欠測・重複・単位・原表年度を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2025-04-01',
        corroboration: {
          url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
          sha256:
            '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
        },
      },
    },
  },
  'natural-disaster-destroyed-houses': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「消防白書」自然災害等の被害状況',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    config: {
      source: {
        name: '消防庁「消防白書」自然災害等の被害状況',
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
        sourceSha256:
          '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html',
        table:
          '資料1-5-2 令和6年中に発生した自然災害等による都道府県別被害状況',
        valueColumn: 'G6:G52 全壊',
        dataYear: '2024年（2025年4月1日現在）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県6〜52行と公式CSVの同セルを照合。負傷者のみ重傷E列+軽傷F列を合算。空欄を0へ変換しない。',
        verification:
          '人的/住家B:Kの480セルがXLSX/CSV一致。各列47県計=全国、関連死<=死者。欠測・重複・単位・原表年度を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2025-04-01',
        corroboration: {
          url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
          sha256:
            '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
        },
      },
    },
  },
  'natural-disaster-half-destroyed-houses': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「消防白書」自然災害等の被害状況',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    config: {
      source: {
        name: '消防庁「消防白書」自然災害等の被害状況',
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
        sourceSha256:
          '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html',
        table:
          '資料1-5-2 令和6年中に発生した自然災害等による都道府県別被害状況',
        valueColumn: 'H6:H52 半壊',
        dataYear: '2024年（2025年4月1日現在）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県6〜52行と公式CSVの同セルを照合。負傷者のみ重傷E列+軽傷F列を合算。空欄を0へ変換しない。',
        verification:
          '人的/住家B:Kの480セルがXLSX/CSV一致。各列47県計=全国、関連死<=死者。欠測・重複・単位・原表年度を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2025-04-01',
        corroboration: {
          url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
          sha256:
            '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
        },
      },
    },
  },
  'natural-disaster-partially-damaged-houses': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「消防白書」自然災害等の被害状況',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    config: {
      source: {
        name: '消防庁「消防白書」自然災害等の被害状況',
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
        sourceSha256:
          '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html',
        table:
          '資料1-5-2 令和6年中に発生した自然災害等による都道府県別被害状況',
        valueColumn: 'I6:I52 一部破損',
        dataYear: '2024年（2025年4月1日現在）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県6〜52行と公式CSVの同セルを照合。負傷者のみ重傷E列+軽傷F列を合算。空欄を0へ変換しない。',
        verification:
          '人的/住家B:Kの480セルがXLSX/CSV一致。各列47県計=全国、関連死<=死者。欠測・重複・単位・原表年度を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2025-04-01',
        corroboration: {
          url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
          sha256:
            '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
        },
      },
    },
  },
  'individual-evacuation-plan-listed-persons': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
    url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
    config: {
      source: {
        name: '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
      },
      provenance: {
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
        sourceSha256:
          '376e669d6034a7b748dd16422e50b11a22320f9b51a1933a3b75e20f241a386c',
        publicationIndexUrl:
          'https://www.bousai.go.jp/taisaku/hisaisyagyousei/r8chosa.html',
        table: '資料1 図6 都道府県ごとの個別避難計画の作成状況',
        valueColumn: '資料1 図6 名簿（人）',
        dataYear: '2026年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFの図6（PDF7ページ）の名簿/計画/作成率を47県と全国で抽出。資料2の5-2（PDF16ページ）名簿人数とも照合。',
        verification:
          '全国名簿6696718人・計画1014017人、県合計、48行の分子<=分母と公表率丸め一致、別表名簿一致、47県一意・欠測なしを検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2026-04-01',
        pdfPage: 7,
        releasedAt: '2026-06-29',
        denominator: '名簿に係る避難行動要支援者人数',
        numerator: '調査時点で個別避難計画が作成された避難行動要支援者人数',
      },
    },
  },
  'individual-evacuation-plan-covered-persons': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
    url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
    config: {
      source: {
        name: '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
      },
      provenance: {
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
        sourceSha256:
          '376e669d6034a7b748dd16422e50b11a22320f9b51a1933a3b75e20f241a386c',
        publicationIndexUrl:
          'https://www.bousai.go.jp/taisaku/hisaisyagyousei/r8chosa.html',
        table: '資料1 図6 都道府県ごとの個別避難計画の作成状況',
        valueColumn: '資料1 図6 計画（人）',
        dataYear: '2026年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFの図6（PDF7ページ）の名簿/計画/作成率を47県と全国で抽出。資料2の5-2（PDF16ページ）名簿人数とも照合。',
        verification:
          '全国名簿6696718人・計画1014017人、県合計、48行の分子<=分母と公表率丸め一致、別表名簿一致、47県一意・欠測なしを検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2026-04-01',
        pdfPage: 7,
        releasedAt: '2026-06-29',
        denominator: '名簿に係る避難行動要支援者人数',
        numerator: '調査時点で個別避難計画が作成された避難行動要支援者人数',
      },
    },
  },
  'individual-evacuation-plan-coverage-rate': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName:
      '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
    url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
    config: {
      source: {
        name: '内閣府・消防庁「避難行動要支援者名簿及び個別避難計画の作成等に係る取組状況」',
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
      },
      provenance: {
        url: 'https://www.bousai.go.jp/taisaku/hisaisyagyousei/pdf/r8chosa1.pdf',
        sourceSha256:
          '376e669d6034a7b748dd16422e50b11a22320f9b51a1933a3b75e20f241a386c',
        publicationIndexUrl:
          'https://www.bousai.go.jp/taisaku/hisaisyagyousei/r8chosa.html',
        table: '資料1 図6 都道府県ごとの個別避難計画の作成状況',
        valueColumn: '資料1 図6 作成率（計画人数/名簿人数）',
        dataYear: '2026年4月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFの図6（PDF7ページ）の名簿/計画/作成率を47県と全国で抽出。資料2の5-2（PDF16ページ）名簿人数とも照合。',
        verification:
          '全国名簿6696718人・計画1014017人、県合計、48行の分子<=分母と公表率丸め一致、別表名簿一致、47県一意・欠測なしを検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2026-04-01',
        pdfPage: 7,
        releasedAt: '2026-06-29',
        denominator: '名簿に係る避難行動要支援者人数',
        numerator: '調査時点で個別避難計画が作成された避難行動要支援者人数',
      },
    },
  },
  'ambulance-transported-persons': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「救急・救助の現況」',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    config: {
      source: {
        name: '消防庁「令和7年版 救急救助の現況」',
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
        sourceSha256:
          '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/rescue/post-7.html',
        table: '別表6 都道府県別傷病程度別搬送人員及び構成比',
        pdfPage: 57,
        valueColumn: '合計',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFをpdftotext -layoutで抽出し、別表6の47県及び全国の傷病程度5区分と総数を取得。割合列と人数列を分離。',
        verification:
          '全48行で5区分合計=搬送総数、割合5区分は人数/搬送総数の小数1桁丸めと一致、6列の47県和=全国。全国6769172人。欠測・重複・単位・対象年を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        definitionTable:
          '第25表注（PDF22ページ）初診時における医師の診断に基づく5分類',
        releaseStatus: 'published-annual',
      },
    },
  },
  'ambulance-transported-deaths': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「救急・救助の現況」',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    config: {
      source: {
        name: '消防庁「令和7年版 救急救助の現況」',
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
        sourceSha256:
          '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/rescue/post-7.html',
        table: '別表6 都道府県別傷病程度別搬送人員及び構成比',
        pdfPage: 57,
        valueColumn: '死亡',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFをpdftotext -layoutで抽出し、別表6の47県及び全国の傷病程度5区分と総数を取得。割合列と人数列を分離。',
        verification:
          '全48行で5区分合計=搬送総数、割合5区分は人数/搬送総数の小数1桁丸めと一致、6列の47県和=全国。全国6769172人。欠測・重複・単位・対象年を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        definitionTable:
          '第25表注（PDF22ページ）初診時における医師の診断に基づく5分類',
        releaseStatus: 'published-annual',
      },
    },
  },
  'ambulance-transported-severe': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「救急・救助の現況」',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    config: {
      source: {
        name: '消防庁「令和7年版 救急救助の現況」',
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
        sourceSha256:
          '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/rescue/post-7.html',
        table: '別表6 都道府県別傷病程度別搬送人員及び構成比',
        pdfPage: 57,
        valueColumn: '重症（長期入院）',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFをpdftotext -layoutで抽出し、別表6の47県及び全国の傷病程度5区分と総数を取得。割合列と人数列を分離。',
        verification:
          '全48行で5区分合計=搬送総数、割合5区分は人数/搬送総数の小数1桁丸めと一致、6列の47県和=全国。全国6769172人。欠測・重複・単位・対象年を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        definitionTable:
          '第25表注（PDF22ページ）初診時における医師の診断に基づく5分類',
        releaseStatus: 'published-annual',
      },
    },
  },
  'ambulance-transported-moderate': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「救急・救助の現況」',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    config: {
      source: {
        name: '消防庁「令和7年版 救急救助の現況」',
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
        sourceSha256:
          '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/rescue/post-7.html',
        table: '別表6 都道府県別傷病程度別搬送人員及び構成比',
        pdfPage: 57,
        valueColumn: '中等症（入院診療）',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFをpdftotext -layoutで抽出し、別表6の47県及び全国の傷病程度5区分と総数を取得。割合列と人数列を分離。',
        verification:
          '全48行で5区分合計=搬送総数、割合5区分は人数/搬送総数の小数1桁丸めと一致、6列の47県和=全国。全国6769172人。欠測・重複・単位・対象年を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        definitionTable:
          '第25表注（PDF22ページ）初診時における医師の診断に基づく5分類',
        releaseStatus: 'published-annual',
      },
    },
  },
  'ambulance-transported-mild': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「救急・救助の現況」',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    config: {
      source: {
        name: '消防庁「令和7年版 救急救助の現況」',
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
        sourceSha256:
          '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/rescue/post-7.html',
        table: '別表6 都道府県別傷病程度別搬送人員及び構成比',
        pdfPage: 57,
        valueColumn: '軽症（外来診療）',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFをpdftotext -layoutで抽出し、別表6の47県及び全国の傷病程度5区分と総数を取得。割合列と人数列を分離。',
        verification:
          '全48行で5区分合計=搬送総数、割合5区分は人数/搬送総数の小数1桁丸めと一致、6列の47県和=全国。全国6769172人。欠測・重複・単位・対象年を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        definitionTable:
          '第25表注（PDF22ページ）初診時における医師の診断に基づく5分類',
        releaseStatus: 'published-annual',
      },
    },
  },
  'ambulance-transported-other': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「救急・救助の現況」',
    url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
    config: {
      source: {
        name: '消防庁「令和7年版 救急救助の現況」',
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/rescue/items/kkkg_r07_01_kyukyu.pdf',
        sourceSha256:
          '17bafbf77bb6f1694cd1bed8845be99c7844ed5b4325a0fef884e9869ba0163a',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/rescue/post-7.html',
        table: '別表6 都道府県別傷病程度別搬送人員及び構成比',
        pdfPage: 57,
        valueColumn: 'その他',
        dataYear: '2024年1〜12月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFをpdftotext -layoutで抽出し、別表6の47県及び全国の傷病程度5区分と総数を取得。割合列と人数列を分離。',
        verification:
          '全48行で5区分合計=搬送総数、割合5区分は人数/搬送総数の小数1桁丸めと一致、6列の47県和=全国。全国6769172人。欠測・重複・単位・対象年を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        definitionTable:
          '第25表注（PDF22ページ）初診時における医師の診断に基づく5分類',
        releaseStatus: 'published-annual',
      },
    },
  },
};
export const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function assertHash(bytes, expected) {
  assert.equal(sha(bytes), expected, 'source SHA changed');
}
export const clean = (v) =>
  String(v ?? '')
    .normalize('NFKC')
    .replace(/\s/g, '');
export function count(v) {
  assert.ok(typeof v === 'number' || typeof v === 'string', 'missing count');
  const s = String(v).replaceAll(',', '');
  assert.match(s, /^\d+$/, 'missing/suppressed/negative/noninteger count');
  const n = Number(s);
  assert.ok(Number.isSafeInteger(n), 'unsafe count');
  return n;
}
export function pdfText(bytes) {
  return execFileSync('pdftotext', ['-layout', '-', '-'], {
    input: bytes,
    maxBuffer: 8 * 1024 * 1024,
  }).toString('utf8');
}
function uniqueAreas(rows) {
  assert.equal(rows.length, 47, '47 prefecture rows');
  assert.equal(new Set(rows.map((r) => r.areaCode)).size, 47, 'duplicate area');
  assert.deepEqual(
    rows.map((r) => r.areaCode).sort(),
    PREFS,
    'complete prefecture set'
  );
}
export function parseHeat(text) {
  assert.match(clean(text.slice(0, 500)), /令和7年10月29日/, 'heat release');
  assert.match(
    clean(text.slice(0, 500)),
    /5月から9月までの確定値/,
    'heat final seasonal period'
  );
  const pages = text
    .split('\f')
    .filter((p) => p.trimStart().startsWith('資料４－２'));
  assert.equal(pages.length, 1, 'unique heat table');
  const page = pages[0];
  assert.match(clean(page), /令和7年5月1日~9月30日/, 'heat table period');
  assert.match(clean(page), /年齢区分別\(人\)/, 'heat count unit');
  assert.match(
    clean(page),
    /新生児乳幼児少年成人高齢者合計死亡重症中等症軽症その他合計/,
    'heat column order'
  );
  const matches = [...page.matchAll(/^\s*(\d{1,2})\s+(\S+)\s+([\d, \t]+)$/gm)];
  const rows = matches.map((m, i) => {
    assert.equal(Number(m[1]), i + 1, 'heat source sequence');
    assert.equal(m[2], prefectures[i]?.prefName, 'heat prefecture name');
    const values = m[3].trim().split(/\s+/).map(count);
    assert.equal(values.length, 12, 'heat column count');
    return { areaCode: prefectures[i].prefCode, areaName: m[2], values };
  });
  uniqueAreas(rows);
  const total = page.match(/^合\s*計【人】\s+([\d, \t]+)$/m);
  assert.ok(total, 'heat national row');
  const national = total[1].trim().split(/\s+/).map(count);
  assert.equal(national.length, 12, 'heat national columns');
  for (const values of [...rows.map((r) => r.values), national]) {
    assert.equal(
      values.slice(0, 5).reduce((a, b) => a + b, 0),
      values[5],
      'heat age partition'
    );
    assert.equal(
      values.slice(6, 11).reduce((a, b) => a + b, 0),
      values[11],
      'heat severity partition'
    );
    assert.equal(values[5], values[11], 'heat same cohort');
  }
  for (let c = 0; c < 12; c++)
    assert.equal(
      rows.reduce((a, r) => a + r.values[c], 0),
      national[c],
      'heat national column sum'
    );
  assert.equal(national[5], 100510, 'heat official national total');
  return {
    rows,
    national,
    get: (a) => rows.find((r) => r.areaCode === a).values[5],
    checks: {
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      period: '2025-05-01/2025-09-30',
      national: 100510,
      ageAndSeverityPartitions: 96,
      sameCohortIdentities: 48,
      nationalColumnIdentities: 12,
    },
  };
}
export function parseDisaster(workbook, csv) {
  assert.equal(workbook.worksheets.length, 1, 'disaster sheet count');
  const s = workbook.worksheets[0];
  assert.equal(s.name.trim(), '資料1-5-2', 'disaster sheet');
  assert.equal(s.rowCount, 56, 'disaster rows');
  assert.equal(csv.length, 56, 'disaster csv rows');
  assert.match(
    clean(s.getCell('A1').value),
    /令和6年1月1日から令和6年12月31日/,
    'disaster period'
  );
  assert.equal(
    clean(s.getCell('Z2').value),
    '令和7年4月1日現在',
    'disaster as-of'
  );
  assert.equal(clean(s.getCell('B3').value), '人的被害(人)', 'human unit');
  assert.equal(clean(s.getCell('G3').value), '建物被害(棟)', 'house unit');
  assert.equal(
    clean(s.getCell('G4').value),
    '住家被害',
    'residential house scope'
  );
  assert.equal(clean(s.getCell('B4').value), '死者', 'death column');
  assert.equal(
    clean(s.getCell('C5').value),
    'うち災害関連死者',
    'related deaths are a subset'
  );
  assert.equal(
    clean(s.getCell('D5').value),
    '行方不明者',
    'missing person column'
  );
  for (const [col, label] of [
    [5, '重傷'],
    [6, '軽傷'],
    [7, '全壊'],
    [8, '半壊'],
    [9, '一部破損'],
    [10, '床上浸水'],
    [11, '床下浸水'],
  ])
    assert.equal(
      clean(s.getCell(5, col).value),
      label,
      'disaster column definition'
    );
  const records = [...prefectures, { prefCode: '00000', prefName: '合計' }].map(
    (p, i) => {
      const row = i + 6,
        expected =
          p.prefName === '北海道' || i === 47
            ? p.prefName
            : p.prefName.slice(0, -1);
      assert.equal(
        clean(s.getCell(row, 1).value),
        expected,
        'disaster prefecture name'
      );
      assert.equal(clean(csv[row - 1][0]), expected, 'disaster CSV area');
      const values = Array.from({ length: 10 }, (_, j) => {
        const value = count(s.getCell(row, j + 2).value);
        assert.equal(
          count(csv[row - 1][j + 1]),
          value,
          'disaster Excel CSV cell identity'
        );
        return value;
      });
      assert.ok(values[1] <= values[0], 'related deaths subset');
      return { areaCode: p.prefCode, areaName: p.prefName, values };
    }
  );
  const rows = records.slice(0, 47),
    national = records[47].values;
  uniqueAreas(rows);
  for (let c = 0; c < 10; c++)
    assert.equal(
      rows.reduce((a, r) => a + r.values[c], 0),
      national[c],
      'disaster national column sum'
    );
  assert.deepEqual(
    national,
    [627, 342, 6, 575, 1499, 6540, 24636, 131271, 1385, 6729],
    'disaster official national totals'
  );
  return {
    rows,
    national,
    get: (a, columns) =>
      columns.reduce(
        (sum, c) => sum + rows.find((r) => r.areaCode === a).values[c - 2],
        0
      ),
    checks: {
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      period: '2024-01-01/2024-12-31',
      asOf: '2025-04-01',
      nationalColumns: national,
      excelCsvIdentities: 480,
      relatedDeathSubsetChecks: 48,
      nationalColumnIdentities: 10,
    },
  };
}
export function parsePlan(text) {
  assert.match(clean(text.slice(0, 500)), /令和8年6月29日/, 'plan release');
  assert.match(clean(text.slice(0, 500)), /令和8年4月1日現在/, 'plan as-of');
  assert.match(
    clean(text),
    /全市町村\(団体\)で作成済み/,
    'plan complete municipality scope'
  );
  const pages = text.split('\f'),
    tables = pages.filter((p) =>
      clean(p).includes('図6都道府県ごとの個別避難計画の作成状況')
    );
  assert.equal(tables.length, 1, 'unique plan table');
  assert.match(clean(tables[0]), /名簿計画作成率/, 'plan header');
  const pattern = Object.keys(nameToCode).join('|');
  const regex = new RegExp(
    '(' + pattern + '|全国計)\\s+([\\d,]+)\\s+([\\d,]+)\\s+(\\d+\\.\\d)%',
    'g'
  );
  const records = [...tables[0].matchAll(regex)].map((m) => ({
    areaCode: m[1] === '全国計' ? '00000' : nameToCode[m[1]],
    areaName: m[1],
    listed: count(m[2]),
    covered: count(m[3]),
    rate: Number(m[4]),
  }));
  assert.equal(records.length, 48, 'plan 47 areas and national');
  const rows = records.filter((r) => r.areaCode !== '00000'),
    nationals = records.filter((r) => r.areaCode === '00000');
  uniqueAreas(rows);
  assert.equal(nationals.length, 1, 'plan unique national');
  const national = nationals[0];
  for (const r of records) {
    assert.ok(r.listed > 0, 'plan nonzero denominator');
    assert.ok(r.covered <= r.listed, 'plan numerator subset');
    assert.equal(
      Math.round((r.covered / r.listed) * 1000) / 10,
      r.rate,
      'plan rounded ratio'
    );
  }
  for (const c of ['listed', 'covered'])
    assert.equal(
      rows.reduce((s, r) => s + r[c], 0),
      national[c],
      'plan national count sum'
    );
  assert.deepEqual(
    [national.listed, national.covered, national.rate],
    [6696718, 1014017, 15.1],
    'plan official national totals'
  );
  // A separate table uses the same listed-person denominator; its population is not used.
  const crossPages = pages.filter((p) =>
    clean(p).includes('5-2.平時からの名簿情報提供状況')
  );
  assert.equal(crossPages.length, 1, 'plan second denominator table');
  const cross = [
    ...crossPages[0].matchAll(
      new RegExp(
        '(' +
          pattern +
          '|合計)\\s+([\\d,]+)\\s+([\\d,]+)\\s+([\\d,]+)\\s+[\\d.]+%\\s+[\\d.]+%',
        'g'
      )
    ),
  ];
  assert.equal(cross.length, 48, 'plan second table count');
  const seen = new Set();
  for (const m of cross) {
    const code = m[1] === '合計' ? '00000' : nameToCode[m[1]];
    assert.ok(!seen.has(code), 'plan second table duplicate');
    seen.add(code);
    assert.equal(
      count(m[3]),
      records.find((r) => r.areaCode === code)?.listed,
      'plan cross-table denominator'
    );
  }
  return {
    rows,
    national,
    get: (a, key) => {
      const r = rows.find((r) => r.areaCode === a);
      return key.endsWith('listed-persons')
        ? r.listed
        : key.endsWith('covered-persons')
          ? r.covered
          : r.rate;
    },
    checks: {
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      asOf: '2026-04-01',
      surveyedMunicipalities: 1741,
      national,
      roundedRateIdentities: 48,
      crossTableDenominatorIdentities: 48,
      nationalCountIdentities: 2,
    },
  };
}
export function parseRescue(text) {
  const pages = text
    .split('\f')
    .filter((p) =>
      clean(p).startsWith('別表6都道府県別傷病程度別搬送人員及び構成比')
    );
  assert.equal(pages.length, 1, 'unique rescue table');
  const page = pages[0];
  assert.match(clean(page), /令和6年中単位:人、%/, 'rescue period and unit');
  assert.match(
    clean(page),
    /死亡重症\(長期入院\)中等症\(入院診療\)軽症\(外来診療\)その他/,
    'rescue severity columns'
  );
  const labels = new Set([
    ...prefectures.map((p) =>
      p.prefName === '北海道' ? p.prefName : p.prefName.slice(0, -1)
    ),
    '合計',
  ]);
  const sourceRows = page
    .split('\n')
    .map((line) => ({ name: clean(line.split(/[0-9]/)[0]), line }))
    .filter((r) => labels.has(r.name) && /[0-9]/.test(r.line))
    .map((r) => ({
      name: r.name,
      cells: r.line.slice(r.line.search(/[0-9]/)).trim().split(/\s+/),
    }));
  assert.equal(sourceRows.length, 48, 'rescue 47 prefectures and national');
  const records = sourceRows.map((r, i) => {
    const p =
      i === 47 ? { prefCode: '00000', prefName: '合計' } : prefectures[i];
    const bare =
      p.prefName === '北海道' || i === 47
        ? p.prefName
        : p.prefName.slice(0, -1);
    assert.equal(r.name, bare, 'rescue prefecture name');
    assert.equal(r.cells.length, 11, 'rescue columns');
    const values = [0, 2, 4, 6, 8, 10].map((c) => count(r.cells[c]));
    assert.equal(
      values.slice(0, 5).reduce((s, v) => s + v, 0),
      values[5],
      'rescue severity partition'
    );
    assert.ok(values[5] > 0, 'rescue nonzero total');
    const percentages = [1, 3, 5, 7, 9].map((c, j) => {
      assert.match(r.cells[c], /^\(\d+\.\d\)$/, 'rescue percentage cell');
      const value = Number(r.cells[c].slice(1, -1));
      assert.equal(
        Math.round((values[j] / values[5]) * 1000) / 10,
        value,
        'rescue percentage identity'
      );
      return value;
    });
    return { areaCode: p.prefCode, areaName: p.prefName, values, percentages };
  });
  const rows = records.slice(0, 47),
    national = records[47].values;
  uniqueAreas(rows);
  for (let c = 0; c < 6; c++)
    assert.equal(
      rows.reduce((s, r) => s + r.values[c], 0),
      national[c],
      'rescue national column sum'
    );
  assert.deepEqual(
    national,
    [86199, 491471, 3017912, 3171350, 2240, 6769172],
    'rescue official national totals'
  );
  return {
    rows,
    national,
    get: (a, index) => rows.find((r) => r.areaCode === a).values[index],
    checks: {
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      period: '2024-01-01/2024-12-31',
      national,
      severityPartitions: 48,
      percentageIdentities: 240,
      nationalColumnIdentities: 6,
    },
  };
}

export function validateConfig(c, f) {
  assert.equal(c?.key, f.key, 'config key');
  assert.equal(c.isActive, true, 'inactive config');
  assert.equal(c.unit, f.unit, 'config unit');
  assert.equal(c.category, 'safetyenvironment', 'config category');
  assert.deepEqual(c.entities, ['prefecture'], 'config geography');
  assert.deepEqual(c.years, { from: f.year, to: f.year }, 'config year');
  assert.equal(c.yearFormat, 'calendar', 'config year format');
  assert.equal(c.display.conversionFactor, 1, 'config no value conversion');
  assert.deepEqual(
    c.source,
    EXPECTED_SOURCES[f.key],
    'config source definition'
  );
}
async function sourceBytes(src, dir) {
  const path = resolve(dir, src.filename);
  let bytes;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(src.url, {
      signal: AbortSignal.timeout(90000),
    });
    assert.ok(response.ok, 'official source HTTP ' + response.status);
    bytes = Buffer.from(await response.arrayBuffer());
    assertHash(bytes, src.sha256);
    await mkdir(dir, { recursive: true });
    await writeFile(path, bytes);
  }
  assertHash(bytes, src.sha256);
  return bytes;
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(root, '.local/verification/themes/fdma-core-source'),
      },
      'config-file': { type: 'string' },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/fdma-core-source.json'
        ),
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
  for (const f of FIELDS) validateConfig(configs[f.key], f);
  const buffers = new Map();
  for (const s of SOURCES)
    buffers.set(s.filename, await sourceBytes(s, o['source-dir']));
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(buffers.get('disaster-2024.xlsx'));
  const heat = parseHeat(pdfText(buffers.get('heat-2025.pdf'))),
    disaster = parseDisaster(
      book,
      parseCsv(buffers.get('disaster-2024.csv'), {
        bom: true,
        relax_column_count: true,
      })
    ),
    plan = parsePlan(pdfText(buffers.get('plan-2026.pdf'))),
    rescue = parseRescue(pdfText(buffers.get('rescue-2024.pdf')));
  const generatedAt = new Date().toISOString(),
    files = [];
  for (const f of FIELDS) {
    const rows = prefectures.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
      yearCode: String(f.year),
      yearName: f.yearName,
      unit: f.unit,
      value:
        f.family === 'heat'
          ? heat.get(p.prefCode)
          : f.family === 'disaster'
            ? disaster.get(p.prefCode, f.columns)
            : f.family === 'rescue'
              ? rescue.get(p.prefCode, f.columns[0])
              : plan.get(p.prefCode, f.key),
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
    files.push({
      key: `app/stats/${f.key}/values.json`,
      metricKey: f.key,
      sha256: sha(content),
      rowCount: 47,
      content,
    });
  }
  if (o['write-local'])
    for (const f of files) {
      const path = resolve(root, '.local/r2', f.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, f.content);
    }
  const report = {
    generatedAt,
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    sources: SOURCES,
    checks: {
      heat: heat.checks,
      disaster: disaster.checks,
      plan: plan.checks,
      rescue: rescue.checks,
    },
    records: {
      heat: heat.rows,
      disaster: disaster.rows,
      plan: plan.rows,
      rescue: rescue.rows,
    },
    files: files.map(({ content, ...f }) => f),
  };
  const output = resolve(o.out);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: report.status,
      metricCount: FIELDS.length,
      rows: FIELDS.length * 47,
      output,
    })
  );
  return report;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
