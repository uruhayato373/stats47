#!/usr/bin/env node
/** Restore only canonical consumer inputs, never sessions/logs or arbitrary paths. */
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { readVault } from './vault.mjs';
import { sourceFor } from './sources.mjs';
import { consumerPath, validateAttempt, validateEvidence, validateInventoryAttempt } from './consumer-paths.mjs';
import { kdpMonthlyVaultKey, archivedKdpMonthlyReport } from './kdp-monthly-reports.mjs';
import { validateNoteInventory } from './note-inventory.mjs';

const source = process.argv[2];
const config = sourceFor(source);
if (process.argv.includes('--if-activated')) {
  const path = '.claude/state/metrics/authenticated/latest.json';
  const activated = existsSync(path) && JSON.parse(readFileSync(path, 'utf8')).sources?.some(s => s.source === source && s.activated === true);
  if (!activated) {
    console.log(JSON.stringify({ source, status: 'not_activated', reason: 'First successful cloud collection required; existing consumer freshness gates remain active.' }));
    process.exit(0);
  }
}
try {
  const monthIndex = process.argv.indexOf('--month');
  const inventoryOnly = process.argv.includes('--inventory-only');
  if (inventoryOnly && (source !== 'note' || monthIndex >= 0)) throw new Error('inventory_restore_note_only');
  if (monthIndex >= 0) {
    if (source !== 'kdp') throw new Error('monthly_restore_kdp_only');
    const month = process.argv[monthIndex + 1];
    const report = archivedKdpMonthlyReport(await readVault(kdpMonthlyVaultKey(month)), month);
    const target = resolve(`.local/authenticated-measurement/restored/kdp-monthly-${month}.json`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ source, status: 'restored_historical', month, files: 1 }));
    process.exit(0);
  }
  const attempt = await readVault(`${source}/latest-attempt`);
  if (inventoryOnly) {
    validateInventoryAttempt(attempt);
    const key = attempt.status === 'pass' ? `${source}/latest-success`
      : `${source}/runs/day-${Math.floor(Date.parse(attempt.observedAt) / 86400000) % 30}`;
    const evidence = await readVault(key);
    validateEvidence(attempt, evidence, source);
    const prefix = `.local/authenticated-measurement/note-${attempt.runId}/note/`;
    const parse = name => JSON.parse(Buffer.from(evidence.files[`${prefix}${name}`], 'base64').toString('utf8'));
    const inventory = validateNoteInventory(parse('latest.json'), parse('cover-metrics-latest.json'));
    const target = resolve('.local/authenticated-measurement/restored/note-inventory.json');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, JSON.stringify({ ...inventory, observedAt: evidence.observedAt }, null, 2) + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ source, status: 'restored_inventory_only', files: 1, completeForKpi: false }));
    process.exit(0);
  }
  validateAttempt(attempt, Date.now(), source);
  const evidence = await readVault(`${source}/latest-success`);
  validateEvidence(attempt, evidence, source);
  let restored = 0;
  for (const [path, bytes] of Object.entries(evidence.files)) {
    const target = consumerPath(source, path);
    if (!target) continue;
    const absolute = resolve(target);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, Buffer.from(bytes, 'base64'), { mode: 0o600 });
    restored++;
  }
  if (restored === 0) throw new Error('consumer_evidence_missing');
  console.log(JSON.stringify({ source, status: 'restored', files: restored, observedAt: evidence.observedAt }));
} catch {
  console.error(JSON.stringify({ source, status: 'unavailable', instruction: config.transport === 'api'
    ? `Check authenticated-measurement summary; verify ${config.apiSecret} if api_auth_required.`
    : 'Check authenticated-measurement summary; refresh the named session if auth_required.' }));
  process.exitCode = 1;
}
