import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LOCAL_RESOURCES } from '../../../config/paths.mjs';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const CONFIG = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, LOCAL_RESOURCES),
    'utf8'
  )
);
const STATE = path.join(ROOT, '.local/resource-health');
const GiB = 2 ** 30;

export function assertInside(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target));
  if (
    !relative ||
    relative.startsWith(`..${path.sep}`) ||
    relative === '..' ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`Path outside approved root: ${target}`);
  }
}

export function assertNoLinks(root, target) {
  assertInside(root, target);
  let current = path.resolve(root);
  if (path.relative(current, fs.realpathSync(current)))
    throw new Error(`Redirected root: ${current}`);
  if (fs.lstatSync(current).isSymbolicLink())
    throw new Error(`Linked root: ${current}`);
  for (const part of path
    .relative(current, path.resolve(target))
    .split(path.sep)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink())
      throw new Error(`Linked path: ${current}`);
  }
}

export function scanTree(
  root,
  { deadline = Date.now() + CONFIG.scanTimeoutSeconds * 1000, onResult } = {}
) {
  function visit(dir) {
    if (Date.now() > deadline) throw new Error(`Scan timed out: ${root}`);
    const stat = fs.lstatSync(dir);
    const result = { bytes: 0, files: 0, newest: 0, links: 0 };
    if (stat.isSymbolicLink()) {
      result.links = 1;
    } else {
      result.newest = stat.mtimeMs;
      if (stat.isFile()) {
        result.bytes = stat.size;
        result.files = 1;
      } else {
        if (!stat.isDirectory()) throw new Error(`Special file: ${dir}`);
        for (const item of fs.readdirSync(dir)) {
          const child = visit(path.join(dir, item));
          result.bytes += child.bytes;
          result.files += child.files;
          result.links += child.links;
          result.newest = Math.max(result.newest, child.newest);
        }
      }
    }
    onResult?.(dir, result);
    return result;
  }
  return visit(root);
}

// Parent and child measurements share one traversal; never follow directory links.
export function scanTargets(directories) {
  const targets = [...new Set(directories.map((p) => path.resolve(p)))];
  const wanted = new Set(targets);
  const results = new Map();
  const attempted = [];
  for (const target of [...targets].sort((a, b) => a.length - b.length)) {
    if (results.has(target)) continue;
    const parent = attempted.find((p) => target.startsWith(p + path.sep));
    if (parent) {
      results.set(target, {
        error: `Parent scan incomplete or linked: ${parent}`,
      });
      continue;
    }
    attempted.push(target);
    try {
      scanTree(target, {
        onResult: (p, result) => {
          if (wanted.has(p)) results.set(p, result);
        },
      });
    } catch (error) {
      results.set(target, { error: error.message });
    }
  }
  return targets.map((target) => ({ target, ...results.get(target) }));
}

export function evaluate(sample, config = CONFIG) {
  const warnings = [];
  for (const [key, value, warn, critical] of [
    ['disk', sample.diskFreeBytes, config.diskWarnGiB, config.diskCriticalGiB],
    [
      'memory',
      sample.availableBytes,
      config.memoryWarnGiB,
      config.memoryCriticalGiB,
    ],
  ]) {
    if (!Number.isFinite(value)) warnings.push({ key, level: 'unknown' });
    else if (value / GiB < warn)
      warnings.push({
        key,
        level: value / GiB < critical ? 'critical' : 'warning',
      });
  }
  return warnings;
}

export function measure() {
  let runtime;
  if (process.platform === 'win32') {
    runtime = JSON.parse(
      execFileSync(
        'powershell.exe',
        [
          '-NoProfile',
          '-NonInteractive',
          '-File',
          path.join(ROOT, '.claude/scripts/lib/local-resource-probe.ps1'),
        ],
        {
          encoding: 'utf8',
          windowsHide: true,
          timeout: 20000,
          maxBuffer: 2 * 1024 * 1024,
        }
      )
    );
  } else {
    runtime = {
      physicalBytes: os.totalmem(),
      availableBytes: os.freemem(),
      processes: probeProcesses(),
    };
  }
  const disk = fs.statfsSync(ROOT);
  const sample = {
    observedAt: new Date().toISOString(),
    host: os.hostname(),
    diskFreeBytes: disk.bavail * disk.bsize,
    diskTotalBytes: disk.blocks * disk.bsize,
    ...runtime,
  };
  sample.warnings = evaluate(sample);
  return sample;
}

