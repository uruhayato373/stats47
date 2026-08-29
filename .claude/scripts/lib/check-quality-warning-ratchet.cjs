#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '../../..');
const BASELINE = '.claude/config/quality-warning-baseline.json';
const COMMANDS = {
  'theme-catalog': ['validate:catalog'],
  polarity: ['validate:polarity'],
  'metric-config': ['validate:config'],
};

function key(entry) {
  return `${entry.source}:${entry.code}`;
}

function parseTally(text) {
  const counts = new Map();
  for (const match of text.matchAll(/\b([a-z][a-z-]+)=(\d+)\b/g)) {
    counts.set(match[1], Number(match[2]));
  }
  return counts;
}

function collectWarningCountsFromOutput(source, output) {
  const counts = new Map();
  if (source === 'theme-catalog') {
    const line = output.split(/\r?\n/).find((value) => value.includes('warn 内訳:')) || '';
    for (const [code, count] of parseTally(line)) counts.set(`${source}:${code}`, count);
    return counts;
  }
  if (source === 'polarity') {
    const match = output.match(/\[polarity-unassigned\][^\n]*?(\d+)\s*件\s*\/\s*収載/);
    if (match) counts.set(`${source}:polarity-unassigned`, Number(match[1]));
    return counts;
  }
  if (source === 'metric-config') {
    const tally = output.split(/\r?\n/).find((value) => value.includes('warn 内訳:')) || '';
    const unit = output.match(/\[unit-vocab\][^\n]*?\/\s*(\d+)\s*件/);
    if (unit) counts.set(`${source}:unit-vocab`, Number(unit[1]));
    const tallied = parseTally(tally);
    for (const [code, count] of tallied) {
      if (code !== 'unit-vocab') counts.set(`${source}:${code}`, count);
    }
  }
  return counts;
}

function auditWarningBaseline(entries, actual, now = new Date()) {
  const errors = [];
  const declared = new Map();
  for (const entry of entries) {
    const entryKey = key(entry);
    if (declared.has(entryKey)) errors.push(`${entryKey}: duplicate baseline entry`);
    declared.set(entryKey, entry);
    if (!COMMANDS[entry.source]) errors.push(`${entryKey}: unknown warning source`);
    if (!Number.isInteger(entry.count) || entry.count < 0) errors.push(`${entryKey}: invalid count`);
    if (!entry.owner || !entry.reason) errors.push(`${entryKey}: owner and reason are required`);
    const expiry = Date.parse(`${entry.expiresAt}T23:59:59Z`);
    if (!Number.isFinite(expiry) || expiry < now.getTime()) errors.push(`${entryKey}: expired exception`);
  }
  for (const [actualKey, count] of actual) {
    const entry = declared.get(actualKey);
    if (!entry) errors.push(`${actualKey}: new warning code (${count})`);
    else if (count > entry.count) errors.push(`${actualKey}: warning increased ${entry.count}->${count}`);
  }
  for (const [entryKey, entry] of declared) {
    if (!actual.has(entryKey) && entry.count > 0) errors.push(`${entryKey}: warning output missing`);
  }
  return errors;
}

function auditBaselineGrowth(current, previous) {
  const errors = [];
  const old = new Map(previous.map((entry) => [key(entry), entry.count]));
  for (const entry of current) {
    const previousCount = old.get(key(entry));
    if (previousCount === undefined) errors.push(`${key(entry)}: baseline code added`);
    else if (entry.count > previousCount) errors.push(`${key(entry)}: baseline increased ${previousCount}->${entry.count}`);
  }
  return errors;
}

function runValidator(script) {
  return childProcess.execFileSync(
    'npm',
    ['run', script, '--workspace=@stats47/data-configs'],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function main() {
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, BASELINE), 'utf8'));
  const actual = new Map();
  for (const [source, [script]] of Object.entries(COMMANDS)) {
    const output = runValidator(script);
    for (const [warningKey, count] of collectWarningCountsFromOutput(source, output)) {
      actual.set(warningKey, count);
    }
  }
  const errors = auditWarningBaseline(baseline.warnings || [], actual);
  const baseFlag = process.argv.indexOf('--base');
  if (baseFlag >= 0) {
    const base = process.argv[baseFlag + 1];
    try {
      const previous = JSON.parse(
        childProcess.execFileSync('git', ['show', `${base}:${BASELINE}`], { cwd: ROOT, encoding: 'utf8' }),
      );
      errors.push(...auditBaselineGrowth(baseline.warnings || [], previous.warnings || []));
    } catch (error) {
      if (!String(error.stderr || error.message).includes('exists on disk, but not in')) {
        errors.push(`baseline comparison failed: ${error.message}`);
      }
    }
  }
  if (errors.length > 0) {
    for (const error of errors) process.stderr.write(`✗ ${error}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(`quality warning ratchet: ${actual.size} codes / no increase\n`);
}

if (require.main === module) main();
module.exports = {
  auditBaselineGrowth,
  auditWarningBaseline,
  collectWarningCountsFromOutput,
};
