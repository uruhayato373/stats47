import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  assertInside,
  assertNoLinks,
  scanTree,
  evaluate,
  assertIdle,
  planCaches,
  removeCache,
  allowedTargets,
  probeProcesses,
  isNodeProcess,
} from '../local-resources.mjs';

function fixture(t) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-resource-test-')));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const target = path.join(root, 'apps/web/.next/cache');
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, 'cache.pack'), 'regenerable');
  fs.writeFileSync(path.join(root, 'draft.md'), 'uncommitted');
  return { root, target };
}

test('cleanup preserves WIP and cannot expand to the project root or arbitrary files', (t) => {
  const { root, target } = fixture(t);
  const item = planCaches([root], { includeRecent: true })[0];
  const idle = { processes: [] };
  assert.throws(() => assertInside(root, root));
  assert.throws(() => assertInside(root, path.join(root, '../outside')));
  assert.throws(() =>
    removeCache({ ...item, target: path.join(root, 'draft.md') }, [root], idle)
  );
  assert.ok(fs.existsSync(target));
  assert.ok(removeCache(item, [root], idle) > 0);
  assert.equal(
    fs.readFileSync(path.join(root, 'draft.md'), 'utf8'),
    'uncommitted'
  );
});

test('default cleanup retains recent caches and never follows junctions', (t) => {
  const { root, target } = fixture(t);
  assert.equal(planCaches([root])[0].eligible, false);
  assert.equal(
    planCaches([root], { now: Date.now() + 8 * 86400000 })[0].eligible,
    true
  );
  const outside = path.join(root, 'valuable');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'source.md'), 'keep');
  fs.symlinkSync(
    outside,
    path.join(target, 'linked'),
    process.platform === 'win32' ? 'junction' : 'dir'
  );
  assert.equal(scanTree(target).links, 1);
  assert.equal(planCaches([root], { includeRecent: true })[0].eligible, false);
  assert.throws(() => assertNoLinks(root, path.join(target, 'linked')));
});

test('changed caches, busy processes and missing inspection fail closed', (t) => {
  const { root, target } = fixture(t);
  const item = planCaches([root], { includeRecent: true })[0];
  assert.throws(() => assertIdle({ processes: null }));
  assert.throws(() => assertIdle({ processes: [{ pid: 12, busy: true }] }));
  assert.throws(() =>
    assertIdle({ processes: [{ name: 'node.exe', commandReadable: false }] })
  );
  fs.writeFileSync(path.join(target, 'new.pack'), 'active');
  assert.throws(() => removeCache(item, [root], { processes: [] }), /changed/);
  assert.ok(fs.existsSync(target));
});

test('pressure thresholds distinguish warning, critical and unmeasured states', () => {
  assert.deepEqual(
    evaluate({ diskFreeBytes: 30 * 2 ** 30, availableBytes: 4 * 2 ** 30 }),
    []
  );
  assert.deepEqual(
    evaluate({ diskFreeBytes: 20 * 2 ** 30, availableBytes: 2 ** 30 }),
    [
      { key: 'disk', level: 'warning' },
      { key: 'memory', level: 'critical' },
    ]
  );
  assert.equal(evaluate({})[0].level, 'unknown');
  assert.deepEqual(evaluate({ diskFreeBytes: null, availableBytes: null }), [
    { key: 'disk', level: 'unknown' },
    { key: 'memory', level: 'unknown' },
  ]);
});

test(
  'gateway enforces total bytes and collects expired entries without key reuse',
  { skip: process.platform !== 'win32' },
  () => {
    const helper = fileURLToPath(
      new URL('../../../../apps/web/scripts/r2-dev-cache.ps1', import.meta.url)
    );
    const script = `
    $ErrorActionPreference='Stop'
    . '${helper.replaceAll("'", "''")}'
    $maxCacheBytes=8; $maxTotalCacheBytes=12; $maxCacheEntries=3
    function entry($n) { [pscustomobject]@{Bytes=[byte[]]::new($n);ExpiresAt=[DateTime]::UtcNow.AddMinutes(1)} }
    Add-CacheEntry a (entry 8); Add-CacheEntry b (entry 8)
    if ($cacheTotalBytes -ne 8 -or $cacheStore.Contains('a')) { throw 'byte eviction failed' }
    Add-CacheEntry b (entry 4)
    if ($cacheTotalBytes -ne 4) { throw 'replacement accounting failed' }
    Remove-ExpiredCacheEntries ([DateTime]::UtcNow.AddMinutes(2))
    if ($cacheTotalBytes -ne 0 -or $cacheStore.Count -ne 0) { throw 'expiry failed' }
    Add-CacheEntry large (entry 9)
    if ($cacheStore.Count -ne 0) { throw 'oversized entry accepted' }
    'cache behavior passed'
  `;
    const run = spawnSync(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', script],
      { encoding: 'utf8', windowsHide: true, timeout: 15000 }
    );
    assert.equal(run.status, 0, `${run.stdout}\n${run.stderr}`);
  }
);