const BUSY_COMMAND =
  /(next[\\/]dist[\\/]bin[\\/]next|next-server|vitest[\\/]|typescript[\\/]bin[\\/]tsc|remotion[\\/]|turbo(?:\.exe)?["\s]+(?:run|watch))/;

export function isNodeProcess(p) {
  return /^node(?:\.exe)?$/i.test(p.name ?? '');
}

// POSIX counterpart of local-resource-probe.ps1 (same busy heuristic). Returns null when ps is
// unavailable so that assertIdle keeps refusing cleanup instead of guessing.
export function probeProcesses(psOutput) {
  let output = psOutput;
  if (output === undefined) {
    try {
      output = execFileSync('ps', ['-axo', 'pid=,rss=,command='], {
        encoding: 'utf8',
        timeout: 15000,
        maxBuffer: 8 * 1024 * 1024,
      });
    } catch {
      return null;
    }
  }
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = /^(\d+)\s+(\d+)\s+(.*)$/.exec(line);
      if (!match) return null;
      const command = match[3];
      const name = path.basename(command.split(/\s+/)[0] || '');
      return {
        pid: Number(match[1]),
        name,
        privateBytes: Number(match[2]) * 1024,
        busy: /^(node|workerd|turbo)/i.test(name) && BUSY_COMMAND.test(command),
        commandReadable: command.length > 0,
      };
    })
    .filter(Boolean);
}

function worktrees() {
  const output = execFileSync('git', ['worktree', 'list', '--porcelain'], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  });
  return [...output.matchAll(/^worktree (.+)$/gm)].map((match) =>
    path.resolve(match[1])
  );
}

// 登録済み worktree のうち「未コミット差分を抱えたまま scratchAgeDays 超放置」を検知する。
// 削除はしない (WIP を守る規約はそのまま) — 気づかれないまま忘れられる事故を防ぐ観測だけを追加する
// (2026-09-14: 09-08 起点の worktree 4 本が 6 日間気づかれず、中身は既に develop に着地済みだった)。
export function worktreeStatus(
  target,
  {
    root = ROOT,
    now = Date.now(),
    staleAfterDays = CONFIG.scratchAgeDays ?? 14,
  } = {}
) {
  let branch = null;
  try {
    const head = execFileSync(
      'git',
      ['-C', target, 'rev-parse', '--abbrev-ref', 'HEAD'],
      {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true,
      }
    ).trim();
    branch = head === 'HEAD' ? null : head; // detached HEAD
  } catch {
    branch = null;
  }
  let dirtyFiles = 0;
  try {
    const status = execFileSync(
      'git',
      ['-C', target, 'status', '--porcelain'],
      {
        encoding: 'utf8',
        timeout: 10000,
        windowsHide: true,
      }
    );
    dirtyFiles = status.split('\n').filter(Boolean).length;
  } catch {
    dirtyFiles = -1; // 計測不能 (worktree 自体が壊れている等)
  }
  const scan = scanTree(target);
  const ageDays = (now - scan.newest) / 86400000;
  return {
    target,
    root: target === root,
    branch,
    detached: branch === null,
    dirtyFiles,
    ageDays: Math.round(ageDays * 10) / 10,
    stale: target !== root && dirtyFiles > 0 && ageDays > staleAfterDays,
  };
}

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^$(){}|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/\\\\]*');
  return new RegExp('^' + escaped + '$');
}

