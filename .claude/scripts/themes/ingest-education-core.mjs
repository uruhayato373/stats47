#!/usr/bin/env node
/** Official MEXT education tables. --write-local is the sole canonical staging flag. */
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
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SOURCES = [
  {
    filename: 'closed-2024.pdf',
    url: 'https://www.mext.go.jp/content/20250331-mxt_sisetujo-000012748_9.pdf',
    sha256: '467cd6026518774cad3182949d63caf8bd94fd92335a05346f31776408fb790f',
    bytes: 272069,
  },
  {
    filename: 'sports-report.pdf',
    url: 'https://www.mext.go.jp/sports/content/20260501-stiiki-300000983_2.pdf',
    sha256: 'de26c22c678289764c3ad01be89509104a5d31c507732419378b82af75038214',
    bytes: 912335,
  },
  {
    filename: 'museums-2023.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
    sha256: '368fb0c27c381eb9cab419415ae43e46f50bd1fb80e2ef2533f8024225f50e3d',
    bytes: 13584,
  },
  {
    filename: 'similar-museums-2023.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439550&fileKind=0',
    sha256: '6ff3fddfac1905c506864652027fbdf18153233b9afcc1d969f325f400008b14',
    bytes: 11700,
  },
  {
    filename: 'graduates-2025.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040393374&fileKind=0',
    sha256: '554ef7b4107e4ffc5f811301b3399267e86ef1de59398cc7848caf54bf5cdfe1',
    bytes: 75280,
  },
  {
    filename: 'graduates-summary-2025.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040393936&fileKind=0',
    sha256: 'e754c347a2498b09ed65a174af40f4e73ead5663743edc5b3a58d5663df80c70',
    bytes: 40509,
  },
  {
    filename: 'sports-inventory-2024.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
    sha256: 'e83629d004129b5938aab83496e3dd8cccf6f118c0d0d3e1b37ef5b2f4d0523a',
    bytes: 392215,
  },
  {
    filename: 'museums-guide-2024.pdf',
    url: 'https://www.mext.go.jp/content/20240821-mxt_chousa01-000037636_05.pdf',
    sha256: '1386cdccc82de849e0320473f176353588ea3d44fcd522c12936daf70af9feb3',
    bytes: 4094349,
  },
];
export const FIELDS = [
  {
    key: 'public-school-closures-cumulative',
    title: '公立学校の廃校発生延べ数',
    unit: '校',
    year: 2024,
    yearFormat: 'calendar',
    yearName: '2004〜2023年度累計（2024年5月1日把握）',
    family: 'closed',
    filename: 'closed-2024.pdf',
    column: 0,
  },
  {
    key: 'registered-museum-visitors',
    title: '登録博物館の入館者数',
    unit: '人',
    year: 2023,
    yearFormat: 'fiscal',
    yearName: '2023年度',
    family: 'museum',
    filename: 'museums-2023.xlsx',
    column: 7,
  },
  {
    key: 'designated-museum-visitors',
    title: '指定施設の入館者数',
    unit: '人',
    year: 2023,
    yearFormat: 'fiscal',
    yearName: '2023年度',
    family: 'museum',
    filename: 'museums-2023.xlsx',
    column: 9,
  },
  {
    key: 'museum-like-facility-visitors',
    title: '博物館類似施設の入館者数',
    unit: '人',
    year: 2023,
    yearFormat: 'fiscal',
    yearName: '2023年度',
    family: 'museum',
    filename: 'similar-museums-2023.xlsx',
    column: 5,
  },
  {
    key: 'elementary-school-gymnasium-count',
    title: '小学校体育館設置箇所数',
    unit: '箇所',
    year: 2024,
    yearFormat: 'calendar',
    yearName: '2024年10月1日現在',
    family: 'gym',
    filename: 'sports-inventory-2024.xlsx',
    column: 6,
  },
  {
    key: 'junior-high-school-gymnasium-count',
    title: '中学校体育館設置箇所数',
    unit: '箇所',
    year: 2024,
    yearFormat: 'calendar',
    yearName: '2024年10月1日現在',
    family: 'gym',
    filename: 'sports-inventory-2024.xlsx',
    column: 7,
  },
];
export const EXPECTED_SOURCES = {
  'public-school-closures-cumulative': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '文部科学省「廃校施設活用状況実態調査」',
    url: 'https://www.mext.go.jp/content/20250331-mxt_sisetujo-000012748_9.pdf',
    config: {
      source: {
        name: '文部科学省「廃校施設活用状況実態調査」',
        url: 'https://www.mext.go.jp/content/20250331-mxt_sisetujo-000012748_9.pdf',
      },
      provenance: {
        url: 'https://www.mext.go.jp/content/20250331-mxt_sisetujo-000012748_9.pdf',
        sourceSha256:
          '467cd6026518774cad3182949d63caf8bd94fd92335a05346f31776408fb790f',
        publicationIndexUrl:
          'https://www.mext.go.jp/a_menu/shotou/zyosei/yoyuu_00002.htm',
        table: '資料2 公立学校の都道府県別廃校発生数',
        valueColumn: 'PDF4ページ 廃校数列',
        dataYear: '2004〜2023年度累計（2024年5月1日把握）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDF4ページをpdftotext -rawと-layoutの2通りで抽出。47県の廃校発生数と3校種内訳を照合。',
        verification:
          '47県一意・整数・全県の3校種合計=総数。全国総数8850、校種別5799/1835/1216と一致。単年度との差分は生成しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'published-survey',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2004-04-01',
        periodEnd: '2024-03-31',
        asOf: '2024-05-01',
        releasedAt: '2025-03-31',
        timeScope: 'cumulative-2004-2023-fiscal',
        pdfPage: 4,
      },
    },
  },
  'registered-museum-visitors': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '社会教育調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
    config: {
      source: {
        name: '社会教育調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
        sourceSha256:
          '368fb0c27c381eb9cab419415ae43e46f50bd1fb80e2ef2533f8024225f50e3d',
        publicationIndexUrl:
          'https://www.mext.go.jp/b_menu/toukei/chousa02/shakai/kekka/k_detail/2024.htm',
        table: '113 博物館の入館者数（都道府県別）',
        valueColumn: '113!G22:G68（登録博物館・入館者総数）',
        dataYear: '2023年度',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの県名列Bを47県と照合し、法的区分別の入館者総数を抽出。設置者別行と所在地別行を混ぜない。',
        verification:
          '47県一意・欠測0・整数・各列47県計=全国。登録+指定=博物館総数、特別展<=総数、設置者別全国計=県別全国計を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'final',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2023-04-01',
        periodEnd: '2024-03-31',
        surveyYear: '2024',
        releasedAt: '2026-03-27',
        governmentStatisticsCode: '00400004',
        sourceUnit: '人',
        definitionUrl:
          'https://www.mext.go.jp/content/20240821-mxt_chousa01-000037636_05.pdf',
        definitionSha256:
          '1386cdccc82de849e0320473f176353588ea3d44fcd522c12936daf70af9feb3',
        definitionPages: [3, 6],
      },
    },
  },
  'designated-museum-visitors': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '社会教育調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
    config: {
      source: {
        name: '社会教育調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439522&fileKind=0',
        sourceSha256:
          '368fb0c27c381eb9cab419415ae43e46f50bd1fb80e2ef2533f8024225f50e3d',
        publicationIndexUrl:
          'https://www.mext.go.jp/b_menu/toukei/chousa02/shakai/kekka/k_detail/2024.htm',
        table: '113 博物館の入館者数（都道府県別）',
        valueColumn: '113!I22:I68（指定施設・入館者総数）',
        dataYear: '2023年度',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの県名列Bを47県と照合し、法的区分別の入館者総数を抽出。設置者別行と所在地別行を混ぜない。',
        verification:
          '47県一意・欠測0・整数・各列47県計=全国。登録+指定=博物館総数、特別展<=総数、設置者別全国計=県別全国計を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'final',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2023-04-01',
        periodEnd: '2024-03-31',
        surveyYear: '2024',
        releasedAt: '2026-03-27',
        governmentStatisticsCode: '00400004',
        sourceUnit: '人',
        definitionUrl:
          'https://www.mext.go.jp/content/20240821-mxt_chousa01-000037636_05.pdf',
        definitionSha256:
          '1386cdccc82de849e0320473f176353588ea3d44fcd522c12936daf70af9feb3',
        definitionPages: [3, 6],
      },
    },
  },
  'museum-like-facility-visitors': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '社会教育調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439550&fileKind=0',
    config: {
      source: {
        name: '社会教育調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439550&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040439550&fileKind=0',
        sourceSha256:
          '6ff3fddfac1905c506864652027fbdf18153233b9afcc1d969f325f400008b14',
        publicationIndexUrl:
          'https://www.mext.go.jp/b_menu/toukei/chousa02/shakai/kekka/k_detail/2024.htm',
        table: '141 博物館類似施設の入館者数（都道府県別）',
        valueColumn: '141!E21:E67（入館者総数）',
        dataYear: '2023年度',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの県名列Bを47県と照合し、法的区分別の入館者総数を抽出。設置者別行と所在地別行を混ぜない。',
        verification:
          '47県一意・欠測0・整数・各列47県計=全国。登録+指定=博物館総数、特別展<=総数、設置者別全国計=県別全国計を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'final',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2023-04-01',
        periodEnd: '2024-03-31',
        surveyYear: '2024',
        releasedAt: '2026-03-27',
        governmentStatisticsCode: '00400004',
        sourceUnit: '人',
        definitionUrl:
          'https://www.mext.go.jp/content/20240821-mxt_chousa01-000037636_05.pdf',
        definitionSha256:
          '1386cdccc82de849e0320473f176353588ea3d44fcd522c12936daf70af9feb3',
        definitionPages: [3, 6],
      },
    },
  },
  'elementary-school-gymnasium-count': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '体育・スポーツ施設現況調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
    config: {
      source: {
        name: '体育・スポーツ施設現況調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
        sourceSha256:
          'e83629d004129b5938aab83496e3dd8cccf6f118c0d0d3e1b37ef5b2f4d0523a',
        publicationIndexUrl:
          'https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/kekka/1368165.htm',
        table: '9 都道府県別・市区町村人口規模別・調査種別設置箇所数 体育館',
        valueColumn: '9!F12:F58（小学校）',
        dataYear: '2024年10月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXシート9の学校施設欄F/Gを取得。学校区分合計E=F+G+H+Iと全国行を検査し、社会体育施設・民間推計値を取り込まない。',
        verification:
          '47県一意・欠測0・整数・全県と全国の学校4区分計が一致。学校区分5列の県計=全国、小学校17820箇所・中学校8995箇所。市町村未回答の注記を保持。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'final',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2024-10-01',
        periodEnd: '2024-10-01',
        releasedAt: '2026-04-30',
        governmentStatisticsCode: '00402101',
        definitionUrl:
          'https://www.mext.go.jp/sports/content/20260501-stiiki-300000983_2.pdf',
        definitionSha256:
          'de26c22c678289764c3ad01be89509104a5d31c507732419378b82af75038214',
        definitionPages: [2, 3, 4],
        sourceUnit: '箇所',
        municipalResponse: {
          received: 1697,
          distributed: 1741,
          percent: 97.5,
        },
      },
    },
  },
  'junior-high-school-gymnasium-count': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '体育・スポーツ施設現況調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
    config: {
      source: {
        name: '体育・スポーツ施設現況調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0',
        sourceSha256:
          'e83629d004129b5938aab83496e3dd8cccf6f118c0d0d3e1b37ef5b2f4d0523a',
        publicationIndexUrl:
          'https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/kekka/1368165.htm',
        table: '9 都道府県別・市区町村人口規模別・調査種別設置箇所数 体育館',
        valueColumn: '9!G12:G58（中学校）',
        dataYear: '2024年10月1日現在',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXシート9の学校施設欄F/Gを取得。学校区分合計E=F+G+H+Iと全国行を検査し、社会体育施設・民間推計値を取り込まない。',
        verification:
          '47県一意・欠測0・整数・全県と全国の学校4区分計が一致。学校区分5列の県計=全国、小学校17820箇所・中学校8995箇所。市町村未回答の注記を保持。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'final',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2024-10-01',
        periodEnd: '2024-10-01',
        releasedAt: '2026-04-30',
        governmentStatisticsCode: '00402101',
        definitionUrl:
          'https://www.mext.go.jp/sports/content/20260501-stiiki-300000983_2.pdf',
        definitionSha256:
          'de26c22c678289764c3ad01be89509104a5d31c507732419378b82af75038214',
        definitionPages: [2, 3, 4],
        sourceUnit: '箇所',
        municipalResponse: {
          received: 1697,
          distributed: 1741,
          percent: 97.5,
        },
      },
    },
  },
};
export const GRADUATION_SOURCE = {
  r2Key: 'app/themes/education-culture/graduation-paths.json',
  period: '2025-03',
  surveyYear: 2025,
  unit: '人',
  title:
    '令和7年度学校基本調査 表283 状況別卒業者数（高等学校・全日制/定時制）',
  url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040393936&fileKind=0',
  sha256: 'e754c347a2498b09ed65a174af40f4e73ead5663743edc5b3a58d5663df80c70',
  releaseStatus: 'final',
  releasedAt: '2025-12-26',
  geography: '卒業した学校の所在地の都道府県（居住地・進学先・就職先ではない）',
  universe:
    '2025年3月卒業の国公私立高等学校（全日制・定時制）。通信制高校・中等教育学校・特別支援学校は含めない。',
  denominator: '同じ表の卒業者総数。不詳・死亡を含めた8区分は排他的。',
  categories: [
    {
      key: 'university',
      label: '大学等進学',
      columns: [4],
    },
    {
      key: 'specialized',
      label: '専修学校専門課程',
      columns: [6],
    },
    {
      key: 'general',
      label: '専修学校一般課程等',
      columns: [7],
    },
    {
      key: 'vocational',
      label: '公共職業能力開発施設等',
      columns: [8],
    },
    {
      key: 'employment',
      label: '就職者等（臨時労働者を除く）',
      columns: [9, 10, 11],
    },
    {
      key: 'temporary',
      label: '臨時労働者',
      columns: [12],
    },
    {
      key: 'other',
      label: '左記以外の者',
      columns: [13],
    },
    {
      key: 'unknown',
      label: '不詳・死亡',
      columns: [14],
    },
  ],
  notes: [
    '大学等進学者は大学・短期大学の通信教育部への進学者も含む。通信制高校の卒業者はこの表の対象外。',
    '進学しながら就職している者は進学区分に1回だけ含め、再掲112人は構成へ加算しない。',
    '就職者等は進学A〜Dを除く。臨時労働者は契約期間1か月未満、有期雇用労働者は1か月以上。',
    '「左記以外の者」は外国の大学等への入学者・家事手伝い等も含むので、失業者数や進学希望断念者数とは呼ばない。',
    'この排他的な就職者等の割合は、再掲就職者を含む公式「卒業者に占める就職者の割合」と定義が異なる。既存2023年就職率とは合算しない。',
  ],
};
export const sha = (v) => createHash('sha256').update(v).digest('hex');
export function assertHash(bytes, expected) {
  assert.equal(sha(bytes), expected, 'source SHA changed');
}
const clean = (v) =>
  String(v ?? '')
    .normalize('NFKC')
    .replace(/\s/g, '');