test('glob allowlist expands only the last segment and never reaches outside the root', (t) => {
  const { root } = fixture(t);
  const turbo = path.join(root, '.turbo/cache');
  fs.mkdirSync(turbo, { recursive: true });
  fs.writeFileSync(path.join(turbo, 'a.tar.zst'), 'x');
  fs.writeFileSync(path.join(turbo, 'b.tar.zst'), 'y');
  fs.writeFileSync(path.join(root, '.turbo/keep.json'), 'config');
  const config = {
    cachePaths: [{ path: '.turbo/cache/*', ageDays: 1 }, 'missing/dir'],
    cacheAgeDays: 7,
    scratchRoots: {},
    protectedPaths: [],
  };
  // Literal entries are listed even when absent (planCaches skips them); globs expand to real children.
  const targets = allowedTargets([root], config).map((x) => path.relative(root, x.target));
  assert.deepEqual(
    targets.sort(),
    ['.turbo/cache/a.tar.zst', '.turbo/cache/b.tar.zst', 'missing/dir'].map((p) => p.split('/').join(path.sep))
  );
  assert.throws(
    () => allowedTargets([root], { ...config, cachePaths: ['.turbo/*/x'] }),
    /last segment/
  );
  // Only the exact expanded entries can be removed; a sibling outside the glob is refused.
  const plan = planCaches([root], { includeRecent: true, config });
  assert.equal(plan.length, 2);
  assert.throws(
    () =>
      removeCache(
        { ...plan[0], target: path.join(root, '.turbo/keep.json') },
        [root],
        { processes: [] },
        config
      ),
    /allowlisted/
  );
  assert.ok(removeCache(plan[0], [root], { processes: [] }, config) > 0);
  assert.ok(fs.existsSync(path.join(root, '.turbo/keep.json')));
});

test('scratch cleanup honours prefix, excludes, per-entry age and registered worktrees', (t) => {
  const { root } = fixture(t);
  const scratch = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-scratch-root-')));
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  for (const name of ['stats47-old', 'stats47-source-vault-x', 'other-project', 'stats47-worktree']) {
    fs.mkdirSync(path.join(scratch, name));
    fs.writeFileSync(path.join(scratch, name, 'f.txt'), name);
  }
  const config = {
    cachePaths: [],
    cacheAgeDays: 7,
    scratchRoots: { [process.platform]: [scratch] },
    scratchPrefix: 'stats47-',
    scratchAgeDays: 14,
    scratchExclude: ['stats47-source-vault*'],
    protectedPaths: [],
  };
  const roots = [root, path.join(scratch, 'stats47-worktree')];
  const names = allowedTargets(roots, config).map((x) => path.basename(x.target));
  assert.deepEqual(names, ['stats47-old']);
  const now = Date.now() + 15 * 86400000;
  const plan = planCaches(roots, { config, now });
  assert.equal(plan[0].kind, 'scratch');
  assert.equal(plan[0].reason, 'aged-scratch');
  assert.equal(planCaches(roots, { config, now: Date.now() + 10 * 86400000 })[0].eligible, false);
  assert.ok(removeCache(plan[0], roots, { processes: [] }, config) > 0);
  assert.ok(fs.existsSync(path.join(scratch, 'stats47-worktree/f.txt')));
  assert.ok(fs.existsSync(path.join(scratch, 'other-project/f.txt')));
  assert.ok(fs.existsSync(path.join(scratch, 'stats47-source-vault-x/f.txt')));
  // The scratch root itself is never a target, whatever the config says.
  assert.throws(() => assertInside(scratch, scratch));
});

test('POSIX process probe feeds the same idle gate as the Windows probe', () => {
  const idle = probeProcesses('1 100 /sbin/launchd\n2 200 /usr/bin/node /repo/.claude/hooks/session-guard.js\n');
  assert.equal(idle.length, 2);
  assert.doesNotThrow(() => assertIdle({ processes: idle }));
  const busy = probeProcesses('3 300 node /repo/node_modules/.bin/../next/dist/bin/next dev\n');
  assert.equal(busy[0].busy, true);
  assert.throws(() => assertIdle({ processes: busy }), /Active/);
  assert.equal(probeProcesses('garbage line\n').length, 0);
  assert.throws(() => assertIdle({ processes: null }));
  assert.ok(isNodeProcess({ name: 'node' }) && isNodeProcess({ name: 'node.exe' }));
});
