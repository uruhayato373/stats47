#!/usr/bin/env node
/** Official care, medical, cancer and adult-steps sources; only --write-local stages R2. */
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
const { parse: csvParse } = require('csv-parse/sync');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const {
  parseStatsValuesPayload,
} = require('../../../packages/stats-r2/src/schemas.ts');
const {
  PHYSICAL_ACTIVITY_SOURCE: physical,
} = require('../../../packages/data-configs/src/theme-catalog/physical-activity-source.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const SOURCES = [
  {
    filename: 'care-certified-2024.xlsx',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040491597&fileKind=0',
    sha256: '53f7bce6e434d816f7dbd2d522d271c1a02d3bb2b6005b39c787eed2a0b55ceb',
    bytes: 80771,
  },
  {
    filename: 'medical-hospitals-2023.csv',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
    sha256: 'f64ac3aac5b75a64f0c396738072ff6b2d62abbce0aadb2e120ba9be719de132',
    bytes: 34487,
  },
  {
    filename: 'medical-clinics-2023.csv',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222878&fileKind=1',
    sha256: '4c7805c90d635f0dd579db8b9e5a54ba46fdadb8cbc295748140d9062bad0d70',
    bytes: 47406,
  },
  {
    filename: 'cancer-2023.pdf',
    url: 'https://www.mhlw.go.jp/content/001727987.pdf',
    sha256: '19afa920dc56782f66cc017f7b82cf8cb05154f4b4697f456209443a0562ebb2',
    bytes: 2877173,
  },
  {
    filename: 'care-overview-2024.pdf',
    url: 'https://www.mhlw.go.jp/topics/kaigo/osirase/jigyo/24/dl/r06_gaiyou.pdf',
    sha256: 'd51f44155e9b4d5fda2cf487bed03e3f73c49dd34155f5c2d4c6eef482ae8b17',
    bytes: 1605496,
  },
  {
    filename: 'nutrition2024.pdf',
    sha256: 'ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1',
    bytes: 488504,
    url: 'https://www.mhlw.go.jp/content/001675215.pdf',
  },
  {
    filename: 'nutrition-overview.pdf',
    sha256: 'f9062112308938b88e542656e872c0912ebe1e11750f583c1872d60f427c5643',
    bytes: 1572046,
    url: 'https://www.mhlw.go.jp/content/001675210.pdf',
  },
  {
    filename: 'nutrition-errata.pdf',
    sha256: '0c1b2b64c63ebb3e273fc4f396a994fee8689bb0c1dbfa8e5c3f377bf7f2f60b',
    bytes: 98582,
    url: 'https://www.mhlw.go.jp/content/001745757.pdf',
  },
];
export const FIELDS = [
  {
    key: 'long-term-care-certified-persons',
    title: '要支援・要介護認定者数',
    unit: '人',
    year: 2024,
    yearFormat: 'fiscal',
    yearName: '2024年度末（2025年3月31日）',
    family: 'care',
    column: 7,
  },
  {
    key: 'home-medical-visit-cases',
    title: '訪問診療の実施件数',
    unit: '件',
    year: 2023,
    yearFormat: 'calendar',
    yearName: '2023年9月',
    family: 'home',
    column: 1,
  },
  {
    key: 'home-nursing-visit-cases',
    title: '訪問看護・指導の実施件数',
    unit: '件',
    year: 2023,
    yearFormat: 'calendar',
    yearName: '2023年9月',
    family: 'home',
    column: 3,
  },
  {
    key: 'new-cancer-incidence-count',
    title: '新たに診断されたがんの罹患数',
    unit: '例',
    year: 2023,
    yearFormat: 'calendar',
    yearName: '2023年',
    family: 'cancer',
    column: 2,
  },
  {
    key: 'daily-steps-male-20to64-age-adjusted',
    title: '男性の歩数（20〜64歳・年齢調整値）',
    unit: '歩/日',
    year: 2024,
    yearFormat: 'calendar',
    yearName: '2024年10〜11月調査',
    family: 'steps',
    column: 0,
  },
  {
    key: 'daily-steps-female-20to64-age-adjusted',
    title: '女性の歩数（20〜64歳・年齢調整値）',
    unit: '歩/日',
    year: 2024,
    yearFormat: 'calendar',
    yearName: '2024年10〜11月調査',
    family: 'steps',
    column: 1,
  },
];
export const EXPECTED_SOURCES = {
  'long-term-care-certified-persons': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '介護保険事業状況報告',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040491597&fileKind=0',
    config: {
      source: {
        name: '介護保険事業状況報告',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040491597&fileKind=0',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040491597&fileKind=0',
        sourceSha256:
          '53f7bce6e434d816f7dbd2d522d271c1a02d3bb2b6005b39c787eed2a0b55ceb',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/topics/kaigo/osirase/jigyo/24/index.html',
        table: '第4-1-1表 都道府県別 要介護（要支援）認定者数 男女計 総数',
        valueColumn: '04-1-1T①!I6:I52（全国I53）',
        dataYear: '2024年度末（2025年3月31日）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '全47県・欠測0。7認定区分の合計を144行、総数=第1号+第2号を384セル、全国計24列で確認。全国総数7207487人。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450351',
        sourceUnit: '人',
        asOf: '2025-03-31',
        geography: '保険者報告の都道府県別集計',
        denominator: null,
        definitionUrl:
          'https://www.mhlw.go.jp/topics/kaigo/osirase/jigyo/24/dl/r06_gaiyou.pdf',
        definitionSha256:
          'd51f44155e9b4d5fda2cf487bed03e3f73c49dd34155f5c2d4c6eef482ae8b17',
      },
    },
  },
  'home-medical-visit-cases': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '医療施設調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
    config: {
      source: {
        name: '医療施設調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
        sourceSha256:
          'f64ac3aac5b75a64f0c396738072ff6b2d62abbce0aadb2e120ba9be719de132',
        publicationIndexUrl: 'https://www.mhlw.go.jp/toukei/list/79-1.html',
        table: '都道府県編第68表（病院）＋第107表（一般診療所）',
        valueColumn:
          '両CSV総数ブロック・在宅患者訪問診療の実施件数列（0起算列6）',
        dataYear: '2023年9月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '両原表の施設数/実施件数各2サービスを47県・全国8列照合。病院と一般診療所は別種の医療施設。実施件数の月次注記を固定。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450021',
        sourceUnit: '件',
        periodStart: '2023-09-01',
        periodEnd: '2023-09-30',
        timeScope: 'one-month',
        surveyAsOf: '2023-10-01',
        geography: '医療施設所在地の都道府県',
        denominator: null,
        secondSourceUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222878&fileKind=1',
        secondSourceSha256:
          '4c7805c90d635f0dd579db8b9e5a54ba46fdadb8cbc295748140d9062bad0d70',
        providerAggregation:
          '病院＋一般診療所。総数ブロックのみ、再掲地域・病院種別・病床別を重複加算しない。',
      },
    },
  },
  'home-nursing-visit-cases': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '医療施設調査',
    url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
    config: {
      source: {
        name: '医療施設調査',
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
      },
      provenance: {
        url: 'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222839&fileKind=1',
        sourceSha256:
          'f64ac3aac5b75a64f0c396738072ff6b2d62abbce0aadb2e120ba9be719de132',
        publicationIndexUrl: 'https://www.mhlw.go.jp/toukei/list/79-1.html',
        table: '都道府県編第68表（病院）＋第107表（一般診療所）',
        valueColumn:
          '両CSV総数ブロック・在宅患者訪問看護・指導の実施件数列（0起算列12）',
        dataYear: '2023年9月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '両原表の施設数/実施件数各2サービスを47県・全国8列照合。病院と一般診療所は別種の医療施設。実施件数の月次注記を固定。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450021',
        sourceUnit: '件',
        periodStart: '2023-09-01',
        periodEnd: '2023-09-30',
        timeScope: 'one-month',
        surveyAsOf: '2023-10-01',
        geography: '医療施設所在地の都道府県',
        denominator: null,
        secondSourceUrl:
          'https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040222878&fileKind=1',
        secondSourceSha256:
          '4c7805c90d635f0dd579db8b9e5a54ba46fdadb8cbc295748140d9062bad0d70',
        providerAggregation:
          '病院＋一般診療所。総数ブロックのみ、再掲地域・病院種別・病床別を重複加算しない。',
      },
    },
  },
  'new-cancer-incidence-count': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '全国がん登録',
    url: 'https://www.mhlw.go.jp/content/001727987.pdf',
    config: {
      source: {
        name: '全国がん登録',
        url: 'https://www.mhlw.go.jp/content/001727987.pdf',
      },
      provenance: {
        url: 'https://www.mhlw.go.jp/content/001727987.pdf',
        sourceSha256:
          '19afa920dc56782f66cc017f7b82cf8cb05154f4b4697f456209443a0562ebb2',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/gan/gan_toroku.html',
        table: '表21 A 全部位 C00-C96 都道府県別・性別',
        valueColumn: 'PDF71頁（印刷59頁）罹患数・総数列',
        dataYear: '2023年',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '47県欠測0、男556059＋女437406＋性別不詳4=全国993469。47県の性別別・総数が全国と一致。外国748/住所不詳142は別行として除外。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450173',
        sourceUnit: '例',
        periodStart: '2023-01-01',
        periodEnd: '2023-12-31',
        geography: '診断時住所の都道府県',
        denominator: null,
        pdfPage: 71,
        printedPage: 59,
        definitionPages: [18, 19, 23],
        classification: 'ICD-10 C00-C96、上皮内新生物D00-D09除外',
      },
    },
  },
  'daily-steps-male-20to64-age-adjusted': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '国民健康・栄養調査',
    url: 'https://www.mhlw.go.jp/content/001675215.pdf',
    config: {
      source: {
        name: '国民健康・栄養調査',
        url: 'https://www.mhlw.go.jp/content/001675215.pdf',
      },
      provenance: {
        url: 'https://www.mhlw.go.jp/content/001675215.pdf',
        sourceSha256:
          'ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html',
        table: '第69表 歩数の平均値（20〜64歳・性・都道府県別、年齢調整値）',
        valueColumn: 'PDF5頁 男性の平均値列（人数・95%CIは専用snapshotへ保持）',
        dataYear: '2024年10〜11月調査',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '47県欠測0。男女別の人数/平均/95%CIを抽出。CI下限<=平均<=上限、人数47県計=男性3365女性4032。全国平均は男性8564/女性7291の公式行を保持、県平均から計算しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450171',
        sourceUnit: '歩/日',
        pdfPage: 5,
        ageAdjustment: '20〜64歳・男女とも46歳に調整',
        profileKey: 'app/themes/sports-participation/physical-activity.json',
        definitionUrl: 'https://www.mhlw.go.jp/content/001675210.pdf',
        definitionSha256:
          'f9062112308938b88e542656e872c0912ebe1e11750f583c1872d60f427c5643',
        denominator:
          '第69表20〜64歳男女別の当該指標集計人数（調整人口ではない）',
      },
    },
  },
  'daily-steps-female-20to64-age-adjusted': {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '国民健康・栄養調査',
    url: 'https://www.mhlw.go.jp/content/001675215.pdf',
    config: {
      source: {
        name: '国民健康・栄養調査',
        url: 'https://www.mhlw.go.jp/content/001675215.pdf',
      },
      provenance: {
        url: 'https://www.mhlw.go.jp/content/001675215.pdf',
        sourceSha256:
          'ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html',
        table: '第69表 歩数の平均値（20〜64歳・性・都道府県別、年齢調整値）',
        valueColumn: 'PDF5頁 女性の平均値列（人数・95%CIは専用snapshotへ保持）',
        dataYear: '2024年10〜11月調査',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '47県欠測0。男女別の人数/平均/95%CIを抽出。CI下限<=平均<=上限、人数47県計=男性3365女性4032。全国平均は男性8564/女性7291の公式行を保持、県平均から計算しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450171',
        sourceUnit: '歩/日',
        pdfPage: 5,
        ageAdjustment: '20〜64歳・男女とも46歳に調整',
        profileKey: 'app/themes/sports-participation/physical-activity.json',
        definitionUrl: 'https://www.mhlw.go.jp/content/001675210.pdf',
        definitionSha256:
          'f9062112308938b88e542656e872c0912ebe1e11750f583c1872d60f427c5643',
        denominator:
          '第69表20〜64歳男女別の当該指標集計人数（調整人口ではない）',
      },
    },
  },
};
export const sha = (value) => createHash('sha256').update(value).digest('hex');
export function assertHash(bytes, expected) {
  assert.equal(sha(bytes), expected, 'official source SHA-256');
}
const clean = (value) => String(value ?? '').replace(/\s/g, '');
const sum = (values) => values.reduce((a, b) => a + b, 0);
export function count(value) {
  if (typeof value === 'string') {
    assert.match(
      value,
      /^\d+(?:,\d{3})*$/,
      'numeric count, no missing-symbol coercion'
    );
    value = Number(value.replaceAll(',', ''));
  }
  assert.ok(
    Number.isSafeInteger(value) && value >= 0,
    'nonnegative safe integer'
  );
  return value;
}
function byName(value) {
  const name = clean(value);
  const p = prefectures.find(
    (p) => p.prefName === name || p.prefName.replace(/[都府県]$/, '') === name
  );
  assert.ok(p, 'known prefecture ' + name);
  return { areaCode: p.prefCode, areaName: p.prefName };
}
function requirePrefectures(rows) {
  assert.equal(rows.length, 47, '47 prefectures');
  assert.deepEqual(
    rows.map((r) => r.areaCode).sort(),
    prefectures.map((p) => p.prefCode).sort(),
    'unique prefectures'
  );
  for (const r of rows)
    assert.deepEqual(byName(r.areaName), {
      areaCode: r.areaCode,
      areaName: r.areaName,
    });
}
export function pdfText(bytes, page) {
  return execFileSync(
    'pdftotext',
    [
      '-layout',
      ...(page ? ['-f', String(page), '-l', String(page)] : []),
      '-',
      '-',
    ],
    { input: bytes, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 }
  );
}
export function parseCare(workbook, overview) {
  assert.match(
    clean(overview),
    /令和６年度末現在（令和7年3月末/,
    'fiscal-end date'
  );
  const groups = ['①', '②', '⑨'].map((suffix, index) => {
    const sheet = workbook.getWorksheet('04-1-1T' + suffix);
    assert.ok(sheet, 'care sheet');
    assert.match(
      clean(sheet.getCell('A1').text),
      /都道府県別要介護（要支援）認定者数/
    );
    assert.match(sheet.getCell('A1').text, /男女計/);
    assert.match(sheet.getCell('I3').text, /単位：人/);
    const header = clean(sheet.getCell('B4').text);
    assert.ok(
      header.includes(
        index === 0 ? '総数' : index === 1 ? '第１号被保険者' : '第２号被保険者'
      ),
      'insured group'
    );
    assert.deepEqual(
      Array.from({ length: 8 }, (_, i) => clean(sheet.getCell(5, i + 2).text)),
      [
        '要支援１',
        '要支援２',
        '要介護１',
        '要介護２',
        '要介護３',
        '要介護４',
        '要介護５',
        '合計',
      ]
    );
    const extract = (r) =>
      Array.from({ length: 8 }, (_, c) => count(sheet.getCell(r, c + 2).value));
    const national = extract(53);
    assert.equal(clean(sheet.getCell('A53').text), '全国計');
    const rows = Array.from({ length: 47 }, (_, i) => ({
      ...byName(sheet.getCell(i + 6, 1).text),
      values: extract(i + 6),
    }));
    requirePrefectures(rows);
    for (const r of [...rows, { values: national }])
      assert.equal(
        sum(r.values.slice(0, 7)),
        r.values[7],
        'care level partition'
      );
    for (let c = 0; c < 8; c++)
      assert.equal(
        sum(rows.map((r) => r.values[c])),
        national[c],
        'care national ' + c
      );
    return { rows, national };
  });
  for (let r = 0; r < 48; r++)
    for (let c = 0; c < 8; c++) {
      const v = groups.map((g) =>
        r === 47 ? g.national[c] : g.rows[r].values[c]
      );
      assert.equal(v[0], v[1] + v[2], 'first + second insured');
    }
  assert.deepEqual(
    groups.map((g) => g.national[7]),
    [7207487, 7075896, 131591]
  );
  return {
    ...groups[0],
    checks: {
      prefectures: 47,
      missing: 0,
      levelPartitionRows: 144,
      insuredPartitionCells: 384,
      nationalColumns: 24,
      asOf: '2025-03-31',
      yearFormat: 'fiscal',
    },
  };
}
export function decodeCsv(bytes) {
  return csvParse(new TextDecoder('shift_jis', { fatal: true }).decode(bytes), {
    relax_column_count: true,
  });
}
export function parseMedicalTable(a, provider) {
  assert.equal(a[0][0], '令和５年');
  assert.equal(a[0][1], '医療施設調査');
  assert.equal(a[0][2], '令和５（２０２３）年１０月１日');
  assert.ok(
    a[1][0].includes(provider === 'hospital' ? '第６８表' : '第１０７表'),
    'medical table'
  );
  assert.equal(a[2][0], '注：「実施件数」は令和５年９月中の数である。');
  assert.equal(a[3][2], '医療保険等による');
  assert.equal(a[3][21], '介護保険による');
  assert.equal(a[4][5], '在宅患者訪問診療');
  assert.equal(a[4][11], '在宅患者訪問看護・指導');
  assert.equal(a[4][13], '精神科在宅患者訪問看護・指導');
  assert.equal(a[7][0], '総数');
  assert.equal(clean(a[8][0]), '全国');
  const cols = [5, 6, 11, 12];
  assert.deepEqual(
    cols.map((c) => a[5][c]),
    ['施設数', '実施件数', '施設数', '実施件数']
  );
  const values = (r) => cols.map((c) => count(a[r][c]));
  const national = values(8),
    rows = Array.from({ length: 47 }, (_, i) => ({
      ...byName(a[i + 9][0]),
      values: values(i + 9),
    }));
  requirePrefectures(rows);
  for (let c = 0; c < 4; c++)
    assert.equal(
      sum(rows.map((r) => r.values[c])),
      national[c],
      'medical national ' + c
    );
  for (const r of [...rows, { values: national }]) {
    assert.ok(r.values[0] <= r.values[1], 'visit facilities <= cases');
    assert.ok(r.values[2] <= r.values[3], 'nursing facilities <= cases');
  }
  assert.deepEqual(
    national,
    provider === 'hospital'
      ? [2904, 237601, 685, 35301]
      : [18906, 1498229, 2433, 68882]
  );
  return { rows, national };
}
export function combineMedical(h, c) {
  requirePrefectures(h.rows);
  requirePrefectures(c.rows);
  return {
    rows: h.rows.map((r) => {
      const other = c.rows.find((x) => x.areaCode === r.areaCode);
      return { ...r, values: r.values.map((v, i) => v + other.values[i]) };
    }),
    national: h.national.map((v, i) => v + c.national[i]),
    checks: {
      prefectures: 47,
      missing: 0,
      nationalColumns: 8,
      period: '2023-09',
      providers: 'hospital + general clinic',
      medicalInsuranceOnly: true,
      facilityLocation: true,
      countsNotUniqueUsers: true,
    },
  };
}
export function parseCancer(page, whole) {
  const flat = clean(page);
  for (const token of [
    '表21',
    'A．全部位C00-C96',
    '2023年',
    '*1総数は男女および性別不詳の合計',
    '*2全国は北海道～沖縄の合計',
  ])
    assert.ok(flat.includes(token), 'cancer table ' + token);
  for (const token of [
    '診断時住所',
    '2023年1月1日',
    '2024年12月31日',
    'IARC,Lyon,2004',
    '同一腫瘍',
  ])
    assert.ok(clean(whole).includes(token), 'cancer definition ' + token);
  const all = [];
  for (const line of page.split('\n')) {
    if (!/100\.0\s+100\.0\s+100\.0/.test(line)) continue;
    const m = line
      .split('100.0')[0]
      .match(/^\s*(.*?)\s+(\d[\d,]*)\s+(\d[\d,]*)\s+(\d[\d,]*)\s*$/);
    assert.ok(m, 'cancer count columns');
    const name = clean(m[1]).replace('*2', ''),
      values = m.slice(2, 5).map(count);
    const unknown = values[2] - values[0] - values[1];
    count(unknown);
    all.push({ name, values, unknown });
  }
  assert.equal(all.length, 50, '47 prefectures + national + foreign + unknown');
  assert.equal(all[0].name, '全国');
  assert.equal(all[48].name, '外国');
  assert.equal(all[49].name, '不詳');
  const rows = all
    .slice(1, 48)
    .map((r) => ({
      ...byName(r.name),
      values: r.values,
      sexUnknown: r.unknown,
    }));
  requirePrefectures(rows);
  const national = all[0].values;
  assert.deepEqual(national, [556059, 437406, 993469]);
  for (let c = 0; c < 3; c++)
    assert.equal(
      sum(rows.map((r) => r.values[c])),
      national[c],
      'cancer national ' + c
    );
  assert.equal(sum(rows.map((r) => r.sexUnknown)), 4, 'cancer sex unknown');
  assert.deepEqual(
    rows.filter((r) => r.sexUnknown).map((r) => [r.areaCode, r.sexUnknown]),
    [
      ['11000', 1],
      ['12000', 1],
      ['18000', 1],
      ['27000', 1],
    ]
  );
  assert.deepEqual(
    all.slice(48).map((r) => r.values),
    [
      [408, 340, 748],
      [116, 26, 142],
    ]
  );
  return {
    rows,
    national,
    checks: {
      prefectures: 47,
      missing: 0,
      nationalColumns: 4,
      sexUnknown: 4,
      excludedForeign: 748,
      excludedUnknownResidence: 142,
      pdfPage: 71,
      printedPage: 59,
      caseCountNotPeople: true,
    },
  };
}
export function validateProfile(p) {
  assert.equal(p.schemaVersion, 1);
  assert.match(p.generatedAt, /^\d{4}-\d\d-\d\dT/);
  assert.ok(Number.isFinite(Date.parse(p.generatedAt)));
  assert.equal(p.rows.length, 94);
  assert.equal(p.national.length, 2);
  assert.deepEqual(p.notes, [...physical.notes]);
  assert.deepEqual(
    Object.keys(p).sort(),
    ['schemaVersion', 'generatedAt', 'rows', 'national', 'notes'].sort()
  );
  const seen = new Set();
  for (const [rows, isNational] of [
    [p.rows, false],
    [p.national, true],
  ])
    for (const r of rows) {
      assert.deepEqual(
        Object.keys(r).sort(),
        [
          'areaCode',
          'areaName',
          'metricKey',
          'mean',
          'lower95',
          'upper95',
          'sampleSize',
          'period',
          'ageAdjustment',
          'source',
        ].sort()
      );
      const metric = physical.metrics.find((m) => m.key === r.metricKey);
      assert.ok(metric);
      const key = r.areaCode + '/' + r.metricKey;
      assert.ok(!seen.has(key), 'duplicate profile point');
      seen.add(key);
      if (isNational) {
        assert.equal(r.areaCode, '00000');
        assert.equal(r.areaName, '全国');
        for (const k of ['mean', 'lower95', 'upper95', 'sampleSize'])
          assert.equal(r[k], metric.national[k], 'official national ' + k);
      } else
        assert.deepEqual(byName(r.areaName), {
          areaCode: r.areaCode,
          areaName: r.areaName,
        });
      assert.equal(r.period, physical.period);
      assert.equal(r.ageAdjustment, physical.ageAdjustment);
      assert.deepEqual(r.source, {
        title: physical.title,
        url: physical.url,
        sha256: physical.sha256,
        table: metric.table,
        pdfPage: metric.pdfPage,
      });
      for (const k of ['mean', 'lower95', 'upper95', 'sampleSize']) count(r[k]);
      assert.ok(r.sampleSize > 0);
      assert.ok(
        r.lower95 <= r.mean && r.mean <= r.upper95,
        'confidence interval order'
      );
    }
  for (const metric of physical.metrics) {
    const rows = p.rows.filter((r) => r.metricKey === metric.key);
    requirePrefectures(rows);
    assert.equal(
      sum(rows.map((r) => r.sampleSize)),
      metric.national.sampleSize,
      'steps sample-size sum'
    );
  }
  return p;
}
export function parseSteps(page, overview, errata) {
  const flat = clean(page);
  for (const token of [
    '第69表',
    '歩数の平均値',
    '20〜64歳',
    '男女とも46歳',
    '（歩/日）',
  ])
    assert.ok(flat.includes(token), 'steps header ' + token);
  for (const token of [
    '473',
    '能登半島地震',
    '三次元加速度センサー式歩数計',
    '令和６年10〜11月中',
  ])
    assert.ok(clean(overview).includes(token), 'steps definition ' + token);
  assert.ok(
    clean(errata).includes('第22表'),
    'known correction applies to table22'
  );
  const rows = [],
    national = [];
  for (const line of page.split('\n')) {
    const tokens = line.trim().split(/\s+/);
    const name = tokens.shift();
    if (name !== '全国' && !prefectures.some((p) => p.prefName === name))
      continue;
    assert.equal(tokens.length, 8, 'steps n mean lower upper x2');
    const values = tokens.map(count);
    physical.metrics.forEach((m, index) => {
      const [sampleSize, mean, lower95, upper95] = values.slice(
        index * 4,
        index * 4 + 4
      );
      const r = {
        ...(name === '全国'
          ? { areaCode: '00000', areaName: '全国' }
          : byName(name)),
        metricKey: m.key,
        mean,
        lower95,
        upper95,
        sampleSize,
        period: physical.period,
        ageAdjustment: physical.ageAdjustment,
        source: {
          title: physical.title,
          url: physical.url,
          sha256: physical.sha256,
          table: m.table,
          pdfPage: m.pdfPage,
        },
      };
      (name === '全国' ? national : rows).push(r);
    });
  }
  return validateProfile({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    rows,
    national,
    notes: [...physical.notes],
  });
}
export function validateConfig(c, f) {
  assert.equal(c?.key, f.key);
  assert.equal(c.isActive, true);
  assert.equal(c.unit, f.unit);
  assert.equal(c.category, 'socialsecurity');
  assert.deepEqual(c.entities, ['prefecture']);
  assert.deepEqual(c.years, { from: f.year, to: f.year });
  assert.equal(c.yearFormat, f.yearFormat);
  assert.equal(c.display.conversionFactor, 1);
  assert.equal(c.display.decimalPlaces, 0);
  assert.deepEqual(c.source, EXPECTED_SOURCES[f.key], 'source definition');
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
  return b;
}
export async function main() {
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(root, '.local/verification/themes/healthcare-core-source'),
      },
      'config-file': { type: 'string' },
      'profile-file': { type: 'string' },
      out: {
        type: 'string',
        default: resolve(root, '.local/verification/themes/healthcare-core-source.json'),
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
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(b.get('care-certified-2024.xlsx'));
  const care = parseCare(workbook, pdfText(b.get('care-overview-2024.pdf')));
  const h = parseMedicalTable(
      decodeCsv(b.get('medical-hospitals-2023.csv')),
      'hospital'
    ),
    c = parseMedicalTable(
      decodeCsv(b.get('medical-clinics-2023.csv')),
      'clinic'
    );
  const home = combineMedical(h, c),
    cancer = parseCancer(
      pdfText(b.get('cancer-2023.pdf'), 71),
      pdfText(b.get('cancer-2023.pdf'))
    );
  const steps = parseSteps(
    pdfText(b.get('nutrition2024.pdf'), 5),
    pdfText(b.get('nutrition-overview.pdf')),
    pdfText(b.get('nutrition-errata.pdf'))
  );
  if (o['profile-file']) {
    const p = validateProfile(
      JSON.parse(await readFile(o['profile-file'], 'utf8'))
    );
    assert.deepEqual(
      { ...p, generatedAt: steps.generatedAt },
      steps,
      'profile must match pinned raw source'
    );
  }
  const datasets = { care, home, cancer },
    generatedAt = new Date().toISOString(),
    files = [];
  for (const f of FIELDS) {
    const rows = prefectures.map((p) => ({
      areaCode: p.prefCode,
      areaName: p.prefName,
      yearCode: String(f.year),
      yearName: f.yearName,
      unit: f.unit,
      value:
        f.family === 'steps'
          ? steps.rows.find(
              (r) => r.areaCode === p.prefCode && r.metricKey === f.key
            ).mean
          : datasets[f.family].rows.find((r) => r.areaCode === p.prefCode)
              .values[f.column],
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
      rowCount: 47,
      sha256: sha(content),
      content,
    });
  }
  const profileContent = JSON.stringify(steps);
  files.push({
    key: physical.r2Key,
    rowCount: 96,
    sha256: sha(profileContent),
    content: profileContent,
  });
  if (o['write-local'])
    for (const f of files) {
      const path = resolve(root, '.local/r2', f.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, f.content);
    }
  const proof = {
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    writeLocal: o['write-local'],
    seriesCount: 6,
    canonicalRows: 282,
    profileRows: 96,
    sources: SOURCES,
    checks: {
      care: care.checks,
      home: home.checks,
      cancer: cancer.checks,
      steps: {
        prefectures: 47,
        rows: 94,
        nationalRows: 2,
        missing: 0,
        sampleSizes: [3365, 4032],
        ageAdjustment: physical.ageAdjustment,
        sourceRoundTrip: true,
      },
    },
    files: files.map(({ content, ...f }) => f),
    payloadSha256: sha(profileContent),
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(o.out, JSON.stringify(proof, null, 2));
  console.log(JSON.stringify(proof, null, 2));
  return proof;
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