export function count(v) {
  assert.equal(typeof v, 'number', 'missing/non-numeric count');
  assert.ok(Number.isSafeInteger(v) && v >= 0, 'nonnegative integer count');
  return v;
}
const sum = (v) => v.reduce((a, b) => a + b, 0);
function byName(v) {
  const n = clean(v);
  const p = prefectures.find(
    (p) =>
      clean(p.prefName) === n ||
      clean(p.prefName.replace(/[都府県]$/, '')) === n
  );
  assert.ok(p, 'unknown prefecture ' + n);
  return p.prefCode;
}
function requirePrefectures(rows) {
  assert.equal(rows.length, 47, '47 prefectures');
  assert.equal(
    new Set(rows.map((r) => r.areaCode)).size,
    47,
    'unique prefectures'
  );
  assert.deepEqual(
    rows.map((r) => r.areaCode).sort(),
    prefectures.map((p) => p.prefCode).sort(),
    'prefecture coverage'
  );
}
function pdfText(bytes, raw = false, page) {
  return execFileSync(
    'pdftotext',
    [
      raw ? '-raw' : '-layout',
      ...(page ? ['-f', String(page), '-l', String(page)] : []),
      '-',
      '-',
    ],
    { input: bytes, maxBuffer: 8 * 1024 * 1024 }
  ).toString();
}
export function parseClosed(raw, layout, whole) {
  assert.ok(
    clean(raw).includes(
      '公立学校の都道府県別廃校発生数(平成16年度~令和5年度)'.normalize('NFKC')
    ),
    'closed period/table'
  );
  assert.match(whole, /令和６年５月１日/, 'closed as-of');
  const lines = raw
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const numeric = lines.filter((x) => /^\d+$/.test(x)).map(Number);
  assert.equal(numeric.length, 188, 'closed 4 columns x47');
  const labels = lines.filter((x) => prefectures.some((p) => p.prefName === x));
  assert.equal(labels.length, 47, 'closed labels');
  const rows = labels.map((name, i) => ({
    areaCode: byName(name),
    areaName: name,
    values: [numeric[i], numeric[i + 47], numeric[i + 94], numeric[i + 141]],
  }));
  requirePrefectures(rows);
  for (const r of rows) {
    r.values.forEach(count);
    assert.equal(
      r.values[0],
      sum(r.values.slice(1)),
      'closed school partition'
    );
    const l = layout.split(/\r?\n/).find((l) => l.includes(r.areaName));
    assert.ok(l, 'closed layout name');
    assert.equal(
      Number(l.trim().match(/^\d+/)?.[0]),
      r.values[0],
      'closed layout total'
    );
  }
  const national = [8850, 5799, 1835, 1216];
  for (let c = 0; c < 4; c++)
    assert.equal(
      sum(rows.map((r) => r.values[c])),
      national[c],
      'closed national column ' + c
    );
  assert.match(clean(whole), /小学校5,799/);
  assert.match(clean(whole), /中学校8,8501,835/);
  assert.match(clean(whole), /高等学校等1,216/);
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      countySchoolPartitions: 47,
      nationalColumns: 4,
      layoutCrossCheck: 47,
      period: 'FY2004-FY2023 cumulative; asof2024-05-01',
    },
  };
}
export function parseMuseums(w, similar = false) {
  const s = w.getWorksheet(similar ? '141' : '113');
  assert.ok(s, 'museum table');
  assert.equal(
    s.getCell('A1').value,
    similar
      ? '141　博物館類似施設の入館者数（都道府県別）'
      : '113　博物館の入館者数（都道府県別）',
    'museum title'
  );
  assert.ok(
    s.getRow(3).values.some((v) => v === '（令和5年度間）'),
    'museum activity year'
  );
  const nr = similar ? 20 : 21,
    start = nr + 1,
    last = similar ? 6 : 10;
  assert.equal(s.getCell('B' + nr).value, '全国');
  assert.equal(s.getCell('E4').value, '（人）');
  if (!similar) {
    assert.equal(s.getCell('G5').value, '登録博物館');
    assert.equal(s.getCell('I5').value, '指定施設');
    assert.equal(s.getCell('G6').value, '入館者総数');
  }
  const extract = (r) =>
    Array.from({ length: last - 2 }, (_, i) =>
      count(s.getRow(r).getCell(i + 3).value)
    );
  const national = extract(nr),
    rows = Array.from({ length: 47 }, (_, i) => {
      const r = start + i;
      assert.equal(s.getCell('A' + r).value, '（都道府県別）');
      const name = s.getCell('B' + r).value;
      return { areaCode: byName(name), areaName: name, values: extract(r) };
    });
  requirePrefectures(rows);
  assert.deepEqual(
    extract(similar ? 6 : 7),
    national,
    'museum ownership national vs geography national'
  );
  for (let c = 0; c < national.length; c++)
    assert.equal(
      sum(rows.map((r) => r.values[c])),
      national[c],
      'museum national column ' + c
    );
  for (const r of [...rows, { values: national }]) {
    const v = r.values;
    assert.ok(v[1] <= v[0], 'exhibition facility subset');
    assert.ok(v[3] <= v[2], 'special exhibition visitors subset');
    if (!similar) {
      assert.equal(v[2], v[4] + v[6], 'registered + designated visitors');
      assert.equal(
        v[3],
        v[5] + v[7],
        'registered + designated exhibition visitors'
      );
      assert.ok(v[5] <= v[4]);
      assert.ok(v[7] <= v[6]);
    }
  }
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      nationalColumns: national.length,
      partitionAndSubsetRows: 48,
      activityFiscalYear: 2023,
      surveyYear: 2024,
      release: '2026-03-27 final',
    },
  };
}
export function parseGym(w, reportText) {
  const s = w.getWorksheet('9');
  assert.ok(s);
  assert.equal(s.getCell('A4').value, '体育館');
  assert.equal(s.getCell('F7').value, '小学校');
  assert.equal(s.getCell('G7').value, '中学校');
  assert.equal(s.getCell('E6').value, '学校体育・スポーツ施設');
  const text = clean(reportText);
  for (const token of [
    '令和6年10月1日現在',
    '国立大学法人の附属学校体育施設を除く',
    '1,697',
    '1,741',
    '97.5%',
  ])
    assert.ok(text.includes(token), 'gym official scope ' + token);
  const extract = (r) =>
    Array.from({ length: 5 }, (_, i) =>
      count(s.getRow(r).getCell(i + 5).value)
    );
  const national = extract(10);
  assert.equal(clean(s.getCell('B10').value), '総数');
  const rows = Array.from({ length: 47 }, (_, i) => {
    const r = 12 + i,
      areaCode = byName(s.getCell('B' + r).value);
    return {
      areaCode,
      areaName: prefectures.find((p) => p.prefCode === areaCode).prefName,
      values: extract(r),
    };
  });
  requirePrefectures(rows);
  for (const r of [...rows, { values: national }])
    assert.equal(r.values[0], sum(r.values.slice(1)), 'gym school stages sum');
  for (let c = 0; c < 5; c++)
    assert.equal(
      sum(rows.map((r) => r.values[c])),
      national[c],
      'gym national column ' + c
    );
  assert.equal(national[1], 17820);
  assert.equal(national[2], 8995);
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      schoolStagePartitions: 48,
      nationalColumns: 5,
      asOf: '2024-10-01',
      publicPrivate: true,
      nationalUniversityAttached: false,
      municipalResponse: { received: 1697, distributed: 1741, percent: 97.5 },
      nonresponseImputed: false,
    },
  };
}
export function parseGraduation(w, cross) {
  const sheets = w.worksheets;
  assert.equal(sheets.length, 3, 'graduation sex sheets');
  const s = sheets[0];
  assert.equal(s.name, '283(3-1)');
  assert.match(s.getCell('A1').value, /高等学校（全日制・定時制）/);
  assert.match(s.getCell('A2').value, /283/);
  assert.equal(s.getCell('A9').value, '令和7年3月');
  assert.equal(s.getCell('D5').value, '大学等進学者（A）');
  assert.equal(s.getCell('L7').value, '臨時労働者');
  assert.equal(s.getCell('O7').value, '計（c）');
  const cols = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 22];
  const read = (sheet, r) =>
    Object.fromEntries(
      cols.map((c) => [c, count(sheet.getRow(r).getCell(c).value)])
    );
  const make = (r, areaCode, areaName) => {
    const c = read(s, r);
    const categories = GRADUATION_SOURCE.categories.map((cat) => ({
      key: cat.key,
      count: sum(cat.columns.map((k) => c[k])),
    }));
    assert.equal(
      sum(categories.map((x) => x.count)),
      c[3],
      'graduation exclusive categories'
    );
    assert.equal(c[15], c[16] + c[17], 'overlap subgroup sum');
    assert.ok(c[15] <= c[4] + c[6] + c[7] + c[8], 'overlap subset');
    assert.equal(
      c[22],
      c[9] + c[10] + c[15] + c[18],
      'official employment definition'
    );
    assert.ok(c[18] <= c[11], 'fulltime term workers subset');
    for (const [col, numerator] of [
      [19, 4],
      [20, 5],
      [21, 6],
      [23, 22],
    ])
      assert.ok(
        Math.abs(s.getRow(r).getCell(col).value - (100 * c[numerator]) / c[3]) <
          1e-9,
        'graduation source ratio'
      );
    return {
      areaCode,
      areaName,
      total: c[3],
      categories,
      overlapEmployed: c[15],
      officialEmployed: c[22],
      sourceColumns: c,
    };
  };
  const national = make(9, '00000', '全国'),
    rows = Array.from({ length: 47 }, (_, i) => {
      const r = 13 + i,
        name = s.getCell('B' + r).value;
      assert.equal(s.getCell('A' + r).value, '令和7年3月');
      return make(r, byName(name), name);
    });
  requirePrefectures(rows);
  for (const c of cols)
    assert.equal(
      sum(rows.map((r) => r.sourceColumns[c])),
      national.sourceColumns[c],
      'graduation county/national column ' + c
    );
  for (const r of [9, ...Array.from({ length: 47 }, (_, i) => 13 + i)])
    for (const c of cols)
      assert.equal(
        count(s.getRow(r).getCell(c).value),
        count(sheets[1].getRow(r - 1).getCell(c).value) +
          count(sheets[2].getRow(r - 1).getCell(c).value),
        'graduation sexes total'
      );
  for (const c of cols)
    assert.equal(
      sum([10, 11, 12].map((r) => count(s.getRow(r).getCell(c).value))),
      national.sourceColumns[c],
      'graduation national ownership total'
    );
  assert.equal(cross.worksheets.length, 9);
  for (let i = 0; i < 3; i++)
    assert.equal(
      cross.worksheets[i].getCell('A3').value,
      ['計　国立', '計　公立', '計　私立'][i],
      'cross ownership scope'
    );
  const mapCols = {
    3: 2,
    4: 3,
    5: 18,
    6: 4,
    7: 5,
    8: 6,
    9: 7,
    10: 8,
    11: 9,
    12: 10,
    13: 11,
    14: 12,
    15: 13,
    16: 14,
    17: 15,
    18: 16,
    22: 17,
  };
  for (let i = 0; i < 47; i++)
    for (const c of cols) {
      for (const sheet of cross.worksheets.slice(0, 3))
        assert.equal(
          sheet.getCell('A' + (i + 7)).value,
          rows[i].areaName,
          'cross prefecture'
        );
      assert.equal(
        sum(
          cross.worksheets
            .slice(0, 3)
            .map((sh) => count(sh.getRow(i + 7).getCell(mapCols[c]).value))
        ),
        rows[i].sourceColumns[c],
        'graduation independent ownership table'
      );
    }
  assert.equal(national.total, 929157);
  assert.equal(national.overlapEmployed, 112);
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      exclusiveCategoryCount: 8,
      exclusivePartitions: 48,
      nationalColumns: 17,
      sexIdentities: 48 * 17,
      ownershipCrossTableIdentities: 47 * 17,
      period: '2025-03',
      nationalGraduates: national.total,
      overlapEmployed: 112,
      unknownDeath: national.categories.find((x) => x.key === 'unknown').count,
    },
  };
}
export function validateProfile(p) {
  assert.equal(p?.schemaVersion, 1);
  assert.equal(p.seriesKey, 'graduation-paths');
  assert.equal(p.period, GRADUATION_SOURCE.period);
  assert.equal(p.unit, '人');
  assert.equal(p.releaseStatus, 'final');
  assert.deepEqual(p.source, {
    title: GRADUATION_SOURCE.title,
    url: GRADUATION_SOURCE.url,
    sha256: GRADUATION_SOURCE.sha256,
  });
  requirePrefectures(p.rows);
  assert.equal(p.national.areaCode, '00000');
  assert.equal(p.national.areaName, '全国');
  for (const r of [...p.rows, p.national]) {
    assert.equal(
      r.areaName,
      r.areaCode === '00000'
        ? '全国'
        : prefectures.find((x) => x.prefCode === r.areaCode).prefName
    );
    count(r.total);
    assert.ok(r.total > 0);
    assert.deepEqual(
      r.categories.map((x) => x.key),
      GRADUATION_SOURCE.categories.map((x) => x.key),
      'profile exact category order'
    );
    r.categories.forEach((c) => count(c.count));
    assert.equal(
      sum(r.categories.map((x) => x.count)),
      r.total,
      'profile category sum'
    );
    count(r.overlapEmployed);
    count(r.officialEmployed);
    assert.ok(
      r.overlapEmployed <= sum(r.categories.slice(0, 4).map((x) => x.count))
    );
    assert.ok(r.officialEmployed <= r.total);
  }
  for (const k of ['total', 'overlapEmployed', 'officialEmployed'])
    assert.equal(
      sum(p.rows.map((r) => r[k])),
      p.national[k],
      'profile national ' + k
    );
  for (let i = 0; i < 8; i++)
    assert.equal(
      sum(p.rows.map((r) => r.categories[i].count)),
      p.national.categories[i].count,
      'profile category national'
    );
  assert.equal(p.national.total, 929157);
  assert.equal(p.national.overlapEmployed, 112);
  assert.equal(p.national.officialEmployed, 127501);
  assert.equal(p.national.categories[7].count, 37);
  return p;
}
export function validateConfig(c, f) {
  assert.equal(c?.key, f.key);
  assert.equal(c.isActive, true);
  assert.equal(c.unit, f.unit);
  assert.equal(c.category, 'educationsports');
  assert.deepEqual(c.entities, ['prefecture']);
  assert.deepEqual(c.years, { from: f.year, to: f.year });
  assert.equal(c.yearFormat, f.yearFormat);
  assert.equal(c.display.conversionFactor, 1);
  assert.deepEqual(c.source, EXPECTED_SOURCES[f.key], 'source definition');
}
async function sourceBytes(s, dir) {
  let b;
  const path = resolve(dir, s.filename);
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
  return b;
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/education-core-source'
        ),
      },
      'config-file': { type: 'string' },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/education-core-source.json'
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
  FIELDS.forEach((f) => validateConfig(configs[f.key], f));
  const buffers = new Map();
  for (const s of SOURCES)
    buffers.set(s.filename, await sourceBytes(s, o['source-dir']));
  const workbook = async (filename) => {
    const w = new ExcelJS.Workbook();
    await w.xlsx.load(buffers.get(filename));
    return w;
  };
  const closed = parseClosed(
      pdfText(buffers.get('closed-2024.pdf'), true, 4),
      pdfText(buffers.get('closed-2024.pdf'), false, 4),
      pdfText(buffers.get('closed-2024.pdf'))
    ),
    museum = parseMuseums(await workbook('museums-2023.xlsx')),
    similar = parseMuseums(await workbook('similar-museums-2023.xlsx'), true),
    gym = parseGym(
      await workbook('sports-inventory-2024.xlsx'),
      pdfText(buffers.get('sports-report.pdf'))
    ),
    graduation = parseGraduation(
      await workbook('graduates-summary-2025.xlsx'),
      await workbook('graduates-2025.xlsx')
    );
  const generatedAt = new Date().toISOString(),
    files = [];
  for (const f of FIELDS) {
    const dataset =
      f.family === 'closed'
        ? closed
        : f.family === 'gym'
          ? gym
          : f.filename.startsWith('similar')
            ? similar
            : museum;
    const rows = prefectures.map((p) => {
      const r = dataset.rows.find((x) => x.areaCode === p.prefCode);
      return {
        areaCode: p.prefCode,
        areaName: p.prefName,
        yearCode: String(f.year),
        yearName: f.yearName,
        unit: f.unit,
        value:
          r.values[
            f.family === 'closed'
              ? 0
              : f.family === 'gym'
                ? f.column - 5
                : f.column - 3
          ],
      };
    });
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
      rowCount: 47,
      sha256: sha(content),
      content,
    });
  }
  const drop = ({ sourceColumns, ...r }) => r;
  const profile = validateProfile({
    schemaVersion: 1,
    seriesKey: 'graduation-paths',
    period: GRADUATION_SOURCE.period,
    unit: '人',
    releaseStatus: 'final',
    generatedAt,
    source: {
      title: GRADUATION_SOURCE.title,
      url: GRADUATION_SOURCE.url,
      sha256: GRADUATION_SOURCE.sha256,
    },
    rows: graduation.rows.map(drop),
    national: drop(graduation.national),
  });
  const content = JSON.stringify(profile);
  files.push({
    key: GRADUATION_SOURCE.r2Key,
    rowCount: 48,
    sha256: sha(content),
    content,
  });
  if (o['write-local'])
    for (const f of files) {
      const path = resolve(root, '.local/r2', f.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, f.content);
    }
  const report = {
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    generatedAt,
    sources: SOURCES,
    checks: {
      closed: closed.checks,
      museum: museum.checks,
      similar: similar.checks,
      gym: gym.checks,
      graduation: graduation.checks,
    },
    records: {
      closed: closed.rows,
      museum: museum.rows,
      similar: similar.rows,
      gym: gym.rows,
      graduation: graduation.rows,
    },
    national: {
      closed: closed.national,
      museum: museum.national,
      similar: similar.national,
      gym: gym.national,
      graduation: graduation.national,
    },
    files: files.map(({ content, ...f }) => f),
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: report.status,
      metricCount: FIELDS.length,
      canonicalRows: 282,
      profileRows: 48,
      files: report.files,
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
