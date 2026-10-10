import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { LOCAL_RESOURCES } from '../../../../config/paths.mjs';
import {
  assertInside,
  assertNoLinks,
  scanTree,
  scanTargets,
  evaluate,
  assertIdle,
  planCaches,
  removeCache,
  allowedTargets,
  probeProcesses,
  isNodeProcess,
  worktreeStatus,
} from '../local-resources.mjs';

test('audit aggregates overlapping targets without rereading children', (t) => {
  const { root, target } = fixture(t);
  const expected = scanTree(target);
  const results = scanTargets([target, root, target]);
  assert.equal(results.length, 2);
  assert.deepEqual(results[0], { target, ...expected });
  assert.deepEqual(results[1], { target: root, ...scanTree(root) });
});

function fixture(t) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-resource-test-'))
  );
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
  const targets = allowedTargets([root], config).map((x) =>
    path.relative(root, x.target)
  );
  assert.deepEqual(
    targets.sort(),
    ['.turbo/cache/a.tar.zst', '.turbo/cache/b.tar.zst', 'missing/dir'].map(
      (p) => p.split('/').join(path.sep)
    )
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
  const scratch = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-scratch-root-'))
  );
  t.after(() => fs.rmSync(scratch, { recursive: true, force: true }));
  for (const name of [
    'stats47-old',
    'stats47-source-vault-x',
    'other-project',
    'stats47-worktree',
  ]) {
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
  const names = allowedTargets(roots, config).map((x) =>
    path.basename(x.target)
  );
  assert.deepEqual(names, ['stats47-old']);
  const now = Date.now() + 15 * 86400000;
  const plan = planCaches(roots, { config, now });
  assert.equal(plan[0].kind, 'scratch');
  assert.equal(plan[0].reason, 'aged-scratch');
  assert.equal(
    planCaches(roots, { config, now: Date.now() + 10 * 86400000 })[0].eligible,
    false
  );
  assert.ok(removeCache(plan[0], roots, { processes: [] }, config) > 0);
  assert.ok(fs.existsSync(path.join(scratch, 'stats47-worktree/f.txt')));
  assert.ok(fs.existsSync(path.join(scratch, 'other-project/f.txt')));
  assert.ok(fs.existsSync(path.join(scratch, 'stats47-source-vault-x/f.txt')));
  // The scratch root itself is never a target, whatever the config says.
  assert.throws(() => assertInside(scratch, scratch));
});

test('GIS scratch entries preserve work scripts and registered worktrees', (t) => {
  const { root } = fixture(t);
  const geo = path.join(root, 'stats47-geo-ui');
  fs.mkdirSync(geo);
  fs.writeFileSync(path.join(geo, 'source.zip'), 'download');
  fs.writeFileSync(path.join(geo, 'repair.ts'), 'unique work');
  const config = {
    cachePaths: [],
    cacheAgeDays: 7,
    scratchAgeDays: 14,
    scratchRoots: { [process.platform]: [root] },
    scratchPrefix: 'stats47-',
    scratchExclude: ['stats47-geo-ui'],
    scratchCachePaths: [{ path: 'stats47-geo-ui/*.zip', ageDays: 14 }],
    protectedPaths: [],
  };
  assert.equal(allowedTargets([geo], config).length, 0);
  const plan = planCaches([], { config, now: Date.now() + 15 * 86400000 });
  assert.equal(plan.length, 1);
  removeCache(plan[0], [], { processes: [] }, config);
  assert.ok(fs.existsSync(path.join(geo, 'repair.ts')));
  assert.ok(!fs.existsSync(path.join(geo, 'source.zip')));
});

test('POSIX process probe feeds the same idle gate as the Windows probe', () => {
  const idle = probeProcesses(
    '1 100 /sbin/launchd\n2 200 /usr/bin/node /repo/.claude/hooks/session-guard.js\n'
  );
  assert.equal(idle.length, 2);
  assert.doesNotThrow(() => assertIdle({ processes: idle }));
  const busy = probeProcesses(
    '3 300 node /repo/node_modules/.bin/../next/dist/bin/next dev\n'
  );
  assert.equal(busy[0].busy, true);
  assert.throws(() => assertIdle({ processes: busy }), /Active/);
  assert.equal(probeProcesses('garbage line\n').length, 0);
  assert.throws(() => assertIdle({ processes: null }));
  assert.ok(
    isNodeProcess({ name: 'node' }) && isNodeProcess({ name: 'node.exe' })
  );
});

