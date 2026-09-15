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
  assert.equal(checked.length, 12);
  // S4 台帳に到達した profile は coverage 100%、未到達 (S0〜S3) は pending として列挙される
  const built = checked.filter((profile) => profile.inventory !== 'pending');
  const pending = checked.filter((profile) => profile.inventory === 'pending');
  assert.deepEqual(
    built.map((profile) => profile.profile).sort(),
    ['amusement-shop-density', 'average-income-ranking', 'capital-city-guide', 'claude-skills-guide-2026', 'gis-business-guide', 'japan-zue', 'kakei-marketing-2015', 'money-health-ranking', 'prefecture-databook-2021', 'prefecture-deviation', 'prefecture-ranking-consumption', 'yabai-kenmin-ranking']
  );
  assert.equal(pending.length, 0);
  for (const profile of built) {
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

test('prefecture-deviation inventory resolves per authored analysis, not a rights-hold monoculture', async () => {
  // 2026-09-15 までは書誌確定前の暫定判定として全103ページを一律 rights-hold にしていた。
  // 家計調査(2016年)ベースの品目別統計等、公式一次資料へ接続できるページが大半であることが
  // 個別ページの再検証で判明したため、prefectureDeviationAnalyses() 経由の解決に置き換えた。
  const summary = JSON.parse(
    await readFile(
      path.join(STATE_ROOT, 'prefecture-deviation/2018/summary.json'),
      'utf8'
    )
  );
  assert.equal(summary.itemCount, 103);
  assert.equal(summary.resolutionCoverage, 1);
  assert.notEqual(summary.byResolution['rights-hold'], 103);
  assert.ok(!('rights-hold' in summary.byResolution));
  assert.ok(
    (summary.byResolution['combined-analysis'] ?? 0) > 0,
    'expected at least one page resolved via an official primary source'
  );
});

test('committed inventories contain no book body, OCR body, or local path', async () => {
  const profiles = [
    'japan-zue/2025-26',
    'prefecture-deviation/2018',
    'prefecture-databook/2021',
    'claude-skills-guide/2026',
    'kakei-marketing/2015',
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
