#!/usr/bin/env node
/** Fixed original workbook -> public profile. Never estimates suppressed prefectures. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const require = createRequire(resolve(root, 'package.json'));
const ExcelJS = require('exceljs');
const prefs = require('./packages/area/src/data/prefectures.json');
const {
  FACTORY_INVESTMENT_SOURCE: source,
} = require('./packages/data-configs/src/theme-catalog/factory-investment-source.ts');
const {
  factoryInvestmentSnapshotSchema,
} = require('./apps/web/src/features/factory-investment/lib/factory-investment-snapshot.ts');
const sha = (body) => createHash('sha256').update(body).digest('hex');

export function parseFactoryWorkbook(workbook) {
  const sheet = workbook.getWorksheet('14'),
    industries = workbook.getWorksheet('13');
  assert.ok(sheet && industries, 'prefecture and industry sheets');
  assert.equal(
    sheet.getCell('A1').text,
    '第14表　設備投資額 （都道府県別） ［平成17年～令和6年］'
  );
  assert.equal(sheet.getCell('W2').text, '(百万円)');
  assert.equal(sheet.getCell('W3').text, '6年');
  assert.equal(sheet.getCell('B4').text, '全国合計');
  assert.equal(sheet.getCell('D52').text, '研究所を含まない。');
  assert.equal(sheet.getCell('W4').value, source.national);
  assert.equal(industries.getCell('W4').value, source.national);
  const rows = prefs.map((pref, i) => {
    const line = i + 5;
    assert.equal(
      sheet.getCell(`A${line}`).text,
      pref.prefCode.slice(0, 2),
      'source prefecture code'
    );
    const shortName =
      pref.prefName === '北海道' ? pref.prefName : pref.prefName.slice(0, -1);
    assert.equal(
      sheet.getCell(`B${line}`).text,
      shortName,
      'source prefecture name'
    );
    const raw = sheet.getCell(`W${line}`).value;
    const suppressed = source.suppressedCodes.includes(pref.prefCode);
    if (suppressed)
      assert.equal(raw, 'X', 'original suppression must remain X');
    else
      assert.ok(
        typeof raw === 'number' && Number.isFinite(raw) && raw >= 0,
        'published value must be finite and nonnegative'
      );
    return {
      areaCode: pref.prefCode,
      areaName: pref.prefName,
      value: suppressed ? null : raw,
      status: suppressed ? 'suppressed' : 'published',
    };
  });
  return factoryInvestmentSnapshotSchema.parse({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    period: source.period,
    unit: source.unit,
    source: { title: source.title, url: source.url, sha256: source.sha256 },
    national: source.national,
    rows,
    notes: source.notes,
  });
}

async function main() {
  const { values: options } = parseArgs({
    options: {
      'source-dir': {
        type: 'string',
        default: '.local/verification/themes/factory-investment-source',
      },
      'local-r2-root': { type: 'string', default: '.local/r2' },
      out: {
        type: 'string',
        default: '.local/verification/themes/factory-investment-source.json',
      },
      'write-local': { type: 'boolean', default: false },
    },
  });
  const bytes = await readFile(
    resolve(root, options['source-dir'], 'factory-2024-source.bin')
  );
  assert.equal(sha(bytes), source.sha256, 'original workbook SHA256');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  const profile = parseFactoryWorkbook(workbook);
  const body = Buffer.from(JSON.stringify(profile, null, 2) + '\n');
  if (options['write-local']) {
    const destination = resolve(root, options['local-r2-root'], source.r2Key);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, body);
  }
  const proof = {
    status: 'PASS',
    generatedAt: new Date().toISOString(),
    writeLocal: options['write-local'],
    sourceSha256: source.sha256,
    prefectures: 47,
    publishedPrefectures: 44,
    suppressedPrefectures: source.suppressedCodes,
    national: source.national,
    crossTableNationalChecks: 1,
    sourceCellChecks: 47,
    files: [{ key: source.r2Key, sha256: sha(body), bytes: body.length }],
    limits: [
      '2024 confirmed source; 2025 source could not be downloaded',
      'No reconstruction of suppressed values',
      'National aggregate is official, not the sum of the published prefectures',
    ],
  };
  const out = resolve(root, options.out);
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify(proof, null, 2) + '\n');
  console.log(JSON.stringify(proof));
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  await main();
