#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '../../..');
const BASELINE_PATH = '.claude/config/money-unit-audit-baseline.json';

function summarizeRows(rows) {
  const unknown = new Map();
  let mismatches = 0;
  for (const row of rows) {
    if (row?.verdict?.kind === 'mismatch' || row?.verdict?.kind === 'combination-unit-mismatch') {
      mismatches += 1;
    }
    if (row?.verdict?.kind === 'skip') {
      const code = String(row.verdict.reason || 'unknown');
      unknown.set(code, (unknown.get(code) || 0) + 1);
    }
  }
  return { mismatches, unknown: Object.fromEntries([...unknown].sort()) };
}

function validateBaseline(baseline, now = new Date()) {
  const errors = [];
  if (!baseline || baseline.version !== 1 || !Array.isArray(baseline.unknown)) {
    return ['baseline schema is invalid'];
  }
  const seen = new Set();
  for (const entry of baseline.unknown) {
    if (typeof entry?.code !== 'string' || entry.code === '' || seen.has(entry.code)) {
      errors.push(`invalid or duplicate unknown code: ${String(entry?.code)}`);
      continue;
    }
    seen.add(entry.code);
    if (!Number.isSafeInteger(entry.count) || entry.count < 0) errors.push(`${entry.code}: count is invalid`);
    if (typeof entry.owner !== 'string' || entry.owner === '') errors.push(`${entry.code}: owner is missing`);
    if (typeof entry.reason !== 'string' || entry.reason === '') errors.push(`${entry.code}: reason is missing`);
    const expiresAt = Date.parse(`${entry.expiresAt}T23:59:59Z`);
    if (!Number.isFinite(expiresAt) || expiresAt < now.getTime()) {
      errors.push(`${entry.code}: expiresAt is invalid or expired`);
    }
  }
  return errors;
}

function compareToRuntime(summary, baseline) {
  const errors = [];
  if (summary.mismatches > 0) errors.push(`money-unit mismatch: ${summary.mismatches}`);
  const allowed = new Map(baseline.unknown.map((entry) => [entry.code, entry.count]));
  for (const [code, count] of Object.entries(summary.unknown)) {
    if (!allowed.has(code)) errors.push(`new unknown reason: ${code}=${count}`);
    else if (count > allowed.get(code)) errors.push(`unknown baseline exceeded: ${code}=${count}>${allowed.get(code)}`);
  }
  return errors;
}

function compareToBase(current, base) {
  if (!base) return [];
  const errors = [];
  const before = new Map(base.unknown.map((entry) => [entry.code, entry.count]));
  for (const entry of current.unknown) {
    if (!before.has(entry.code)) errors.push(`baseline addition is forbidden: ${entry.code}`);
    else if (entry.count > before.get(entry.code)) {
      errors.push(`baseline increase is forbidden: ${entry.code}=${entry.count}>${before.get(entry.code)}`);
    }
  }
  return errors;
}

function loadBaseBaseline(base) {
  if (!base) return null;
  const result = spawnSync('git', ['show', `${base}:${BASELINE_PATH}`], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    if (/does not exist|exists on disk, but not in/.test(result.stderr)) return null;
    throw new Error(`cannot read merge-base baseline: ${result.stderr.trim()}`);
  }
  return JSON.parse(result.stdout);
}

function main() {
  const args = process.argv.slice(2);
  const baseAt = args.indexOf('--base');
  const base = baseAt >= 0 ? args[baseAt + 1] : null;
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, BASELINE_PATH), 'utf8'));
  const errors = validateBaseline(baseline);
  let baseBaseline = null;
  try {
    baseBaseline = loadBaseBaseline(base);
  } catch (error) {
    errors.push(String(error));
  }
  errors.push(...compareToBase(baseline, baseBaseline));

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'stats47-money-unit-'));
  const output = path.join(temp, 'audit.json');
  const audit = spawnSync(
    'npx',
    ['tsx', 'packages/data-configs/scripts/audit-money-unit-scale.ts', '--json', output],
    { cwd: ROOT, encoding: 'utf8' },
  );
  if (audit.status !== 0 || !fs.existsSync(output)) {
    errors.push(`money-unit collector failed: ${audit.stderr.trim() || `exit ${audit.status}`}`);
  } else {
    const summary = summarizeRows(JSON.parse(fs.readFileSync(output, 'utf8')).rows || []);
    errors.push(...compareToRuntime(summary, baseline));
    process.stdout.write(
      `money-unit audit: mismatch=${summary.mismatches} / unknown=${JSON.stringify(summary.unknown)}\n`,
    );
  }
  fs.rmSync(temp, { recursive: true, force: true });

  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`✗ ${error}\n`);
    process.exitCode = 1;
  }
}

if (require.main === module) main();

module.exports = { compareToBase, compareToRuntime, summarizeRows, validateBaseline };