// worktreeStatus(): dirty + scratchAgeDays 超の worktree だけを検知する。削除はしない
// (2026-09-14: 09-08 起点の worktree 4 本が 6 日間気づかれずに放置された再発防止)。
function initGitRepo(t) {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-worktree-status-'))
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const git = (args) => spawnSync('git', args, { cwd: root, encoding: 'utf8' });
  git(['init', '-q', '-b', 'main']);
  git(['config', 'user.email', 'test@example.com']);
  git(['config', 'user.name', 'test']);
  fs.writeFileSync(path.join(root, 'README.md'), 'root\n');
  git(['add', '.']);
  git(['commit', '-q', '-m', 'init']);
  return { root, git };
}

test('worktreeStatus: dirty かつ scratchAgeDays 超だけを stale とする', (t) => {
  const { root, git } = initGitRepo(t);
  const wt = path.join(root, '..', `stats47-worktree-status-wt-${process.pid}`);
  t.after(() => fs.rmSync(wt, { recursive: true, force: true }));
  git(['worktree', 'add', '-b', 'feature/x', wt]);
  fs.writeFileSync(path.join(wt, 'draft.md'), 'uncommitted');

  const config = { scratchAgeDays: 14 };
  const recent = worktreeStatus(wt, {
    root,
    now: Date.now(),
    staleAfterDays: config.scratchAgeDays,
  });
  assert.equal(recent.branch, 'feature/x');
  assert.equal(recent.detached, false);
  assert.equal(recent.dirtyFiles, 1);
  assert.equal(recent.stale, false, '新しいうちは stale にしない');

  const future = worktreeStatus(wt, {
    root,
    now: Date.now() + 20 * 86400000,
    staleAfterDays: config.scratchAgeDays,
  });
  assert.equal(future.stale, true, '15 日超の未コミットは stale にする');

  git(['worktree', 'remove', '--force', wt]);
  fs.mkdirSync(wt, { recursive: true });
  const clean = worktreeStatus(wt, {
    root,
    now: Date.now() + 20 * 86400000,
    staleAfterDays: config.scratchAgeDays,
  });
  assert.equal(
    clean.dirtyFiles,
    -1,
    'worktree でなくなった場所は計測不能として扱う (誤検知しない)'
  );
  assert.equal(clean.stale, false);
});

test('worktreeStatus: メインの working tree は root=true で stale 判定の対象にしない', (t) => {
  const { root } = initGitRepo(t);
  const status = worktreeStatus(root, {
    root,
    now: Date.now() + 100 * 86400000,
  });
  assert.equal(status.root, true);
  assert.equal(status.stale, false, 'target===root は stale 条件から除外する');
});

// ---- ファイル単位の保持期限と容量上限 (2026-10-10: 会話記録・生成画像・.local/r2 の肥大化対策) ----
import { planFileRetention, pruneFiles, checkFootprint } from '../local-resources.mjs';

const DAY = 86400000;
function homeFixture(t) {
  const home = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-retention-test-')));
  t.after(() => fs.rmSync(home, { recursive: true, force: true }));
  const put = (rel, ageDays, body = 'x') => {
    const file = path.join(home, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, body);
    const when = new Date(Date.now() - ageDays * DAY);
    fs.utimesSync(file, when, when);
    return file;
  };
  return { home, put };
}

test('ファイル単位の保持期限は期限切れで名前の合うファイルだけを消し、空になったフォルダも片付ける', (t) => {
  const { home, put } = homeFixture(t);
  const oldSub = put('.claude/projects/p1/s1/subagents/agent-a.jsonl', 10);
  const recent = put('.claude/projects/p1/s2.jsonl', 2);
  const otherKind = put('.claude/projects/p1/notes.md', 30);
  const entries = [{ root: '~/.claude/projects', match: '*.jsonl', ageDays: 7 }];
  const plan = planFileRetention(entries, { home });
  assert.deepEqual(plan[0].files.map((f) => f.file), [oldSub]);
  const result = pruneFiles(plan, entries, { home });
  assert.equal(result.removedFiles, 1);
  assert.equal(fs.existsSync(oldSub), false);
  assert.equal(fs.existsSync(path.join(home, '.claude/projects/p1/s1')), false, '空になったフォルダは消す');
  assert.equal(fs.existsSync(recent), true, '期限内は残す');
  assert.equal(fs.existsSync(otherKind), true, 'match に合わないファイルは残す');
  assert.equal(fs.existsSync(path.join(home, '.claude/projects')), true, 'root は消さない');
});

