#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const YAML = require('yaml');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '../../..');
const REGISTRY = '.claude/config/quality-exceptions.json';
const TEXT_EXT = /\.(?:[cm]?[jt]sx?)$/;
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', '.next', '.local', 'coverage']);

function normalize(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && EXCLUDED_DIRS.has(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : TEXT_EXT.test(entry.name) ? [file] : [];
  });
}

function inventoryKey(entry) {
  return `${entry.type}:${entry.path}${entry.detail ? `:${entry.detail}` : ''}`;
}

function add(inventory, entry) {
  const entryKey = inventoryKey(entry);
  inventory.set(entryKey, (inventory.get(entryKey) || 0) + (entry.count || 1));
}

function collectQualityExceptions() {
  const inventory = new Map();

  const workflowDir = path.join(ROOT, '.github/workflows');
  for (const name of fs.readdirSync(workflowDir).filter((value) => /\.ya?ml$/.test(value))) {
    const relative = `.github/workflows/${name}`;
    const workflow = YAML.parse(fs.readFileSync(path.join(workflowDir, name), 'utf8'));
    let count = 0;
    for (const job of Object.values(workflow?.jobs || {})) {
      for (const step of job?.steps || []) if (step?.['continue-on-error'] === true) count += 1;
    }
    if (count > 0) add(inventory, { type: 'continue-on-error', path: relative, count });
  }

  const sourceFiles = [
    ...[path.join(ROOT, 'apps'), path.join(ROOT, 'packages')].flatMap(walk),
    path.join(ROOT, 'vitest.config.ts'),
  ];
  for (const file of sourceFiles) {
    const relative = normalize(file);
    const source = fs.readFileSync(file, 'utf8');
    const skipCount = [...source.matchAll(/\b(?:test|it|describe)\.(?:skip|skipIf)\s*\(/g)].length;
    if (skipCount > 0) add(inventory, { type: 'test-skip', path: relative, count: skipCount });

    if (/vitest\.(?:config|setup)\.[cm]?[jt]s$/.test(relative) || skipCount > 0) {
      const variables = new Set(
        [...source.matchAll(/process\.env\.([A-Z][A-Z0-9_]*(?:TESTS|OUTPUTS))/g)].map((match) => match[1]),
      );
      for (const variable of variables) add(inventory, { type: 'env-opt-in', path: relative, detail: variable });
    }

    if (/vitest\.config\.[cm]?[jt]s$/.test(relative)) {
      const meaningful = new Set(
        [...source.matchAll(/(["'])([^"'\\]*(?:\\.[^"'\\]*)*)\1/g)]
          .map((match) => match[2])
          .filter((value) => /manual-download|note-channel|integration\.test|tests\/(?:e2e|smoke|visual)/.test(value)),
      );
      for (const pattern of meaningful) add(inventory, { type: 'test-exclude', path: relative, detail: pattern });
    }
  }

  const renderContract = path.join(
    ROOT,
    'packages/visualization/src/shared/__tests__/helpers/render-test-contract.ts',
  );
  const renderSource = fs.readFileSync(renderContract, 'utf8');
  const list = renderSource.match(/OPT_IN_RENDER_TEST_FILES\s*=\s*\[([\s\S]*?)\]\s*as const/)?.[1] || '';
  const renderCount = [...list.matchAll(/["'][^"']+\.test\.tsx["']/g)].length;
  if (renderCount > 0) {
    add(inventory, {
      type: 'test-exclude',
      path: normalize(renderContract),
      detail: 'OPT_IN_RENDER_TEST_FILES',
      count: renderCount,
    });
  }
  return inventory;
}

function auditExceptionRegistry(entries, actual, now = new Date()) {
  const errors = [];
  const declared = new Map();
  for (const entry of entries) {
    const entryKey = inventoryKey(entry);
    if (declared.has(entryKey)) errors.push(`${entryKey}: duplicate exception`);
    declared.set(entryKey, entry);
    if (!Number.isInteger(entry.count) || entry.count < 1) errors.push(`${entryKey}: invalid count`);
    if (!entry.owner || !entry.reason) errors.push(`${entryKey}: owner and reason are required`);
    const expiry = Date.parse(`${entry.expiresAt}T23:59:59Z`);
    if (!Number.isFinite(expiry) || expiry < now.getTime()) errors.push(`${entryKey}: expired exception`);
  }
  for (const [actualKey, count] of actual) {
    const entry = declared.get(actualKey);
    if (!entry) errors.push(`${actualKey}: unregistered quality exception (${count})`);
    else if (count > entry.count) errors.push(`${actualKey}: exception count increased ${entry.count}->${count}`);
  }
  return errors;
}

function auditRegistryGrowth(current, previous) {
  const errors = [];
  const old = new Map(previous.map((entry) => [inventoryKey(entry), entry.count]));
  for (const entry of current) {
    const oldCount = old.get(inventoryKey(entry));
    if (oldCount === undefined) errors.push(`${inventoryKey(entry)}: exception added`);
    else if (entry.count > oldCount) errors.push(`${inventoryKey(entry)}: exception baseline increased ${oldCount}->${entry.count}`);
  }
  return errors;
}

function main() {
  const registry = JSON.parse(fs.readFileSync(path.join(ROOT, REGISTRY), 'utf8'));
  const errors = auditExceptionRegistry(registry.exceptions || [], collectQualityExceptions());
  const baseFlag = process.argv.indexOf('--base');
  if (baseFlag >= 0) {
    const base = process.argv[baseFlag + 1];
    try {
      const previous = JSON.parse(
        childProcess.execFileSync('git', ['show', `${base}:${REGISTRY}`], { cwd: ROOT, encoding: 'utf8' }),
      );
      errors.push(...auditRegistryGrowth(registry.exceptions || [], previous.exceptions || []));
    } catch (error) {
      if (!String(error.stderr || error.message).includes('exists on disk, but not in')) {
        errors.push(`exception registry comparison failed: ${error.message}`);
      }
    }
  }
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`✗ ${error}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`quality exceptions: ${registry.exceptions.length} registered / no increase\n`);
}

if (require.main === module) main();
module.exports = { auditExceptionRegistry, auditRegistryGrowth, collectQualityExceptions, inventoryKey };
