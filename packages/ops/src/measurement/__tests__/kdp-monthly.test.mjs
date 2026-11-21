import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import { expectedKdpRoyaltyMonth, kdpMonthlyVaultKey, archivedKdpMonthlyReport, parseKdpMonthlyReport, collectKdpMonthlyReport } from '../kdp-monthly-reports.mjs';
import { kdpBookIdsPublishedBy } from '../kdp-reports.mjs';
import { validateAttempt, consumerPath } from '../consumer-paths.mjs';
import { measurementHealth } from '../health.mjs';
import { SOURCES } from '../sources.mjs';
import { kdpMonthlyObservations, validateSalesLedger } from '../../../../product-factory/src/sales/ledger-core.mjs';
import { listings, fixture, ledgerListings, manualAugust, augustWorkbook, augustLedger } from './kdp-fixtures.mjs';

test('monthly report scopes prior editions, preserves KU precision, and separates currencies', () => {
  const workbook = fixture();
  workbook.getWorksheet('既読 KENPC').addRow(['stats book', 'stats47', 'B000000001', 'Amazon.com', 1, 0.001, 'USD']);
  const report = parseKdpMonthlyReport(workbook, listings, '2026-08');
  assert.equal(report.finality, 'finalized-monthly-royalty');
  assert.equal(report.records.length, 3);
  assert.equal(report.coverage.excludedRows, 1);
  assert.equal(report.coverage.zeroFilled, false);
  assert.deepEqual(report.totals.map(t => [t.currency, t.ebookRoyalty, t.kenpRoyalty]), [['JPY', 70, 3.004217196], ['USD', 0, 0.001]]);
  assert.equal(report.period.end, '2026-08-31');
  assert.ok(report.records.every(r => r.id === 'K-S1-01'));
  assert.equal(Object.hasOwn(report, 'netRevenueYen'), false);
});

test('monthly coverage leaves out books published after the period end and keeps replaced editions', () => {
  const edition = (asin, publishedAt) => ({ author: 'stats47', asin, publishedAt });
  const coverageOf = (month, book) => {
    const wb = fixture();
    if (month !== '2026-08') for (const name of ['電子書籍のロイヤリティ', '既読 KENPC']) wb.getWorksheet(name).getCell('B1').value = '9月 2026';
    return parseKdpMonthlyReport(wb, {
      // 差し替え版: 現行版は 9 月発売でも、前の版が 8 月に売っているので 8 月の範囲に入る
      'K-S1-01': { ...edition('B000000009', '2026-09-20'), previousEditions: [edition('B000000001', '2026-08-13')] },
      // 発売日の無い書籍は従来どおり外さない
      'K-S1-02': { author: 'stats47', asin: 'B000000003' },
      // 台帳へ後から足された新刊
      'K-S1-13': edition('B000000013', '2026-11-04'),
      // ASIN の無い書籍は数えない
      'K-S1-14': { author: 'stats47', asin: null, publishedAt: '2026-11-13' },
    }, month).coverage.mappedBookIds;
  };
  assert.deepEqual(coverageOf('2026-08'), ['K-S1-01', 'K-S1-02']);
  assert.deepEqual(coverageOf('2026-09'), ['K-S1-01', 'K-S1-02']);
  assert.equal(coverageOf('2026-08').includes('K-S1-13'), false);
  assert.deepEqual(kdpBookIdsPublishedBy({ 'K-S1-13': edition('B000000013', '2026-11-04') }, '2026-11-30'), ['K-S1-13']);
  assert.deepEqual(kdpBookIdsPublishedBy({ 'K-S1-13': edition('B000000013', '2026-11-04') }, '2026-11-03'), []);
});

test('monthly report validates periods, shapes, ownership, duplicate rows, and money', () => {
  const cases = [
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('B1').value = '9月 2026', /monthly_period/],
    [w => w.getWorksheet('既読 KENPC').getCell('B1').value = '7月 2026', /monthly_period/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('B2').value = '著者名', /monthly_columns/],
    [w => w.removeWorksheet('既読 KENPC'), /monthly_sheets/],
    [w => w.addWorksheet('新しいボーナス'), /monthly_sheets/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('C3').value = 'B000000099', /unmapped_stats47_asin/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('B3').value = 'another-site', /account_mismatch/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('J3').value = '円', /monthly_identity/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('O3').value = 'N/A', /monthly_number/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('G3').value = 3, /monthly_units/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('E3').value = 1.5, /monthly_number/],
    [w => w.getWorksheet('電子書籍のロイヤリティ').getCell('H3').value = 'new rate', /monthly_transaction/],
    [w => w.getWorksheet('既読 KENPC').getCell('E3').value = -1, /monthly_number/],
    [w => w.getWorksheet('既読 KENPC').getCell('F3').value = { formula: '1+1', result: 2 }, /monthly_cells/],
    [w => w.getWorksheet('既読 KENPC').getCell('F3').value = null, /monthly_cells/],
    [w => { const s = w.getWorksheet('既読 KENPC'); s.addRow(s.getRow(3).values); }, /duplicate_row/],
  ];
  for (const [mutate, error] of cases) {
    const workbook = fixture(); mutate(workbook);
    assert.throws(() => parseKdpMonthlyReport(workbook, listings, '2026-08'), error);
  }
  assert.throws(() => parseKdpMonthlyReport(fixture(), listings, '2026-13'), /invalid_month/);
});

