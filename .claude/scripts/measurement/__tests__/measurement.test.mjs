import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';
import { SOURCES, scopedState, sourceFor, failureCode, selectSessionBundle } from '../sources.mjs';
import { encrypt, decrypt, BUCKET } from '../vault.mjs';
import { consumerPath, validateAttempt } from '../consumer-paths.mjs';
import { measurementHealth } from '../health.mjs';
import { parseCoconalaAnalytics, validateCoconalaCoverage } from '../report-parsers.mjs';
import ExcelJS from 'exceljs';
import { kdpAsinMap, parseKdpReport } from '../kdp-reports.mjs';
import { openCoverageReason } from '../../gsc/export-coverage-playwright.mjs';

test('GSC validates ZIP contents, expected categories, row counts and site ownership', () => {
  execFileSync('python3', ['.claude/scripts/gsc/__tests__/test_ingest_gsc_export.py']);
});

test('GSC expands paginated reasons and never swallows a failed detail click', async () => {
  let failedClick = false, checkedUrl = false;
  const calls = [];
  const page = {
    locator(selector) {
      assert.equal(selector, '[role="option"][data-value="25"]:visible');
      calls.push('visible-option');
      return { click: async () => {} };
    },
    getByRole(role) {
      calls.push(role);
      const locator = { first: () => locator, getByRole: child => { calls.push(child); return locator; },
        click: async () => { if (role === 'cell' && failedClick) throw new Error('hidden reason'); },
        waitFor: async () => {} };
      return locator;
    },
    async waitForURL(predicate) {
      checkedUrl = true;
      assert.equal(predicate(new URL('https://search.google.com/search-console/index?resource_id=sc-domain%3Astats47.jp')), false);
      assert.equal(predicate(new URL('https://search.google.com/search-console/index/drilldown?resource_id=sc-domain%3Adoboku-note.com&item_key=test')), false);
      assert.equal(predicate(new URL('https://search.google.com/search-console/index/drilldown?resource_id=sc-domain%3Astats47.jp&item_key=test')), true);
    },
  };
  await openCoverageReason(page, '検出 - インデックス未登録');
  assert.deepEqual(calls, ['listbox', 'visible-option', 'cell', 'heading']);
  assert.equal(checkedUrl, true);
  checkedUrl = false; failedClick = true;
  await assert.rejects(openCoverageReason(page, '検出 - インデックス未登録'), /hidden reason/);
  assert.equal(checkedUrl, false);
});

