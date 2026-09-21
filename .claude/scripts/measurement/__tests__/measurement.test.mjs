import assert from 'node:assert/strict';
import test from 'node:test';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import yaml from 'js-yaml';
import { SOURCES, scopedState, sourceFor, failureCode } from '../sources.mjs';
import { encrypt, decrypt, BUCKET } from '../vault.mjs';
import { consumerPath, validateAttempt } from '../consumer-paths.mjs';
import { measurementHealth } from '../health.mjs';
import { parseCoconalaAnalytics, validateCoconalaCoverage } from '../report-parsers.mjs';

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
  for (const attempt of [null, {status:'failed',observedAt:'2026-09-20T00:00:00Z'}, {status:'pass',observedAt:'2026-09-18T00:00:00Z'}, {status:'pass',observedAt:'2026-09-22T00:00:00Z'}]) assert.throws(()=>validateAttempt(attempt,now));
});

test('independent health detects stalled schedules even when the last run passed', () => {
  const now = Date.parse('2026-09-21T00:00:00Z');
  const state = {generatedAt:'2026-09-20T00:00:00Z', sources:Object.keys(SOURCES).map(source=>({source,status:'pass',observedAt:'2026-09-20T00:00:00Z',metricsAvailable:true}))};
  assert.equal(measurementHealth(state,now).status,'pass');
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
    writeFileSync(join(input, 'note.json'), JSON.stringify({ source: 'note', status: 'pass', metricsAvailable: true, observedAt: new Date().toISOString() }));
    execFileSync(process.execPath, [script, input], { cwd: temp });
    const path = join(temp, '.claude/state/metrics/authenticated/latest.json');
    const first = JSON.parse(readFileSync(path));
    assert.equal(first.sources.length, Object.keys(SOURCES).length);
    assert.equal(first.status, 'action_required');
    assert.equal(first.sources.find(s => s.source === 'note').activated, true);
    assert.equal(first.sources.find(s => s.source === 'a8').code, 'runner_failed');
    writeFileSync(join(input, 'note.json'), JSON.stringify({ status: 'failed', code: 'auth_required', metricsAvailable: true }));
    execFileSync(process.execPath, [script, input], { cwd: temp });
    const second = JSON.parse(readFileSync(path)).sources.find(s => s.source === 'note');
    assert.equal(second.activated, true);
    assert.equal(second.metricsAvailable, false);
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
  assert.match(source, /gh issue close/);
  const download = workflow.jobs.record.steps.find(s=>s.id==='artifacts');
  assert.equal(download['continue-on-error'],undefined);
  assert.equal(workflow.jobs.record.steps.find(s=>s.id==='record').if,'always()');
  assert.match(source,/steps\.artifacts\.outcome/);
  assert.doesNotMatch(source, /pull_request|self-hosted|--commit|publishDraft/);
});
