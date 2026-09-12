import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import YAML from 'yaml';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const workflow = YAML.parse(fs.readFileSync(path.join(root, '.github/workflows/data-refresh.yml'), 'utf8'));
const steps = workflow.jobs.refresh.steps;
const step = name => steps.find(entry => entry.name.includes(name));
const resolveInputs = step('Resolve inputs');
const validate = step('Validate ranking refresh scope');
const batch = step('page-data-batch');
const observations = step('Push observations');
const ranking = step('Regenerate scoped ranking');
const full = step('Regenerate derived');
const tsx = path.join(root, 'node_modules/.bin/tsx');
const keys = 'annual-clear-days,annual-precipitation';
const registryResult = spawnSync(tsx, ['-r', './packages/ranking/src/scripts/setup-cli.js', '-e', `
  const { listAllMetrics } = require('@stats47/data-configs');
  const { GONE_RANKING_KEYS } = require('./packages/ranking/src/config/gone-ranking-keys.ts');
  const { activeNormalizationOptions } = require('./packages/ranking/src/scripts/generate-ranking-normalized-values.ts');
  console.log('FIXTURE:' + JSON.stringify(listAllMetrics().filter(c => c.entities.includes('prefecture') && !GONE_RANKING_KEYS.has(c.key)).map(c => ({ rankingKey: c.key, yearFormat: c.yearFormat, normTypes: activeNormalizationOptions(c).map(o => o.type) }))));
`], { cwd: root, encoding: 'utf8' });
assert.equal(registryResult.status, 0, registryResult.stderr);
const registry = JSON.parse(registryResult.stdout.split('\n').find(line => line.startsWith('FIXTURE:')).slice(8));

