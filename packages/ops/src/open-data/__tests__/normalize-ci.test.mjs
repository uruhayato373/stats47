import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { normalizeFromR2 } from '../normalize-ci.mjs';
import { publishNormalizedOutputs } from '../lib/publish.mjs';
import { ROOT, sha256 } from '../lib/contracts.mjs';
import { localKey, snapshotPath } from '../lib/archive.mjs';
import { archivedFixture, temp } from './fixtures.mjs';

test('normalize dry-run GETs and verifies raw keys, creates derived tables, and never calls PUT or publisher', async (t) => {
  const { root, dataset, objects, entry } = await archivedFixture(t);
  const ledger = fs.readFileSync(snapshotPath(root, dataset.id));
  const reads = [];
  const report = await normalizeFromR2({ root, target: { type: 'all' }, store: {
    get: async (key) => { reads.push(key); return objects.get(key); },
    put: () => assert.fail('dry-run PUT'),
  }, publish: () => assert.fail('dry-run publisher'), assertWrite: () => assert.fail('dry-run write guard') });
  assert.equal(report.ok, true);
  assert.equal(report.dryRun, true);
  assert.deepEqual(reads.sort(), [entry.manifestKey, ...entry.files.map((f) => f.key)].sort());
  assert.equal(report.publish.planned, 1);
  assert.equal(report.publish.verified, 0);
  assert.equal(fs.existsSync(localKey(root, report.results[0].outputs[0].key)), true);
  assert.deepEqual(fs.readFileSync(snapshotPath(root, dataset.id)), ledger);
});

test('normalize apply publishes only explicit derived keys, keeps private caching, GET verifies, and never updates snapshots', async (t) => {
  const { root, dataset, objects } = await archivedFixture(t);
  const ledger = fs.readFileSync(snapshotPath(root, dataset.id));
  const puts = []; const guards = []; const reads = [];
  const store = {
    get: async (key) => { reads.push(key); return objects.get(key); },
    put: async (options) => {
      assert.equal(options.cacheControl, 'private, no-store');
      puts.push(options.key); objects.set(options.key, { body: options.body });
    },
  };
  const report = await normalizeFromR2({ root, target: { type: 'dataset', value: dataset.id }, store, dryRun: false,
    assertWrite: async (keys) => guards.push(keys),
    publish: async ({ candidates, store, dryRun }) => {
      assert.equal(dryRun, false);
      for (const candidate of candidates) await store.put(candidate);
      return { uploaded: candidates.length };
    },
  });
  assert.equal(report.ok, true);
  const keys = report.results.flatMap((r) => r.outputs.map((o) => o.key));
  assert.deepEqual(puts, keys);
  assert.deepEqual(guards, [keys]);
  assert.ok(keys.every((key) => key.startsWith('open-data/normalized/') && reads.includes(key)));
  assert.equal(report.publish.verified, 1);
  assert.deepEqual(fs.readFileSync(snapshotPath(root, dataset.id)), ledger);
});

for (const kind of ['raw', 'manifest']) test(`normalize ${kind} corruption prevents all writes and output`, async (t) => {
  const { root, entry, objects } = await archivedFixture(t);
  objects.set(kind === 'raw' ? entry.files[0].key : entry.manifestKey, { body: Buffer.from('corrupt') });
  const report = await normalizeFromR2({ root, target: { type: 'all' }, dryRun: false,
    store: { get: async (key) => objects.get(key), put: () => assert.fail('corrupt raw PUT') },
    publish: () => assert.fail('corrupt raw publisher'), assertWrite: () => assert.fail('corrupt raw write guard'),
  });
  assert.equal(report.ok, false);
  assert.match(report.results[0].error, /mismatch/);
  assert.equal(fs.existsSync(path.join(root, '.local/r2')), false);
});

