import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);
const CONFIG = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, '.claude/config/local-resources.json'),
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
  { deadline = Date.now() + CONFIG.scanTimeoutSeconds * 1000 } = {}
) {
  let bytes = 0,
    files = 0,
    newest = 0,
    links = 0;
  function visit(dir) {
    if (Date.now() > deadline) throw new Error(`Scan timed out: ${root}`);
    const stat = fs.lstatSync(dir);
    if (stat.isSymbolicLink()) {
      links++;
      return;
    }
    newest = Math.max(newest, stat.mtimeMs);
    if (stat.isFile()) {
      bytes += stat.size;
      files++;
      return;
    }
    if (!stat.isDirectory()) throw new Error(`Special file: ${dir}`);
    for (const item of fs.readdirSync(dir)) visit(path.join(dir, item));
  }
  visit(root);
  return { bytes, files, newest, links };
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
      processes: null,
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

export function planCaches(
  roots,
  { includeRecent = false, now = Date.now() } = {}
) {
  const items = [];
  for (const root of roots)
    for (const relative of CONFIG.cachePaths) {
      const target = path.join(root, relative);
      if (!fs.existsSync(target)) continue;
      try {
        assertNoLinks(root, target);
        const scan = scanTree(target);
        const old = scan.newest < now - CONFIG.cacheAgeDays * 86400000;
        items.push({
          root,
          target,
          ...scan,
          eligible: scan.links === 0 && (includeRecent || old),
          reason: scan.links
            ? 'contains-links'
            : old || includeRecent
              ? 'generated-cache'
              : 'recent',
        });
      } catch (error) {
        items.push({ root, target, eligible: false, reason: error.message });
      }
    }
  return items;
}

export function assertIdle(sample) {
  if (!Array.isArray(sample.processes))
    throw new Error('Process inspection unavailable; cleanup refused');
  const blockers = sample.processes.filter(
    (p) => p.busy || (p.name === 'node.exe' && !p.commandReadable)
  );
  if (blockers.length)
    throw new Error(
      `Active or uninspectable developer processes: ${blockers.map((p) => p.pid).join(',')}`
    );
}

export function removeCache(item, roots, sample) {
  assertIdle(sample);
  if (!item.eligible) throw new Error('Cache is not eligible for cleanup');
  const root = roots.find((r) => path.resolve(r) === path.resolve(item.root));
  if (
    !root ||
    !CONFIG.cachePaths.some(
      (p) => path.resolve(root, p) === path.resolve(item.target)
    )
  ) {
    throw new Error('Target is not an allowlisted generated cache');
  }
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
    nodeCount: sample.processes?.filter((p) => p.name === 'node.exe').length,
    nodePrivateBytes: sample.processes
      ?.filter((p) => p.name === 'node.exe')
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
      ...CONFIG.cachePaths,
    ].map((p) => path.join(ROOT, p)),
    ...worktrees().filter((p) => p !== ROOT),
    path.join(os.tmpdir(), 'stats47-flood-view'),
    'C:/tmp/stats47-geo-ui',
    ...(process.platform === 'win32'
      ? ['npm-cache', 'ms-playwright', 'uv/cache'].map((p) =>
          path.join(os.homedir(), 'AppData/Local', p)
        )
      : []),
  ];
  const measurements = directories
    .filter((p) => fs.existsSync(p))
    .map((target) => {
      try {
        return { target, ...scanTree(target) };
      } catch (error) {
        return { target, error: error.message };
      }
    });
  return {
    observedAt: sample.observedAt,
    method: 'file-length, junctions not followed; hardlinks not deduplicated',
    measurements,
    protectedResidue: CONFIG.protectedPaths.filter((p) =>
      fs.existsSync(path.join(ROOT, p))
    ),
  };
}

export async function main(args = process.argv.slice(2)) {
  const mode = args[0] || 'check';
  if (!['check', 'audit', 'cleanup'].includes(mode))
    throw new Error(
      'Use check, audit, or cleanup [--apply] [--include-recent] [--record]'
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
      });
      result = {
        observedAt: sample.observedAt,
        apply: args.includes('--apply'),
        plan,
        removedBytes: 0,
      };
      if (result.apply) {
        assertIdle(sample);
        for (const item of plan.filter((p) => p.eligible))
          result.removedBytes += removeCache(item, roots, measure());
        result.after = measure();
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