test('native Google session export preserves the OS keychain and original profile', () => {
  const code = readFileSync('.claude/scripts/measurement/bootstrap-session.mjs', 'utf8');
  assert.match(code, /mkdtempSync/);
  assert.match(code, /cpSync\(profile, temporaryProfile/);
  assert.match(code, /launchPersistentContext\(temporaryProfile \?\? profile/);
  assert.match(code, /ignoreDefaultArgs: \['--password-store=basic', '--use-mock-keychain'\]/);
  assert.match(code, /const nativeProfile = sourceName === 'gsc';/);
  assert.match(code, /google_login_requires_native_chrome/);
  assert.doesNotMatch(code, /AutomationControlled|--enable-automation|navigator\.webdriver/);
  assert.match(code, /reports_requires_kdp_login/);
});

test('a later refresh from an old login cannot overwrite a new human login', () => {
  const seed = { capturedAt: '2026-09-21T02:18:49Z', state: 'new-login' };
  const legacy = { capturedAt: '2026-09-21T02:30:00Z', state: 'old-login' };
  assert.equal(selectSessionBundle(seed, legacy).state, 'new-login');
  const oldGeneration = { ...legacy, bootstrapCapturedAt: '2026-09-20T00:00:00Z' };
  assert.equal(selectSessionBundle(seed, oldGeneration).state, 'new-login');
  const sameGeneration = { ...legacy, bootstrapCapturedAt: seed.capturedAt, state: 'valid-refresh' };
  assert.equal(selectSessionBundle(seed, sameGeneration).state, 'valid-refresh');
  assert.equal(selectSessionBundle(seed, null).bootstrapCapturedAt, seed.capturedAt);
  assert.equal(selectSessionBundle(null, sameGeneration).state, 'valid-refresh');
  assert.equal(selectSessionBundle(null, null), null);
});

function kdpFixture() {
  const book = new ExcelJS.Workbook();
  book.addWorksheet('確定済み注文').addRows([
    ['日付', 'タイトル', '著者名', 'ASIN', 'マーケットプレイス', '有料ダウンロード数', '無料ダウンロード数'],
    ['2026-09-20', '統計', 'stats47', 'B0HF17SQ9N', 'Amazon.co.jp', 2, 0],
    ['2026-09-20', '他サイト', 'doboku-note', 'B0H8HW139T', 'Amazon.co.jp', 100, 0],
  ]);
  book.addWorksheet('既読 KENPC').addRows([
    ['日付', 'タイトル', '著者名', 'ASIN', 'マーケットプレイス', '既読 KENP (Kindle Edition Normalized Pages)'],
    ['2026-09-20', '統計', 'stats47', 'B0HF17SQ9N', 'Amazon.co.jp', 12],
  ]);
  book.addWorksheet('電子書籍のロイヤリティ').addRows([
    ['ロイヤリティ発生日', 'タイトル', '著者名', 'ASIN', 'マーケットプレイス', 'ロイヤリティの種類', 'コンテンツ区分', '注文数', '払い戻し数', '実質注文数', '平均希望小売価格 (税別)', '平均販売価格 (税別)', '平均ファイルサイズ（MB）', '平均配信コスト', 'ロイヤリティ', '通貨'],
    ['2026-09-20', '統計', 'stats47', 'B0HF17SQ9N', 'Amazon.co.jp', '70%', '電子書籍', 2, 0, 2, 100, 100, 1, 1, 140, 'JPY'],
  ]);
  return book;
}
const kdpListings = { 'K-S1-01': { author: 'stats47', asin: null, previousEditions: [{ author: 'stats47', asin: 'B0HF17SQ9N' }] } };
test('KDP scopes old editions by exact ASIN and never adds shared-account totals', () => {
  const report = parseKdpReport(kdpFixture(), kdpListings, '2026-09-20');
  assert.equal(report.records.find(r=>r.kind==='processed-orders').paid, 2);
  assert.equal(report.records.find(r=>r.kind==='kenp').pages, 12);
  assert.equal(report.coverage.excludedRows, 1);
  assert.equal(report.finality, 'provisional');
  assert.equal(report.period.basis, 'marketplace-local-date');
  assert.equal(consumerPath('kdp', '.local/authenticated-measurement/kdp-123/status.xlsx'), null);
  assert.equal(consumerPath('kdp', '.local/authenticated-measurement/kdp-123/status.json'), '.local/authenticated-measurement/restored/kdp.json');
});
test('KDP rejects malformed, wrong-day, unmapped, duplicate and foreign observations', () => {
  for (const mutate of [
    w => w.removeWorksheet('既読 KENPC'),
    w => { w.getWorksheet('確定済み注文').getRow(1).getCell(6).value = '新列'; },
    w => { w.getWorksheet('確定済み注文').getRow(2).getCell(1).value = '2026-09-19'; },
    w => { w.getWorksheet('確定済み注文').getRow(2).getCell(4).value = 'B0HF17SQ9X'; },
    w => { w.getWorksheet('確定済み注文').getRow(2).getCell(3).value = 'doboku-note'; },
    w => { w.getWorksheet('確定済み注文').getRow(2).getCell(6).value = ''; },
    w => { const s=w.getWorksheet('確定済み注文');s.addRow(s.getRow(2).values); },
  ]) {
    const w = kdpFixture(); mutate(w);
    assert.throws(()=>parseKdpReport(w,kdpListings,'2026-09-20'));
  }
  assert.throws(()=>kdpAsinMap({ ...kdpListings, other: { author:'stats47',asin:'B0HF17SQ9N' } }));
});

test('moshimo human login opens the same home as the collector', () => {
  const config = JSON.parse(readFileSync(resolve('.claude/config/affiliate-asp.json'), 'utf8')).asps.moshimo;
  const bootstrap = readFileSync(resolve('.claude/scripts/measurement/bootstrap-session.mjs'), 'utf8');
  assert.ok(bootstrap.includes(`moshimo: '${config.baseUrl}${config.homePath}'`));
});

test('session export strips other services and rejects lookalike hosts', () => {
  const state = scopedState('note', { cookies: [
    { domain: '.note.com', name: 'auth', value: 'secret' },
    { domain: 'note.com.evil.example', name: 'auth', value: 'wrong' },
    { domain: '.google.com', name: 'auth', value: 'other' },
  ], origins: [{ origin: 'https://note.com', localStorage: [] }, { origin: 'https://google.com', localStorage: [] }] });
  assert.equal(state.cookies.length, 1);
  assert.equal(state.origins.length, 1);
  assert.throws(() => scopedState('note', { cookies: [], origins: [] }), /session_missing/);
  assert.throws(() => sourceFor('__proto__'), /unknown_source/);
});

test('private evidence is authenticated and bound to its object address', () => {
  assert.equal(BUCKET, 'stats47-private');
  const key = randomBytes(32), body = Buffer.from('sensitive report');
  const sealed = encrypt(body, key, 'note/session');
  assert.equal(sealed.includes(body), false);
  assert.deepEqual(decrypt(sealed, key, 'note/session'), body);
  assert.throws(() => decrypt(sealed, key, 'a8/session'));
  assert.throws(() => decrypt(sealed, randomBytes(32), 'note/session'));
  sealed[sealed.length - 1] ^= 1;
  assert.throws(() => decrypt(sealed, key, 'note/session'));
});

test('public failure codes cannot contain raw authentication diagnostics', () => {
  assert.equal(failureCode('auth_required cookie=private'), 'auth_required');
  assert.equal(failureCode('account_mismatch name=private'), 'account_mismatch');
  assert.equal(failureCode('AccessDenied secret=private'), 'storage_error');
  assert.equal(failureCode('HTML with private details'), 'collection_failed');
  assert.equal(failureCode('report_incomplete'), 'report_incomplete');
});

test('restore permits canonical reports only and rejects failed, stale or future attempts', () => {
  assert.equal(consumerPath('note', '.local/authenticated-measurement/note-123/note/latest.json'), '.claude/state/metrics/note/dashboard/latest.json');
  for (const path of ['../../.env.local', '.local/authenticated-measurement/note-123/state.json', '.local/authenticated-measurement/note-123/note/../../note/latest.json']) assert.equal(consumerPath('note', path), null);
  assert.equal(consumerPath('moshimo', '.claude/state/metrics/affiliate/a8-results.json'), null);
  const now = Date.parse('2026-09-21T00:00:00Z');
  validateAttempt({status:'pass',observedAt:'2026-09-20T00:00:00Z'},now);
  const gsc = { source: 'gsc', capability: SOURCES.gsc.capability, status: 'pass', observedAt: '2026-09-20T00:00:00Z' };
  validateAttempt(gsc, now, 'gsc');
  assert.throws(() => validateAttempt({ ...gsc, capability: 'coverage-export' }, now, 'gsc'), /capability_mismatch/);
  assert.throws(() => validateAttempt(gsc, now, 'kdp'), /capability_mismatch/);
  for (const attempt of [null, {status:'failed',observedAt:'2026-09-20T00:00:00Z'}, {status:'pass',observedAt:'2026-09-18T00:00:00Z'}, {status:'pass',observedAt:'2026-09-22T00:00:00Z'}]) assert.throws(()=>validateAttempt(attempt,now));
});

test('independent health detects stalled schedules even when the last run passed', () => {
  const now = Date.parse('2026-09-21T00:00:00Z');
  const state = {generatedAt:'2026-09-20T00:00:00Z', sources:Object.keys(SOURCES).map(source=>({source,capability:SOURCES[source].capability,status:'pass',observedAt:'2026-09-20T00:00:00Z',metricsAvailable:true}))};
  assert.equal(measurementHealth(state,now).status,'pass');
  const kdp = state.sources.find(s=>s.source==='kdp');
  kdp.capability = 'publication-status';
  assert.equal(measurementHealth(state,now).sources.find(s=>s.source==='kdp').metricsAvailable,false);
  assert.equal(measurementHealth(state,now).status,'action_required');
  kdp.capability = SOURCES.kdp.capability;
  assert.equal(measurementHealth(state,now+3*86400000).status,'action_required');
  state.sources[0].observedAt='2026-09-10T00:00:00Z';
  assert.equal(measurementHealth(state,now).status,'action_required');
  assert.equal(measurementHealth(null,now).status,'action_required');
});

test('coconala distinguishes observed zero sales from paywalled display counts', () => {
  const text = '全出品サービス累計\n対象期間：2026/08/22 - 2026/09/20\n過去30日間\n表示数\n0000 回\n閲覧数\n142 回\n販売数\n0 件\n販売額\n0 円\nお気に入り数\n0 回\nセラーサクセスに加入して、表示数を確認しましょう。\n閲覧数・販売数推移\n閲覧数\n999 回';
  const value = parseCoconalaAnalytics(text);
  assert.deepEqual(value.period,{start:'2026-08-22',end:'2026-09-20'});
  assert.equal(value.views,142);
  assert.equal(value.orders,0);
  assert.equal(value.grossSalesJpy,0);
  assert.equal(value.impressions,null);
  assert.throws(()=>parseCoconalaAnalytics(text.replace('販売額','新しい列')),/report_schema_changed/);
  assert.throws(()=>parseCoconalaAnalytics('ログイン'),/report_schema_changed/);
  const serviceText = text.replace('全出品サービス累計','サービスのパフォーマンス').replace('販売額\n0 円\n','');
  const service = {...parseCoconalaAnalytics(serviceText,{service:true}),serviceId:'123'};
  assert.equal(service.grossSalesJpy,null);
  assert.deepEqual(validateCoconalaCoverage(value,[service]),{complete:true,serviceCount:1,totalsMatched:true});
  assert.throws(()=>validateCoconalaCoverage(value,[{...service,views:141}]),/collection_incomplete/);
  assert.throws(()=>validateCoconalaCoverage(value,[service,service]),/collection_incomplete/);
  assert.throws(()=>validateCoconalaCoverage(value,[{...service,period:{start:'2026-09-20',end:'2026-09-20'}}]),/collection_incomplete/);
});

test('missing jobs remain failed and activated consumers never silently fall back after failure', () => {
  const temp = mkdtempSync(join(tmpdir(), 'stats47-measurement-test-'));
  const script = resolve('.claude/scripts/measurement/summarize.mjs');
  try {
    const input = join(temp, 'input'); mkdirSync(input);
    const observation = { source: 'note', capability: SOURCES.note.capability, status: 'pass', metricsAvailable: true, observedAt: new Date().toISOString(), runId: process.env.GITHUB_RUN_ID };
    writeFileSync(join(input, 'note.json'), JSON.stringify(observation));
    execFileSync(process.execPath, [script, input], { cwd: temp });
    const path = join(temp, '.claude/state/metrics/authenticated/latest.json');
    const first = JSON.parse(readFileSync(path));
    assert.equal(first.sources.length, Object.keys(SOURCES).length);
    assert.equal(first.status, 'action_required');
    assert.equal(first.sources.find(s => s.source === 'note').activated, true);
    assert.equal(first.sources.find(s => s.source === 'a8').code, 'runner_failed');
    writeFileSync(join(input, 'note.json'), JSON.stringify({ ...observation, status: 'failed', code: 'auth_required', metricsAvailable: true }));
    execFileSync(process.execPath, [script, input], { cwd: temp });
    const second = JSON.parse(readFileSync(path)).sources.find(s => s.source === 'note');
    assert.equal(second.activated, true);
    assert.equal(second.metricsAvailable, false);
    assert.equal(second.code, 'auth_required');
    const current = { ...observation, runId: 'current-run' };
    for (const invalid of [
      { ...current, source: 'gsc' },
      { ...current, capability: 'publication-status' },
      { ...current, observedAt: '2020-01-01T00:00:00Z' },
      { ...current, runId: 'old-run' }, null,
    ]) {
      writeFileSync(join(input, 'note.json'), JSON.stringify(invalid));
      execFileSync(process.execPath, [script, input], { cwd: temp, env: { ...process.env, GITHUB_RUN_ID: 'current-run' } });
      const rejected = JSON.parse(readFileSync(path)).sources.find(s => s.source === 'note');
      assert.equal(rejected.code, 'invalid_observation');
      assert.equal(rejected.status, 'failed');
      assert.equal(rejected.metricsAvailable, false);
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('rerun artifacts select the latest attempt and never resurrect an older success', () => {
  const temp = mkdtempSync(join(tmpdir(), 'stats47-measurement-rerun-'));
  const script = resolve('.claude/scripts/measurement/summarize.mjs');
  try {
    const input = join(temp, 'input'); mkdirSync(input);
    const observation = { source: 'afb', capability: SOURCES.afb.capability, status: 'pass', metricsAvailable: true, observedAt: new Date().toISOString(), runId: 'current-run', runAttempt: 4 };
    writeFileSync(join(input, 'afb.json'), JSON.stringify({ ...observation, status: 'failed' }));
    writeFileSync(join(input, 'afb-4.json'), JSON.stringify(observation));
    const read = () => {
      execFileSync(process.execPath, [script, input], { cwd: temp, env: { ...process.env, GITHUB_RUN_ID: 'current-run', GITHUB_RUN_ATTEMPT: '5' } });
      return JSON.parse(readFileSync(join(temp, '.claude/state/metrics/authenticated/latest.json'))).sources.find(s => s.source === 'afb');
    };
    assert.equal(read().status, 'pass');
    assert.equal(read().runAttempt, 4);
    writeFileSync(join(input, 'afb-5.json'), JSON.stringify({ ...observation, runAttempt: 5, status: 'failed', code: 'api_auth_required' }));
    assert.equal(read().code, 'api_auth_required');
    for (const bad of ['not JSON', JSON.stringify(observation), JSON.stringify({ ...observation, runAttempt: 5, runId: 'old-run' })]) {
      writeFileSync(join(input, 'afb-5.json'), bad);
      assert.equal(read().code, 'invalid_observation');
      assert.equal(read().metricsAvailable, false);
    }
  } finally { rmSync(temp, { recursive: true, force: true }); }
});

test('authenticated CI has no PR trigger, no raw artifacts, and includes all configured services', () => {
  const source = readFileSync('.github/workflows/authenticated-measurement.yml', 'utf8');
  const workflow = yaml.load(source);
  assert.deepEqual(Object.keys(workflow.on).sort(), ['push', 'schedule', 'workflow_dispatch']);
  assert.deepEqual(workflow.jobs.collect.strategy.matrix.include.map(s => s.source).sort(), Object.keys(SOURCES).sort());
  assert.equal(workflow.jobs.collect.permissions, undefined);
  assert.equal(workflow.permissions.contents, 'read');
  const upload = workflow.jobs.collect.steps.find(s => s.uses?.startsWith('actions/upload-artifact'));
  assert.equal(upload.with.path, '.local/authenticated-ci-public/*.json');
  assert.equal(upload.with.name, 'authenticated-status-${{ matrix.source }}-${{ github.run_attempt }}', 'artifact identity must also separate attempts; filenames alone cannot prevent download de-duplication');
  assert.match(source, /gh issue close/);
  const download = workflow.jobs.record.steps.find(s=>s.id==='artifacts');
  assert.equal(download['continue-on-error'],undefined);
  assert.equal(workflow.jobs.record.steps.find(s=>s.id==='record').if,'always()');
  assert.match(source,/steps\.artifacts\.outcome/);
  assert.match(source,/needs\.collect\.result/);
  assert.doesNotMatch(source, /pull_request|self-hosted|--commit|publishDraft/);
});

test('independent health and alert run even if an earlier artifact download failed', () => {
  const workflow = yaml.load(readFileSync('.github/workflows/workflow-health-daily.yml', 'utf8'));
  const steps = workflow.jobs.audit.steps;
  assert.equal(steps.find(s=>s.id==='authenticated').if, 'always()');
  const alert = steps.find(s=>s.name?.includes('連続失敗を Issue'));
  assert.match(alert.if, /^always\(\) &&/);
  for (const id of ['audit', 'freshness', 'affiliate_portfolio', 'authenticated']) {
    assert.match(alert.if, new RegExp(`steps\\.${id}\\.outputs\\.\\w+ != 'true'`));
  }
  assert.match(alert.run, /if \[ -f \/tmp\/authenticated-health.txt \]/);
});