test('refund-only observations remain signed and empty files do not synthesize book rows', () => {
  const workbook = fixture(), sheet = workbook.getWorksheet('電子書籍のロイヤリティ');
  sheet.getCell('E3').value = 0; sheet.getCell('F3').value = 1; sheet.getCell('G3').value = -1; sheet.getCell('O3').value = -35;
  assert.equal(parseKdpMonthlyReport(workbook, listings, '2026-08').records[0].netUnits, -1);
  const headersOnly = new ExcelJS.Workbook();
  for (const s of workbook.worksheets) headersOnly.addWorksheet(s.name).addRows([s.getRow(1).values, s.getRow(2).values]);
  const empty = parseKdpMonthlyReport(headersOnly, listings, '2026-08');
  assert.deepEqual(empty.records, []); assert.deepEqual(empty.totals, []);
});

test('release month uses JST boundaries and historical slots are bounded to 24 months', () => {
  assert.equal(expectedKdpRoyaltyMonth(new Date('2026-09-14T14:59:59Z')), '2026-07');
  assert.equal(expectedKdpRoyaltyMonth(new Date('2026-09-14T15:00:00Z')), '2026-08');
  assert.equal(expectedKdpRoyaltyMonth(new Date('2026-01-05T00:00:00Z')), '2025-11');
  assert.equal(expectedKdpRoyaltyMonth(new Date('2026-01-20T00:00:00Z')), '2025-12');
  const slots = Array.from({ length: 36 }, (_, n) => kdpMonthlyVaultKey(new Date(Date.UTC(2025, n, 1)).toISOString().slice(0, 7)));
  assert.equal(new Set(slots).size, 24);
  assert.equal(slots[0], slots[24]);
  assert.throws(() => kdpMonthlyVaultKey('2026-00'), /invalid_month/);
});

test('download requires selected month, finalized UI, matching filename and parsed workbook', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'stats47-kdp-monthly-test-'));
  let unavailable = false, wrongName = false;
  const clicks = [], ready = [];
  const locator = (role, { name } = {}) => ({
    click: async () => { clicks.push(String(name)); },
    waitFor: async () => { ready.push(String(name)); },
    count: async () => unavailable ? 1 : 0,
    getByRole: locator,
  });
  const page = { getByRole: locator, waitForEvent: async event => {
    assert.equal(event, 'download');
    return { suggestedFilename: () => `KDP_Prior_Month_Royalties-${wrongName ? '2026-07' : '2026-08'}-01-fixture.xlsx`,
      saveAs: path => fixture().xlsx.writeFile(path) };
  } };
  try {
    const report = await collectKdpMonthlyReport(page, listings, join(dir, 'report.xlsx'), new Date('2026-09-21T00:00:00Z'));
    assert.equal(report.records.length, 2);
    assert.match(report.artifact.sha256, /^[a-f0-9]{64}$/);
    assert.ok(clicks.includes('2026年8月'));
    assert.ok(ready.includes('2026年8月 月を選択') && ready.includes('総収益'));
    wrongName = true;
    await assert.rejects(collectKdpMonthlyReport(page, listings, join(dir, 'report.xlsx'), new Date('2026-09-21T00:00:00Z')), /monthly_filename/);
    unavailable = true;
    await assert.rejects(collectKdpMonthlyReport(page, listings, join(dir, 'report.xlsx'), new Date('2026-09-21T00:00:00Z')), /monthly_not_finalized/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('August-like monthly report yields exactly one K-S1-02 observation and drops other accounts', () => {
  const { report, vaultKey, observations, excluded } = augustLedger();
  assert.equal(report.coverage.excludedRows, 2);
  assert.deepEqual(excluded, []);
  assert.equal(observations.length, 1);
  assert.deepEqual({ ...observations[0], id: undefined, evidenceSha256: undefined }, { id: undefined, channel: 'kdp', productId: 'K-S1-02',
    periodStart: '2026-08-01', periodEnd: '2026-08-31', orders: 1, units: 1, netRevenueYen: 254, refunds: 0,
    evidencePath: `vault:${vaultKey}`, evidenceSha256: undefined, recordedAt: '2026-10-08T00:00:00.000Z' });
  assert.doesNotMatch(JSON.stringify(observations), /B000000002|another-site|foreign/);
  // 保管庫キーの ring (24 か月) は全スロットが台帳の検証を通る
  for (let n = 0; n < 24; n++) {
    const month = new Date(Date.UTC(2026, n, 1)).toISOString().slice(0, 7);
    assert.doesNotThrow(() => validateSalesLedger({ schemaVersion: 1, observations: [{ ...observations[0], evidencePath: `vault:${kdpMonthlyVaultKey(month)}` }] }));
  }
});

test('the Mac collection commits the sales ledger written by the summary', () => {
  const workflow = readFileSync('scripts/scheduled/measurement-collect-local.sh', 'utf8');
  assert.match(workflow, /git add data\/authenticated\/latest\.json data\/authenticated\/revenue-history\.json data\/products\/sales-ledger\.json/);
});