// Only the last path segment may contain "*"; every segment above it is a literal directory.
function expandPattern(base, relative) {
  const segments = relative.split(/[\\/]+/).filter(Boolean);
  const last = segments.at(-1) ?? '';
  if (segments.slice(0, -1).some((segment) => segment.includes('*')))
    throw new Error(
      'Wildcard is only allowed in the last segment: ' + relative
    );
  if (!last.includes('*')) return [path.join(base, ...segments)];
  const parent = path.join(base, ...segments.slice(0, -1));
  if (!fs.existsSync(parent)) return [];
  const matcher = globToRegExp(last);
  return fs
    .readdirSync(parent)
    .filter((name) => matcher.test(name))
    .map((name) => path.join(parent, name));
}

function cacheEntries(config) {
  return config.cachePaths.map((entry) =>
    typeof entry === 'string'
      ? { path: entry, ageDays: config.cacheAgeDays, exclude: [] }
      : { path: entry.path, ageDays: entry.ageDays ?? config.cacheAgeDays, exclude: entry.exclude ?? [] }
  );
}

function scratchRoots(config, platform = process.platform) {
  return (config.scratchRoots?.[platform] ?? []).flatMap((root) => {
    try {
      // macOS /tmp is a symlink to /private/tmp; assertNoLinks needs the real directory.
      return [fs.realpathSync(root)];
    } catch {
      return [];
    }
  });
}

// Everything cleanup may touch: generated caches under each worktree root plus aged scratch
// directories directly under the OS scratch roots. A registered worktree is never scratch.
export function allowedTargets(
  roots,
  config = CONFIG,
  platform = process.platform
) {
  const targets = [];
  const resolvedRoots = roots.map((r) => path.resolve(r));
  for (const root of roots)
    for (const entry of cacheEntries(config)) {
      // exclude: wildcard で広げた対象のうち、名前が合うものは消さない (例: 未投稿の SNS 画像の唯一の置き場 .local/r2/sns)
      const excluded = entry.exclude.map(globToRegExp);
      for (const target of expandPattern(root, entry.path)) {
        if (excluded.some((re) => re.test(path.basename(target)))) continue;
        targets.push({ root, target, ageDays: entry.ageDays, kind: 'cache' });
      }
    }
  const prefix = config.scratchPrefix ?? '';
  const excludes = (config.scratchExclude ?? []).map(globToRegExp);
  for (const root of scratchRoots(config, platform)) {
    if (!fs.existsSync(root)) continue;
    for (const entry of config.scratchCachePaths ?? []) {
      for (const target of expandPattern(root, entry.path)) {
        assertInside(root, target);
        const resolved = path.resolve(target);
        if (
          resolvedRoots.some(
            (r) =>
              r === resolved ||
              r.startsWith(resolved + path.sep) ||
              resolved.startsWith(r + path.sep)
          )
        )
          continue;
        targets.push({
          root,
          target,
          ageDays: entry.ageDays ?? config.scratchAgeDays,
          kind: 'scratch',
        });
      }
    }
    for (const name of fs.readdirSync(root)) {
      if (!prefix || !name.startsWith(prefix)) continue;
      if (excludes.some((re) => re.test(name))) continue;
      const target = path.join(root, name);
      const resolved = path.resolve(target);
      if (
        resolvedRoots.some(
          (r) => r === resolved || r.startsWith(resolved + path.sep)
        )
      )
        continue;
      targets.push({
        root,
        target,
        ageDays: config.scratchAgeDays ?? config.cacheAgeDays,
        kind: 'scratch',
      });
    }
  }
  return targets;
}

export function planCaches(
  roots,
  { includeRecent = false, now = Date.now(), config = CONFIG } = {}
) {
  const items = [];
  for (const { root, target, ageDays, kind } of allowedTargets(roots, config)) {
    if (!fs.existsSync(target)) continue;
    try {
      assertNoLinks(root, target);
      const scan = scanTree(target);
      const old = scan.newest < now - ageDays * 86400000;
      items.push({
        root,
        target,
        kind,
        ageDays,
        ...scan,
        eligible: scan.links === 0 && (includeRecent || old),
        reason: scan.links
          ? 'contains-links'
          : old || includeRecent
            ? kind === 'scratch'
              ? 'aged-scratch'
              : 'generated-cache'
            : 'recent',
      });
    } catch (error) {
      items.push({
        root,
        target,
        kind,
        eligible: false,
        reason: error.message,
      });
    }
  }
  return items;
}