test('memory など excludeDirs と symlink の先には入らない (repo の .claude/memory を消さない)', (t) => {
  const { home, put } = homeFixture(t);
  const inMemory = put('.claude/projects/p1/memory/old.jsonl', 40);
  const outside = put('repo-memory/MEMORY.jsonl', 40);
  fs.symlinkSync(path.dirname(outside), path.join(home, '.claude/projects/p1/linked'));
  const entries = [{ root: '~/.claude/projects', match: '*.jsonl', ageDays: 7, excludeDirs: ['memory'] }];
  const plan = planFileRetention(entries, { home });
  assert.deepEqual(plan[0].files, []);
  pruneFiles(plan, entries, { home });
  assert.equal(fs.existsSync(inMemory), true);
  assert.equal(fs.existsSync(outside), true);
});

test('計画後に書き換わったファイル・設定に無い root・7 日未満の期限は消さない', (t) => {
  const { home, put } = homeFixture(t);
  const file = put('.codex/sessions/2026/old.jsonl', 40);
  const entries = [{ root: '~/.codex/sessions', match: '*', ageDays: 30 }];
  const plan = planFileRetention(entries, { home });
  fs.writeFileSync(file, 'appended after planning');
  assert.equal(pruneFiles(plan, entries, { home }).removedFiles, 0);
  assert.equal(fs.existsSync(file), true);
  assert.throws(() => pruneFiles(plan, [], { home }), /not configured/);
  assert.equal(planFileRetention([{ root: '~/.codex/sessions', ageDays: 1 }], { home })[0].skipped, 'ageDays must be >= 7');
});

test('容量上限を超えたパスを over にする', (t) => {
  const { home } = homeFixture(t);
  fs.mkdirSync(path.join(home, '.codex/generated_images'), { recursive: true });
  const GiB = 2 ** 30;
  const result = checkFootprint(
    [{ path: '~/.codex/generated_images', maxGiB: 2 }, { path: '~/missing', maxGiB: 1 }],
    { home, measureFn: () => 3 * GiB }
  );
  assert.deepEqual(result.map((r) => [r.path, r.over]), [['~/.codex/generated_images', true], ['~/missing', false]]);
});

test('設定の契約: 会話記録の DB と memory は保持期限の対象外、.local/r2 はフォルダ単位で古さを判定する', () => {
  const config = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '../../../..', LOCAL_RESOURCES), 'utf8'));
  for (const e of config.fileRetention) {
    assert.ok(e.ageDays >= 7, `${e.root} の期限が短すぎる`);
    assert.ok(!/thread_history|\.sqlite/.test(`${e.root} ${e.match}`), 'Codex の内部 DB を消さない');
  }
  const claude = config.fileRetention.find((e) => e.root === '~/.claude/projects');
  assert.ok(claude.excludeDirs.includes('memory'));
  const paths = config.cachePaths.map((e) => (typeof e === 'string' ? e : e.path));
  assert.ok(!paths.includes('.local/r2'), '.local/r2 全体の最新時刻で判定すると毎日の書き込みで永遠に古くならない');
  assert.ok(paths.includes('.local/r2/*'));
  const r2 = config.cachePaths.find((e) => e.path === '.local/r2/*');
  assert.ok(r2.exclude.includes('sns'), '未投稿の X / Threads 画像の唯一の置き場を自動で消さない');
  assert.ok(config.footprintBudgets.length >= 4);
});

test('cachePaths の exclude に合う名前は wildcard で広げても対象にしない', (t) => {
  const { root } = fixture(t);
  for (const name of ['gis', 'sns']) fs.mkdirSync(path.join(root, '.local/r2', name), { recursive: true });
  const config = { cacheAgeDays: 7, cachePaths: [{ path: '.local/r2/*', ageDays: 7, exclude: ['sns'] }], scratchRoots: {} };
  const targets = allowedTargets([root], config).map((x) => path.basename(x.target));
  assert.deepEqual(targets, ['gis']);
});
