// KDP の月次の部品 (packages/ops/src/measurement) と、.claude に残る計測の CLI (marketplace-status・collect・restore・summarize) の配線を確かめる基盤のテスト。
// 部品のテストは packages へ移したが、CLI の本文と起動は .claude にあるのでここで確かめる (SCRIPTS-TO-PACKAGES-02)。
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { archivedKdpMonthlyReport, parseKdpMonthlyReport } from '../../../../packages/ops/src/measurement/kdp-monthly-reports.mjs';
import { validateAttempt, consumerPath } from '../../../../packages/ops/src/measurement/consumer-paths.mjs';
import { measurementHealth } from '../../../../packages/ops/src/measurement/health.mjs';
import { SOURCES } from '../../../../packages/ops/src/measurement/sources.mjs';
import { listings, fixture, manualAugust, augustLedger } from '../../../../packages/ops/src/measurement/__tests__/kdp-fixtures.mjs';

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
    const { vaultKey, observations, excluded, coverage } = augustLedger();
    // 数えた書籍の範囲も一緒に書く (行の無い書籍を 0 で埋めずに「計測済み」と読むため)
    assert.deepEqual(coverage.productIds, ['K-S1-02']);
    writeArtifact({ month: '2026-08', vaultKey, observations, excluded, coverage });

    writeFileSync(ledgerPath, JSON.stringify({ schemaVersion: 1, observations: [] }));
    const first = run();
    assert.equal(first.ledger.observations.length, 1);
    assert.equal(first.ledger.observations[0].evidencePath, `vault:${vaultKey}`);
    assert.deepEqual({ ...first.state.salesLedger, conflicts: first.state.salesLedger.conflicts.length },
      { status: 'pass', month: '2026-08', added: 1, skipped: 0, conflicts: 0, excluded: [], coverageAdded: true });
    assert.deepEqual(first.ledger.coverage.map(range => [range.periodStart, range.periodEnd, range.productIds, range.evidencePath]),
      [['2026-08-01', '2026-08-31', ['K-S1-02'], `vault:${vaultKey}`]]);
    const bytes = readFileSync(ledgerPath, 'utf8');
    const second = run();
    assert.equal(readFileSync(ledgerPath, 'utf8'), bytes);
    assert.equal(second.state.salesLedger.added, 0);
    assert.equal(second.state.salesLedger.skipped, 1);
    assert.equal(second.state.salesLedger.coverageAdded, false);

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