function run(scripts, overrides = {}, fixture = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'data-refresh-scope-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin);
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(dir, 'node_modules'), 'dir');
  fs.symlinkSync(path.join(root, 'packages'), path.join(dir, 'packages'), 'dir');
  fs.writeFileSync(path.join(dir, 'fixture.json'), JSON.stringify({ registry, ...fixture }));
  if (fixture.request) {
    fs.mkdirSync(path.join(dir, 'data'));
    fs.writeFileSync(path.join(dir, 'data/data-refresh-requests.json'), JSON.stringify(fixture.request));
  }
  fs.writeFileSync(path.join(bin, 'npx'), `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const args = process.argv.slice(2);
const fixture = JSON.parse(fs.readFileSync('fixture.json', 'utf8'));
const keys = process.env.REFRESH_METRIC.split(',');
fs.appendFileSync(process.env.CALL_LOG, JSON.stringify(args) + '\\n');
if (args.includes('-e')) {
  const result = spawnSync(process.env.REAL_TSX, args.slice(1), { env: process.env, stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
const has = file => args.some(arg => arg.endsWith(file));
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data)); };
const year = c => ({ yearCode: '2024', yearName: '2024' + (c.yearFormat === 'fiscal' || fixture.staleLabel ? '年度' : '年') });
const item = c => ({ rankingKey: c.rankingKey, latestYear: year(c), availableYears: [year(c)] });
const value = c => ({ ...year(c), areaCode: '01000', value: 1, rank: 1 });
if (has('page-data-batch.ts')) {
  if (fixture.batchFails) process.exit(1);
  if (!args.includes('--dry-run')) {
    for (const key of keys) {
      if (key === fixture.missingStats) continue;
      const c = fixture.registry.find(c => c.rankingKey === key);
      const rows = fixture.emptyStats ? [] : [value(c)];
      write('.local/r2/app/stats/' + key + '/values.json', { metricKey: fixture.wrongStats ? 'wrong' : key, entityKind: 'prefecture', rows, meta: { rowCount: rows.length, recipe: {} } });
    }
    if (fixture.extraStats) write('.local/r2/app/stats/extra-key/values.json', {});
  }
}
if (has('generate-ranking-items.ts')) {
  if (fixture.itemsFail) process.exit(1);
  for (const key of keys) write('.local/r2/app/ranking/' + key + '/item.json', { item: item(fixture.registry.find(c => c.rankingKey === key)) });
  const items = (fixture.partialIndex ? fixture.registry.filter(c => keys.includes(c.rankingKey)) : fixture.registry).map(item);
  if (fixture.duplicateIndex) items[items.length - 1] = items[0];
  write('.local/r2/app/ranking-items/all.json', { count: items.length, items });
}
if (has('generate-ranking-values.ts') || has('generate-ranking-normalized-values.ts')) {
  if (fixture.valuesFail) process.exit(1);
  for (const key of keys) {
    const c = fixture.registry.find(c => c.rankingKey === key);
    const data = { rankingKey: key, areaType: 'prefecture', partitions: [{ yearCode: '2024', values: [value(c)] }] };
    if (has('generate-ranking-values.ts')) {
      write('.local/r2/app/ranking/' + key + '/values.json', data);
      if (fixture.extraRanking) write('.local/r2/app/ranking/' + key + '/unexpected.json', {});
    } else if (c.normTypes.length) {
      if (fixture.missingNormalized) continue;
      for (const type of c.normTypes) write('.local/r2/app/ranking/' + key + '/values-' + type.replaceAll('_', '-') + '.json', data);
      write('.local/r2/app/ranking/' + key + '/national-trend.json', { rankingKey: key, areaType: 'prefecture', series: [{ points: [year(c)] }] });
    }
  }
}
if (has('diff-push-r2.ts') && fixture.pushFails) process.exit(1);
`, { mode: 0o755 });
  try {
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', scripts], {
      cwd: dir,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}:${process.env.PATH}`,
        CALL_LOG: path.join(dir, 'calls.jsonl'),
        REAL_TSX: tsx,
        NODE_ENV: 'production',
        SNAPSHOT_SCOPE: 'ranking',
        REFRESH_METRIC: keys,
        REFRESH_SINCE: '',
        REFRESH_ALLOW_EMPTY: '',
        REFRESH_DRY_RUN: 'false',
        MIGRATE_LEGACY_RECIPES: 'false',
        BATCH_OUTCOME: 'success',
        EVENT_NAME: 'workflow_dispatch',
        INPUT_METRIC: keys,
        INPUT_SNAPSHOT_SCOPE: '',
        INPUT_SINCE: '',
        INPUT_ALLOW_EMPTY: '',
        INPUT_DRY_RUN: 'true',
        INPUT_MIGRATE_LEGACY_RECIPES: 'false',
        GITHUB_OUTPUT: path.join(dir, 'outputs'),
        ...overrides,
      },
    });
    const log = path.join(dir, 'calls.jsonl');
    const outputs = path.join(dir, 'outputs');
    return {
      ...result,
      calls: fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [],
      outputs: fs.existsSync(outputs) ? fs.readFileSync(outputs, 'utf8') : '',
    };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
const puts = result => result.calls.filter(args => args.some(arg => arg.endsWith('diff-push-r2.ts')));
const sequence = [validate, batch, observations, ranking].map(entry => entry.run).join('\n');

test('ranking scope fetches official observations before exact stats and derived PUTs; index remains full', () => {
  const result = run(sequence);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(puts(result).map(args => args.slice(-2)), [
    ['--prefix', 'app/stats/annual-clear-days/'],
    ['--prefix', 'app/stats/annual-precipitation/'],
    ['--prefix', 'app/ranking/annual-clear-days/'],
    ['--prefix', 'app/ranking/annual-precipitation/'],
    ['--prefix', 'app/ranking-items/'],
  ]);
  const fetched = result.calls.find(args => args.some(arg => arg.endsWith('page-data-batch.ts')));
  assert.deepEqual(fetched.slice(-4), ['--metric', keys, '--kind', 'prefecture']);
  for (const generator of ['generate-ranking-items.ts', 'generate-ranking-values.ts', 'generate-ranking-normalized-values.ts']) {
    const index = result.calls.findIndex(args => args.some(arg => arg.endsWith(generator)));
    assert.ok(index > result.calls.findIndex(args => args.includes('app/stats/annual-precipitation/')));
    assert.deepEqual(result.calls[index].slice(-2), ['--only', keys]);
  }
});

for (const metric of ['', '../key', 'annual-clear-days,', 'annual-clear-days,annual-clear-days', 'annual-clear-days\n', 'unknown-key', 'projected-population-2045', 'ambulance-hospital-arrival-time', Array.from({ length: 51 }, (_, i) => `key-${i}`).join(',')]) {
  test(`invalid ranking scope fails before fetch and PUT: ${metric.slice(0, 55)}`, () => {
    const result = run(sequence, { REFRESH_METRIC: metric });
    assert.notEqual(result.status, 0);
    assert.equal(puts(result).length, 0);
    assert.equal(result.calls.some(args => args.some(arg => arg.endsWith('page-data-batch.ts'))), false);
  });
}

for (const overrides of [{ REFRESH_SINCE: '2024-01-01' }, { REFRESH_ALLOW_EMPTY: 'annual-clear-days' }, { MIGRATE_LEGACY_RECIPES: 'true' }]) {
  test(`scoped refresh rejects incomplete fetch or cross-scope migration: ${JSON.stringify(overrides)}`, () => {
    const result = run(sequence, overrides);
    assert.notEqual(result.status, 0);
    assert.equal(result.calls.length, 0);
  });
}

for (const fixture of [{ missingStats: 'annual-precipitation' }, { emptyStats: true }, { wrongStats: true }, { extraStats: true }]) {
  test(`missing or unexpected observations prevent the first PUT: ${JSON.stringify(fixture)}`, () => {
    const result = run(sequence, {}, fixture);
    assert.notEqual(result.status, 0);
    assert.equal(puts(result).length, 0);
  });
}

test('failed batch outcome prevents partial-publish in ranking scope', () => {
  const result = run([batch.run, observations.run, ranking.run].join('\n'), { BATCH_OUTCOME: 'failure' });
  assert.notEqual(result.status, 0);
  assert.equal(puts(result).length, 0);
});

for (const fixture of [{ itemsFail: true }, { valuesFail: true }, { partialIndex: true }, { duplicateIndex: true }, { extraRanking: true }, { missingNormalized: true }, { staleLabel: true }]) {
  test(`incomplete derived snapshots cannot publish ranking or all.json: ${JSON.stringify(fixture)}`, () => {
    const result = run(sequence, {}, fixture);
    assert.notEqual(result.status, 0);
    assert.equal(puts(result).length, 2, 'only prerequisite stats PUTs may have completed');
    assert.ok(puts(result).every(args => args.at(-1).startsWith('app/stats/')));
  });
}

test('a failed observation PUT stops generation and stays failed', () => {
  const result = run(sequence, {}, { pushFails: true });
  assert.notEqual(result.status, 0);
  assert.equal(puts(result).length, 1);
  assert.equal(result.calls.some(args => args.some(arg => arg.endsWith('generate-ranking-items.ts'))), false);
});

test('dry-run still validates and fetches, while workflow conditions skip every R2 publishing step', () => {
  const result = run(validate.run + '\n' + batch.run, { REFRESH_DRY_RUN: 'true' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(puts(result).length, 0);
  assert.ok(result.calls.find(args => args.some(arg => arg.endsWith('page-data-batch.ts'))).includes('--dry-run'));
  for (const entry of [observations, ranking, full]) assert.match(entry.if, /steps\.resolve\.outputs\.dry_run != 'true'/);
});

test('default all scope retains existing full/partial-publish path and shared writer lock', () => {
  assert.equal(workflow.on.workflow_dispatch.inputs.snapshot_scope.default, 'all');
  assert.equal(workflow.concurrency.group, 'r2-write');
  assert.equal(batch['continue-on-error'], true);
  assert.equal(full.run, 'bash .claude/skills/db/sync-snapshots/run.sh');
  assert.match(full.if, /snapshot_scope != 'ranking'/);
  assert.match(ranking.if, /snapshot_scope == 'ranking'/);
  assert.equal(ranking.env.NODE_ENV, 'production');
  assert.ok(steps.indexOf(validate) < steps.indexOf(batch));
  assert.ok(steps.indexOf(observations) < steps.indexOf(ranking));
  const result = run(observations.run, { SNAPSHOT_SCOPE: 'all', BATCH_OUTCOME: 'failure' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(puts(result)[0].slice(-2), ['--prefix', 'app/stats']);
});

test('dispatch/schedule omission defaults to all; request supports explicit ranking', () => {
  for (const event of ['workflow_dispatch', 'schedule']) {
    const result = run(resolveInputs.run, { EVENT_NAME: event });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.outputs, /^snapshot_scope=all$/m);
  }
  const result = run(resolveInputs.run, { EVENT_NAME: 'push' }, { request: { metric: keys, snapshotScope: 'ranking', dryRun: false } });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.outputs, /^snapshot_scope=ranking$/m);
  assert.match(result.outputs, /^dry_run=false$/m);
});

for (const overrides of [{ INPUT_SNAPSHOT_SCOPE: 'invalid' }, { INPUT_SNAPSHOT_SCOPE: 'ranking', INPUT_METRIC: '' }, { INPUT_SNAPSHOT_SCOPE: 'ranking', INPUT_METRIC: 'annual-clear-days\nskip=true' }]) {
  test(`invalid scope cannot enter GITHUB_OUTPUT: ${JSON.stringify(overrides)}`, () => {
    const result = run(resolveInputs.run, overrides);
    assert.notEqual(result.status, 0);
    assert.equal(result.outputs, '');
  });
}
