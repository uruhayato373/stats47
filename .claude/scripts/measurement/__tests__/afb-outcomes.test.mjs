import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import yaml from 'js-yaml';
import { afbPeriod, afbRequest, parseAfbOutcomes, collectAfbOutcomes } from '../afb-outcomes.mjs';
import { SOURCES, failureCode } from '../sources.mjs';
import { consumerPath, validateAttempt } from '../consumer-paths.mjs';

const config = JSON.parse(readFileSync('.claude/config/affiliate-asp.json', 'utf8'));
const now = new Date('2026-09-21T04:00:00Z');
const period = { start: '2026-08-24', end: '2026-09-20' };
const request = afbRequest(config, period, 'occurrence', now);
const row = { commit_id: '123', adv_id: '456', partner_site_id: '959426', partner_site_name: '統計で見る都道府県',
  visit_time: '2026-08-23 09:00:00', commit_time: '2026-09-02 09:01:00', recognition_time: '2026-09-10 10:00:00',
  margin: '100.29', commit_flg: '1', ref: 'private-ref', keyword: 'private-keyword' };
const payload = (rows = [row]) => ({ response: rows, error_message: '' });
const fakeKey = 'TEST_ONLY_NOT_A_REAL_KEY_123456789';

test('afb request is an exact partner/site-scoped GET with complete previous 28 dates', () => {
  assert.deepEqual(afbPeriod(now), period);
  assert.deepEqual(afbPeriod(new Date('2026-09-20T15:00:00Z')), period);
  assert.equal(request.url.origin, 'https://api.afi-b.com');
  assert.equal(request.url.pathname, `/partners/${config.asps.afb.api.partnerId}/conversion`);
  assert.equal(request.url.searchParams.get('partner_site_id'), '959426');
  assert.equal(request.url.searchParams.get('conversion_date_type'), '2');
  assert.equal(request.url.searchParams.has('status'), false);
  assert.equal(afbRequest(config, period, 'recognition', now).url.searchParams.get('conversion_date_type'), '3');
  for (const invalid of [
    { start: '2026-08-21', end: period.end }, { start: '2026-08-24', end: '2026-09-21' },
    { start: '2026-09-20', end: '2026-09-19' }, { start: '2026-02-30', end: period.end },
  ]) assert.throws(() => afbRequest(config, invalid, 'occurrence', now));
  assert.throws(() => afbRequest({ ...config, targetSiteName: 'doboku-note' }, period, 'occurrence', now), /account_mismatch/);
  assert.throws(() => afbRequest(config, period, 'click', now));
});

test('zero is only an explicit empty response; approved, pending and rejected amounts stay separate', () => {
  assert.equal(parseAfbOutcomes(payload([]), request).rowCount, 0);
  const result = parseAfbOutcomes(payload([row,
    { ...row, commit_id: 124, margin: 0.29, commit_flg: 0, recognition_time: null },
    { ...row, commit_id: 125, margin: 5000, commit_flg: 2 },
  ]), request);
  assert.deepEqual(result.totals, { pending: { count: 1, reportedMargin: 0.29 }, approved: { count: 1, reportedMargin: 100.29 }, rejected: { count: 1, reportedMargin: 5000 } });
  assert.equal(JSON.stringify(result).includes('private-ref'), false);
  assert.equal(JSON.stringify(result).includes('private-keyword'), false);
});

test('wrong site, missing schema, duplicate IDs, wrong date/status and malformed amounts fail closed', () => {
  for (const change of [
    { partner_site_id: '984453' }, { partner_site_id: null }, { commit_id: '' }, { adv_id: null },
    { commit_flg: 3 }, { commit_flg: null }, { margin: '' }, { margin: null }, { margin: -1 }, { margin: 'NaN' },
    { margin: '1,000' }, { margin: '1.123' }, { margin: '9007199254740991' },
    { commit_time: '2026-08-23' }, { commit_time: '2026-09-21' }, { commit_time: '2026-02-30' },
  ]) assert.throws(() => parseAfbOutcomes(payload([{ ...row, ...change }]), request));
  assert.throws(() => parseAfbOutcomes(payload([row, row]), request), /duplicate/);
  for (const bad of [null, [], {}, { response: null }, { response: [], error_message: 'error' }, { response: [], next_page: 2 }]) {
    assert.throws(() => parseAfbOutcomes(bad, request), /report_schema_changed/);
  }
  assert.throws(() => parseAfbOutcomes(payload([{ ...row, commit_flg: 0 }]), afbRequest(config, period, 'recognition', now)), /basis_or_period/);
});

