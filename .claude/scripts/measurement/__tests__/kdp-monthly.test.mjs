import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import { expectedKdpRoyaltyMonth, kdpMonthlyVaultKey, archivedKdpMonthlyReport, parseKdpMonthlyReport, collectKdpMonthlyReport } from '../kdp-monthly-reports.mjs';
import { validateAttempt, consumerPath } from '../consumer-paths.mjs';
import { measurementHealth } from '../health.mjs';

const listings = { 'K-S1-01': { author: 'stats47', asin: null, previousEditions: [{ author: 'stats47', asin: 'B000000001' }] } };
function fixture() {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('電子書籍のロイヤリティ').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '注文数', '払い戻し数', '実質注文数', 'ロイヤリティの種類', 'コンテンツ区分', '通貨', '平均希望小売価格 (税別)', '平均販売価格 (税別)', '平均ファイルサイズ（MB）', '平均配信コスト', 'ロイヤリティ'],
    ['stats book', 'stats47', 'B000000001', 'Amazon.co.jp', 2, 0, 2, '35%', '標準', 'JPY', 100, 100, 1.46, '該当なし', 70],
    ['foreign book', 'another-site', 'B000000002', 'Amazon.co.jp', 10, 0, 10, '70%', '標準', 'JPY', 100, 100, 1, 1, 700],
  ]);
  workbook.addWorksheet('既読 KENPC').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '既読 KENP (Kindle Edition Normalized Pages)', 'ロイヤリティ', '通貨'],
    ['stats book', 'stats47', 'B000000001', 'Amazon.co.jp', 10, 3.004217196, 'JPY'],
  ]);
  return workbook;
}

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

test('monthly collection and private archive are required before success; old daily success is insufficient', () => {
  const code = readFileSync('.claude/scripts/measurement/marketplace-status.mjs', 'utf8');
  assert.ok(code.indexOf('monthlyRoyalties = await collectKdpMonthlyReport') < code.indexOf('markMeasurementAuthenticated(source)'));
  const collector = readFileSync('.claude/scripts/measurement/collect.mjs', 'utf8');
  assert.ok(collector.indexOf('await writeVault(kdpMonthlyVaultKey(') < collector.indexOf("result.status = 'pass'"));
  assert.match(collector, /capture\(monthlyPath\)/);
  assert.throws(() => validateAttempt({ source: 'kdp', status: 'pass', capability: 'publication-and-daily-sales', observedAt: new Date().toISOString() }, Date.now(), 'kdp'), /capability_mismatch/);
  assert.equal(consumerPath('kdp', '.local/authenticated-measurement/kdp-123/status.monthly.xlsx'), null);
  assert.equal(measurementHealth(null).sources.find(s => s.source === 'kdp').remaining, 'payout_and_net_profit_not_collected');
  assert.doesNotMatch(readFileSync('.claude/scripts/measurement/summarize.mjs', 'utf8'), /finalized_royalties_not_collected|確定ロイヤリティ・入金は未取得/);
});

test('historical restore rejects an overwritten slot or a corrupt original and returns only the scoped report', () => {
  const bytes = Buffer.from('fixture workbook');
  const report = { ...parseKdpMonthlyReport(fixture(), listings, '2026-08'), artifact: { sha256: createHash('sha256').update(bytes).digest('hex') } };
  const archive = { source: 'kdp', report, workbook: bytes.toString('base64') };
  assert.equal(archivedKdpMonthlyReport(archive, '2026-08'), report);
  assert.throws(() => archivedKdpMonthlyReport(archive, '2024-08'), /monthly_archive_mismatch/);
  assert.throws(() => archivedKdpMonthlyReport({ ...archive, workbook: 'Y29ycnVwdA==' }, '2026-08'), /monthly_archive_mismatch/);
  assert.throws(() => archivedKdpMonthlyReport({ ...archive, report: { ...report, scope: 'account-total' } }, '2026-08'), /monthly_archive_mismatch/);
  const restore = readFileSync('.claude/scripts/measurement/restore.mjs', 'utf8');
  assert.match(restore, /monthly_restore_kdp_only/);
  assert.match(restore, /kdp-monthly-\$\{month\}\.json/);
});