export function assertIdle(sample) {
  if (!Array.isArray(sample.processes))
    throw new Error('Process inspection unavailable; cleanup refused');
  const blockers = sample.processes.filter(
    (p) => p.busy || (isNodeProcess(p) && !p.commandReadable)
  );
  if (blockers.length)
    throw new Error(
      `Active or uninspectable developer processes: ${blockers.map((p) => p.pid).join(',')}`
    );
}

export function removeCache(item, roots, sample, config = CONFIG) {
  assertIdle(sample);
  if (!item.eligible) throw new Error('Cache is not eligible for cleanup');
  // Re-expand the allowlist at removal time: the planned path must still be one the config yields.
  const allowed = allowedTargets(roots, config).find(
    (a) =>
      path.resolve(a.root) === path.resolve(item.root) &&
      path.resolve(a.target) === path.resolve(item.target)
  );
  if (!allowed) throw new Error('Target is not an allowlisted generated cache');
  const root = allowed.root;
  assertNoLinks(root, item.target);
  const fresh = scanTree(item.target);
  if (
    fresh.links ||
    fresh.bytes !== item.bytes ||
    fresh.files !== item.files ||
    fresh.newest !== item.newest
  ) {
    throw new Error('Cache changed after planning; refusing deletion');
  }
  // Only this exact, validated generated-cache directory may be removed.
  fs.rmSync(item.target, { recursive: true, force: false });
  return fresh.bytes;
}

/** "~/" で始まる設定のパスはホーム、それ以外は repo 起点 */
export function resolveConfigPath(p, home = os.homedir()) {
  return p.startsWith('~/') ? path.join(home, p.slice(2)) : path.join(ROOT, p);
}

/**
 * ファイル単位の保持期限 (会話記録・生成画像など、フォルダに毎日書き足されて「フォルダの最新時刻」が
 * 古くならない場所用)。root 配下を辿り、match に合う ageDays 超のファイルだけを候補にする。
 * symlink・junction は辿らない (Claude の projects/<p>/memory は repo の .claude/memory を指すリンク)。
 * excludeDirs の名前のフォルダには入らない。root 自体が symlink・別の場所への転送なら何もしない。
 */
export function planFileRetention(
  entries = CONFIG.fileRetention ?? [],
  { now = Date.now(), home = os.homedir() } = {}
) {
  return entries.map((entry) => {
    const root = resolveConfigPath(entry.root, home);
    const item = { root, ageDays: entry.ageDays, files: [], bytes: 0 };
    if (!fs.existsSync(root)) return { ...item, skipped: 'missing' };
    if (!Number.isFinite(entry.ageDays) || entry.ageDays < 7)
      return { ...item, skipped: 'ageDays must be >= 7' };
    if (fs.lstatSync(root).isSymbolicLink() || path.relative(root, fs.realpathSync(root)))
      return { ...item, skipped: 'linked-root' };
    const matcher = globToRegExp(entry.match ?? '*');
    const exclude = new Set(entry.excludeDirs ?? []);
    const cutoff = now - entry.ageDays * 86400000;
    const visit = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        const stat = fs.lstatSync(full);
        if (stat.isSymbolicLink()) continue;
        if (stat.isDirectory()) {
          if (!exclude.has(name)) visit(full);
        } else if (stat.isFile() && matcher.test(name) && stat.mtimeMs < cutoff) {
          item.files.push({ file: full, mtimeMs: stat.mtimeMs, bytes: stat.size });
          item.bytes += stat.size;
        }
      }
    };
    visit(root);
    return item;
  });
}