test('normalized publisher detects read-back corruption and refuses raw keys even in dry-run', async (t) => {
  const root = temp(t);
  const body = Buffer.from('{"test":1}\n');
  const file = { key: 'open-data/normalized/test/v1/table.json', sha256: sha256(body), bytes: body.length };
  fs.mkdirSync(path.dirname(localKey(root, file.key)), { recursive: true });
  fs.writeFileSync(localKey(root, file.key), body);
  const options = { root, files: [file], dryRun: false, publish: async () => {}, store: { get: async () => ({ body: Buffer.from('{"test":2}\n') }) } };
  await assert.rejects(publishNormalizedOutputs(options), /SHA/);
  await assert.rejects(publishNormalizedOutputs({ ...options, store: { get: async () => null } }), /read-back/);
  await assert.rejects(publishNormalizedOutputs({ ...options, dryRun: true, files: [{ ...file, key: 'open-data/raw/test/v1/source.json' }] }), /output key/);
  fs.writeFileSync(localKey(root, file.key), 'tampered');
  await assert.rejects(publishNormalizedOutputs({ ...options, publish: () => assert.fail('tampered output PUT') }), /SHA/);
});

const workflow = YAML.parse(fs.readFileSync(path.join(ROOT, '.github/workflows/open-data-source-archive.yml'), 'utf8'));
const steps = workflow.jobs.archive.steps;
const enabled = (step, inputs) => !step.if || Function(`return (${step.if.replace(/inputs\.(\w+)/g, (_, key) => JSON.stringify(inputs[key]))})`)();

test('workflow retains archive default, release stop and r2-write serialization; normalize never commits back', () => {
  assert.equal(workflow.on.workflow_dispatch.inputs.mode.default, 'archive');
  assert.deepEqual(workflow.on.workflow_dispatch.inputs.mode.options, ['archive', 'normalize']);
  assert.deepEqual(workflow.concurrency, { group: 'r2-write', 'cancel-in-progress': false });
  const guard = steps.find((s) => s.name === 'Check release and read latest snapshot ledger');
  assert.match(guard.run, /gh pr list --base main --head develop --state open/);
  const normalize = steps.find((s) => s.run?.includes('normalize-ci.mjs'));
  assert.ok(steps.indexOf(guard) < steps.indexOf(normalize));
  for (const mode of ['archive', 'normalize']) for (const dry_run of ['true', 'false']) {
    const inputs = { mode, dry_run };
    assert.equal(enabled(guard, inputs), mode === 'normalize' || dry_run === 'false');
    assert.equal(enabled(normalize, inputs), mode === 'normalize');
    for (const step of steps.filter((s) => /commit-back|Record verified|Push explicit/.test(s.name))) {
      assert.equal(enabled(step, inputs), mode === 'archive' && dry_run === 'false', step.name);
    }
  }
});

for (const dryRun of ['true', 'false']) test(`workflow normalize shell forwards ${dryRun === 'true' ? '--dry-run' : '--apply'} with no separate write step`, (t) => {
  const root = temp(t);
  fs.writeFileSync(path.join(root, 'npm'), '#!/bin/bash\nexit 0\n', { mode: 0o755 });
  fs.writeFileSync(path.join(root, 'node'), '#!/bin/bash\nif [ "$1" = "-p" ]; then printf "private-bucket\\n"; else printf "%s\\n" "$*" >> "$CALLS"; fi\n', { mode: 0o755 });
  const step = steps.find((s) => s.run?.includes('normalize-ci.mjs'));
  const calls = path.join(root, 'calls');
  const result = spawnSync('bash', ['-e', '-c', step.run], { cwd: ROOT, env: { ...process.env, PATH: `${root}:${process.env.PATH}`, TARGET: 'dataset:test', DRY_RUN: dryRun, CALLS: calls }, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const invocations = fs.readFileSync(calls, 'utf8').trim().split('\n');
  assert.equal(invocations.at(-1), `--import tsx .claude/scripts/open-data/normalize-ci.mjs --dataset test ${dryRun === 'true' ? '--dry-run' : '--apply'}`);
  assert.equal(invocations.some((line) => line.includes('lib/publish.mjs')), false);
});
