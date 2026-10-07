import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import { expectedKdpRoyaltyMonth, kdpMonthlyVaultKey, archivedKdpMonthlyReport, parseKdpMonthlyReport, collectKdpMonthlyReport } from '../kdp-monthly-reports.mjs';
import { validateAttempt, consumerPath } from '../consumer-paths.mjs';
import { measurementHealth } from '../health.mjs';
import { SOURCES } from '../sources.mjs';
import { kdpMonthlyObservations, validateSalesLedger } from '../../../../packages/product-factory/src/sales/ledger-core.mjs';

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
  const vaultWrite = collector.indexOf('await writeVault(vaultKey, {');
  assert.ok(vaultWrite > 0 && collector.indexOf('const vaultKey = kdpMonthlyVaultKey(') < vaultWrite);
  assert.ok(vaultWrite < collector.indexOf("result.status = 'pass'"));
  // 販売台帳の候補は保管庫へ書けた後にだけ作る (証拠の参照先が実在しない行を作らない)
  const ledgerCandidates = collector.indexOf('kdpMonthlyObservations(monthly, { vaultKey');
  assert.ok(vaultWrite < ledgerCandidates && ledgerCandidates < collector.indexOf("result.status = 'pass'"));
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

// KDP-LEDGER-AUTO-01: 月次レポート → 販売台帳。8 月の実データと同じ形 (旧版 ASIN の K-S1-02 が 1 行 ¥254)
const ledgerListings = { 'K-S1-02': { author: 'stats47', asin: 'B0HKF4NLDV', previousEditions: [{ author: 'stats47', asin: 'B0HF1N51T8' }] } };
const manualAugust = { id: '223344e97e9b72ad496f', channel: 'kdp', productId: 'K-S1-02', periodStart: '2026-08-01', periodEnd: '2026-08-31',
  orders: 1, units: 1, netRevenueYen: 254, refunds: 0, evidencePath: '.local/product-sales-evidence/kdp/kdp-monthly-2026-08.json',
  evidenceSha256: '819ad765457036c000a496b60f1daf1a6419ee2cdb637dfde36ff703cf99a275', recordedAt: '2026-10-07T21:57:23.008Z' };
function augustWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet('電子書籍のロイヤリティ').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '注文数', '払い戻し数', '実質注文数', 'ロイヤリティの種類', 'コンテンツ区分', '通貨', '平均希望小売価格 (税別)', '平均販売価格 (税別)', '平均ファイルサイズ（MB）', '平均配信コスト', 'ロイヤリティ'],
    ['stats book', 'stats47', 'B0HF1N51T8', 'Amazon.co.jp', 1, 0, 1, '70%', '標準', 'JPY', 500, 500, 1.2, 4, 254],
    ['foreign book', 'another-site', 'B000000002', 'Amazon.co.jp', 10, 0, 10, '70%', '標準', 'JPY', 100, 100, 1, 1, 700],
  ]);
  workbook.addWorksheet('既読 KENPC').addRows([
    ['販売期間', '8月 2026'],
    ['タイトル', '著者', 'ASIN', 'マーケットプレイス', '既読 KENP (Kindle Edition Normalized Pages)', 'ロイヤリティ', '通貨'],
    ['foreign book', 'another-site', 'B000000002', 'Amazon.co.jp', 99, 40, 'JPY'],
  ]);
  return workbook;
}
const augustLedger = () => {
  const report = parseKdpMonthlyReport(augustWorkbook(), ledgerListings, '2026-08');
  const vaultKey = kdpMonthlyVaultKey('2026-08');
  return { report, vaultKey, ...kdpMonthlyObservations(report, { vaultKey, recordedAt: '2026-10-08T00:00:00.000Z' }) };
};

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

test('record job adds monthly KDP rows once, keeps manual rows, and flags conflicts without overwriting', () => {
  const temp = mkdtempSync(join(tmpdir(), 'stats47-kdp-ledger-'));
  const script = resolve('.claude/scripts/measurement/summarize.mjs');
  const env = { ...process.env, GITHUB_RUN_ID: 'ledger-run', GITHUB_RUN_ATTEMPT: '1' };
  try {
    const input = join(temp, 'input'); mkdirSync(input); mkdirSync(join(temp, 'data/products'), { recursive: true });
    const ledgerPath = join(temp, 'data/products/sales-ledger.json');
    const writeArtifact = salesLedger => writeFileSync(join(input, 'kdp-1.json'), JSON.stringify({ source: 'kdp', capability: SOURCES.kdp.capability,
      status: 'pass', metricsAvailable: true, observedAt: new Date().toISOString(), runId: 'ledger-run', runAttempt: 1,
      quality: { monthlyPeriod: '2026-08', salesLedger } }));
    const run = () => {
      execFileSync(process.execPath, [script, input], { cwd: temp, env });
      return { ledger: JSON.parse(readFileSync(ledgerPath, 'utf8')), state: JSON.parse(readFileSync(join(temp, 'data/authenticated/latest.json'), 'utf8')) };
    };
    const { vaultKey, observations, excluded } = augustLedger();
    writeArtifact({ month: '2026-08', vaultKey, observations, excluded });

    writeFileSync(ledgerPath, JSON.stringify({ schemaVersion: 1, observations: [] }));
    const first = run();
    assert.equal(first.ledger.observations.length, 1);
    assert.equal(first.ledger.observations[0].evidencePath, `vault:${vaultKey}`);
    assert.deepEqual({ ...first.state.salesLedger, conflicts: first.state.salesLedger.conflicts.length },
      { status: 'pass', month: '2026-08', added: 1, skipped: 0, conflicts: 0, excluded: [] });
    const bytes = readFileSync(ledgerPath, 'utf8');
    const second = run();
    assert.equal(readFileSync(ledgerPath, 'utf8'), bytes);
    assert.equal(second.state.salesLedger.added, 0);
    assert.equal(second.state.salesLedger.skipped, 1);

    // 手入力済みの 8 月行は残し、自動の行を足さない
    writeFileSync(ledgerPath, JSON.stringify({ schemaVersion: 1, observations: [manualAugust] }));
    const manual = run();
    assert.deepEqual(manual.ledger.observations, [manualAugust]);
    assert.equal(manual.state.salesLedger.status, 'pass');

    // 数値の食い違いは上書きせず、要対応 (alert) にする
    writeArtifact({ month: '2026-08', vaultKey, observations: [{ ...observations[0], netRevenueYen: 300 }], excluded });
    const conflict = run();
    assert.deepEqual(conflict.ledger.observations, [manualAugust]);
    assert.equal(conflict.state.salesLedger.status, 'conflict');
    assert.equal(conflict.state.status, 'action_required');
    assert.match(readFileSync('/tmp/authenticated-measurement-summary.md', 'utf8'), /食い違い 1 件/);

    // 保管庫を指さない候補は受け付けない
    writeArtifact({ month: '2026-08', vaultKey, observations: [{ ...observations[0], evidencePath: manualAugust.evidencePath }], excluded });
    const rejected = run();
    assert.deepEqual(rejected.ledger.observations, [manualAugust]);
    assert.equal(rejected.state.salesLedger.status, 'failed');
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('authenticated workflow commits the sales ledger written by the record job', () => {
  const workflow = readFileSync('.github/workflows/authenticated-measurement.yml', 'utf8');
  assert.match(workflow, /git add data\/authenticated\/latest\.json data\/authenticated\/revenue-history\.json data\/products\/sales-ledger\.json/);
});