/** planFileRetention の候補を消す。消す直前に場所・種類・更新時刻を確かめ直し、空になったフォルダも片付ける */
export function pruneFiles(plan, entries = CONFIG.fileRetention ?? [], { home = os.homedir() } = {}) {
  const roots = new Set(entries.map((e) => resolveConfigPath(e.root, home)));
  let removedBytes = 0;
  let removedFiles = 0;
  for (const item of plan) {
    if (!roots.has(item.root)) throw new Error(`Retention root is not configured: ${item.root}`);
    const touched = new Set();
    for (const { file, mtimeMs, bytes } of item.files) {
      assertNoLinks(item.root, file);
      const stat = fs.lstatSync(file);
      if (!stat.isFile() || stat.mtimeMs !== mtimeMs || stat.size !== bytes)
        continue; // 計画後に書き換わったファイルは消さない
      fs.unlinkSync(file);
      removedBytes += bytes;
      removedFiles += 1;
      touched.add(path.dirname(file));
    }
    // 消したファイルの親から root の手前まで、空になったフォルダだけを消す
    for (let dir of [...touched].sort((a, b) => b.length - a.length)) {
      while (dir !== item.root && dir.startsWith(item.root + path.sep)) {
        if (fs.readdirSync(dir).length) break;
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
      }
    }
  }
  return { removedBytes, removedFiles };
}

/** footprintBudgets の各パスの容量を測り、上限を超えたものを warning にする (肥大化の機械検知) */
export function checkFootprint(budgets = CONFIG.footprintBudgets ?? [], { home = os.homedir(), measureFn } = {}) {
  const measure = measureFn ?? ((p) => scanTree(p).bytes);
  return budgets.map((b) => {
    const target = resolveConfigPath(b.path, home);
    if (!fs.existsSync(target)) return { path: b.path, bytes: 0, maxGiB: b.maxGiB, over: false };
    const bytes = measure(target);
    return { path: b.path, bytes, maxGiB: b.maxGiB, over: bytes / GiB > b.maxGiB };
  });
}

function record(name, value) {
  fs.mkdirSync(STATE, { recursive: true });
  const destination = path.join(STATE, `${name}.json`);
  if (name === 'audit' && fs.existsSync(destination))
    fs.copyFileSync(destination, path.join(STATE, 'audit-previous.json'));
  const temporary = `${destination}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`);
  fs.renameSync(temporary, destination);
}

function recordSample(sample) {
  let history = [];
  const file = path.join(STATE, 'history.json');
  if (fs.existsSync(file)) history = JSON.parse(fs.readFileSync(file, 'utf8'));
  const day = sample.observedAt.slice(0, 10);
  const summary = {
    ...sample,
    processes: undefined,
    nodeCount: sample.processes?.filter(isNodeProcess).length,
    nodePrivateBytes: sample.processes
      ?.filter(isNodeProcess)
      .reduce((n, p) => n + p.privateBytes, 0),
  };
  record(
    'history',
    [
      ...history.filter((h) => h.observedAt.slice(0, 10) !== day),
      summary,
    ].slice(-CONFIG.historyDays)
  );
  record('latest', sample);
}

function acquireLock(lock) {
  try {
    return fs.openSync(lock, 'wx');
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const owner = JSON.parse(fs.readFileSync(lock, 'utf8'));
    if (!Number.isSafeInteger(owner.pid) || owner.pid < 1)
      throw new Error('Invalid resource lock; inspect before removing');
    try {
      process.kill(owner.pid, 0);
    } catch (probe) {
      if (probe.code !== 'ESRCH') throw probe;
      fs.unlinkSync(lock);
      return fs.openSync(lock, 'wx');
    }
    throw new Error(`Resource check already running (PID ${owner.pid})`);
  }
}

function audit(sample) {
  const directories = [
    ROOT,
    ...[
      '.turbo/cache',
      'node_modules',
      '.local',
      '.git',
      'books',
      '.claude/worktrees',
      ...cacheEntries(CONFIG).map((entry) =>
        entry.path.replace(/[\\/]\*$/, '')
      ),
    ].map((p) => path.join(ROOT, p)),
    ...worktrees().filter((p) => p !== ROOT),
    ...scratchRoots(CONFIG),
    path.join(os.tmpdir(), 'stats47-flood-view'),
    'C:/tmp/stats47-geo-ui',
    path.join(os.homedir(), '.codex'),
    path.join(os.homedir(), '.claude'),
    ...(process.platform === 'win32'
      ? ['npm-cache', 'ms-playwright', 'uv/cache'].map((p) =>
          path.join(os.homedir(), 'AppData/Local', p)
        )
      : []),
  ];
  const measurements = scanTargets(directories.filter((p) => fs.existsSync(p)));
  const staleWorktrees = worktrees()
    .filter((p) => p !== ROOT)
    .map((p) => worktreeStatus(p))
    .filter((w) => w.stale);
  return {
    observedAt: sample.observedAt,
    method: 'file-length, junctions not followed; hardlinks not deduplicated',
    measurements,
    protectedResidue: CONFIG.protectedPaths.filter((p) =>
      fs.existsSync(path.join(ROOT, p))
    ),
    staleWorktrees,
  };
}

