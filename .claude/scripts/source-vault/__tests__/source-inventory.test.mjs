import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../../..');
const SCRIPT = path.join(
  PROJECT_ROOT,
  '.claude/scripts/source-vault/source-inventory.mjs'
);
const STATE_ROOT = path.join(
  PROJECT_ROOT,
  '.claude/state/source-inventory'
);

test('all reference inventories have 100% resolution coverage', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [SCRIPT, 'check-all'],
    { cwd: PROJECT_ROOT }
  );
  const checked = JSON.parse(stdout);
  assert.equal(checked.length, 4);
  for (const profile of checked) {
    assert.equal(profile.valid, true);
    assert.equal(profile.coverage, 1);
    assert.ok(profile.items > 0);
  }
});

test('Japan Zue inventory preserves the audited full-candidate denominator', async () => {
  const inventoryPath = path.join(
    STATE_ROOT,
    'japan-zue/2025-26/inventory.json'
  );
  const summary = JSON.parse(
    await readFile(
      path.join(STATE_ROOT, 'japan-zue/2025-26/summary.json'),
      'utf8'
    )
  );
  assert.equal(summary.itemCount, 1429);
  assert.deepEqual(summary.byKind, {
    table: 769,
    figure: 202,
    'text-stat': 458,
  });
  assert.equal(summary.resolutionCoverage, 1);
  assert.ok((await stat(inventoryPath)).size < 1024 * 1024);
});

test('committed inventories contain no book body, OCR body, or local path', async () => {
  const profiles = [
    'japan-zue/2025-26',
    'prefecture-deviation/2018',
    'prefecture-databook/2021',
    'claude-skills-guide/2026',
  ];
  for (const profile of profiles) {
    const inventory = await readFile(
      path.join(STATE_ROOT, profile, 'inventory.json'),
      'utf8'
    );
    assert.doesNotMatch(
      inventory,
      /OCR本文|rawText|transcriptText|bookValue|scanPath|stats47-source-vault|\/Users\//
    );
  }
});