test('API collection makes exactly two bounded requests, never sends cookies, and never follows redirects', async () => {
  const calls = [];
  const result = await collectAfbOutcomes({ config, now, apiKey: fakeKey, fetchImpl: async (url, options) => {
    calls.push(url);
    assert.equal(options.method, 'GET');
    assert.equal(options.redirect, 'error');
    assert.equal(options.headers.authorizationtoken, fakeKey);
    assert.equal(options.headers.Cookie, undefined);
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify(payload()), { headers: { 'content-type': 'application/json' } });
  } });
  assert.equal(calls.length, 2);
  assert.equal(result.report.capability, SOURCES.afb.capability);
  assert.equal(result.report.reports.occurrence.totals.approved.reportedMargin, 100.29);
  assert.equal(result.report.reports.recognition.totals.approved.reportedMargin, 100.29);
  assert.equal(result.report.totals, undefined, 'overlapping date bases must not be added');
  assert.equal(result.report.amountSemantics, 'provider-reported-margin-not-net-payout');
  assert.equal(JSON.stringify(result).includes(fakeKey), false);
});

test('API failures never become empty successes or leak the authentication header', async () => {
  for (const [fetchImpl, code] of [
    [async () => new Response('private', { status: 401 }), 'api_auth_required'],
    [async () => new Response('private', { status: 403 }), 'api_auth_required'],
    [async () => new Response('private', { status: 429 }), 'api_rate_limited'],
    [async () => new Response('private', { status: 500 }), 'api_unavailable'],
    [async () => { throw new Error(`redirect ${fakeKey}`); }, 'api_unavailable'],
    [async () => new Response('<html>login</html>'), 'report_schema_changed'],
    [async () => new Response('not json', { headers: { 'content-type': 'application/json' } }), 'report_schema_changed'],
  ]) await assert.rejects(collectAfbOutcomes({ config, now, apiKey: fakeKey, fetchImpl }), error => error.message.startsWith(code) && !error.message.includes(fakeKey));
  await assert.rejects(collectAfbOutcomes({ config, now, apiKey: '' }), /api_key_missing/);
  for (const code of ['api_auth_required', 'api_key_missing', 'api_rate_limited', 'api_unavailable']) assert.equal(failureCode(code), code);
});

test('only normalized afb outcomes restore; obsolete partnership-only successes are rejected', () => {
  assert.equal(consumerPath('afb', '.local/authenticated-measurement/afb-123/outcomes.json'), '.local/authenticated-measurement/restored/afb.json');
  for (const path of ['.local/authenticated-measurement/afb-123/raw.json', '.local/affiliate-status/latest.json', '.local/authenticated-measurement/afb-123/state.json']) assert.equal(consumerPath('afb', path), null);
  assert.throws(() => validateAttempt({ source: 'afb', capability: 'partnership-status', status: 'pass', observedAt: now.toISOString() }, now.getTime(), 'afb'), /capability_mismatch/);
  const workflow = yaml.load(readFileSync('.github/workflows/authenticated-measurement.yml', 'utf8'));
  assert.equal(workflow.jobs.collect.strategy.matrix.include.find(s => s.source === 'afb').secret, 'AFB_API_KEY');
  const collect = workflow.jobs.collect.steps.find(s => s.name === 'Collect and verify private evidence');
  assert.match(collect.env.AFB_API_KEY, /matrix.source == 'afb'/);
  assert.match(collect.env.MEASUREMENT_SESSION, /matrix.source != 'afb'/);
  assert.equal(workflow.jobs.collect.steps.find(s => s.run?.includes('playwright install')).if, "matrix.source != 'afb'");
});