export async function main(args = process.argv.slice(2)) {
  const mode = args[0] || 'check';
  if (!['check', 'audit', 'cleanup'].includes(mode))
    throw new Error(
      'Use check, audit, or cleanup [--apply] [--include-recent] [--gis-only] [--record]'
    );
  fs.mkdirSync(STATE, { recursive: true });
  const lock = path.join(STATE, 'run.lock');
  const fd = acquireLock(lock);
  fs.writeSync(
    fd,
    JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })
  );
  try {
    const sample = measure();
    const previousPath = path.join(STATE, 'latest.json');
    const previous = fs.existsSync(previousPath)
      ? JSON.parse(fs.readFileSync(previousPath, 'utf8'))
      : null;
    sample.alertChanged =
      JSON.stringify(previous?.warnings ?? []) !==
      JSON.stringify(sample.warnings);
    let result = sample;
    if (mode === 'audit') result = audit(sample);
    if (mode === 'cleanup') {
      const roots = worktrees();
      const plan = planCaches(roots, {
        includeRecent: args.includes('--include-recent'),
        config: args.includes('--gis-only')
          ? { ...CONFIG, cachePaths: [], scratchPrefix: '' }
          : CONFIG,
      });
      result = {
        observedAt: sample.observedAt,
        apply: args.includes('--apply'),
        plan,
        removedBytes: 0,
      };
      const gisOnly = args.includes('--gis-only');
      const retention = gisOnly ? [] : planFileRetention();
      result.fileRetention = retention.map(({ files, ...rest }) => ({ ...rest, fileCount: files.length }));
      if (result.apply) {
        assertIdle(sample);
        for (const item of plan.filter((p) => p.eligible))
          result.removedBytes += removeCache(item, roots, measure());
        const pruned = pruneFiles(retention);
        result.removedBytes += pruned.removedBytes;
        result.removedFiles = pruned.removedFiles;
        result.after = measure();
      }
      if (!gisOnly) {
        result.footprint = checkFootprint();
        const over = result.footprint.filter((f) => f.over);
        // 容量上限の超過は日次の記録 (latest.json の warnings) に載せ、点検の通知に乗せる
        const target = result.after ?? sample;
        target.warnings = [
          ...(target.warnings ?? []),
          ...over.map((f) => ({ key: `footprint:${f.path}`, level: 'warning', bytes: f.bytes, maxGiB: f.maxGiB })),
        ];
        for (const f of over)
          console.error(`[local-resources] 容量上限超過: ${f.path} ${(f.bytes / GiB).toFixed(1)}GiB > ${f.maxGiB}GiB`);
      }
    }
    if (args.includes('--record')) {
      const latestSample = result.after ?? sample;
      latestSample.alertChanged =
        JSON.stringify(previous?.warnings ?? []) !==
        JSON.stringify(latestSample.warnings);
      recordSample(latestSample);
      if (mode !== 'check') record(mode, result);
    }
    console.log(
      JSON.stringify(
        args.includes('--quiet') && mode === 'check'
          ? {
              observedAt: sample.observedAt,
              warnings: sample.warnings,
              alertChanged: sample.alertChanged,
            }
          : result,
        null,
        2
      )
    );
    return result;
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(lock);
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(`[local-resources] ${error.message}`);
    // A background audit or unavailable probe must not prevent starting development.
    process.exitCode = process.argv.includes('--advisory') ? 0 : 1;
  });
}
