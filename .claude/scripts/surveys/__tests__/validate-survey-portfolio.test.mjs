import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../../../../', import.meta.url)));
const TSX_CLI = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
const VALIDATOR = path.join(ROOT, '.claude/scripts/surveys/validate-survey-portfolio.ts');
const tempDirs = [];
// CIのcold startではtsx起動と80調査の全量検証が10秒を超えるため、CLI統合テストだけに適用する。
// Windows では 1 回 41 秒かかり 30 秒で毎回落ちていた (2026-10-27 実測) ので 90 秒にする。
const CLI_TEST_TIMEOUT_MS = 90_000;

function runValidator(args, env = {}) {
  return spawnSync(process.execPath, [TSX_CLI, VALIDATOR, '--json', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('validate-survey-portfolio editorial gates', () => {
  it('通常実行でeditorial件数の悪化をratchetする', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'survey-editorial-ratchet-'));
    tempDirs.push(dir);
    const surveysPath = path.join(dir, 'surveys.json');
    writeFileSync(surveysPath, JSON.stringify([{ id: 'missing-editorial' }]));

    const result = runValidator([], { STATE_DIR: path.join(dir, 'state'), SURVEYS_JSON: surveysPath });
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 1);
    assert.ok(output.violations.includes('[S8] editorial 実装数 0 が ratchet 88 を下回る'));
  });

  it('--require-all-editorialでmaster全件の実装を要求する', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'survey-editorial-validator-'));
    tempDirs.push(dir);
    const surveysPath = path.join(dir, 'surveys.json');
    writeFileSync(surveysPath, JSON.stringify(Array.from({ length: 80 }, (_, i) => ({ id: `missing-${i + 1}` }))));

    const result = runValidator(['--require-all-editorial'], { STATE_DIR: path.join(dir, 'state'), SURVEYS_JSON: surveysPath });
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 1);
    assert.equal(output.editorialImplemented, 0);
    assert.equal(output.editorialRequired, 80);
    assert.ok(output.violations.some((v) => /^\[S8\] editorial 未実装 80 件:/.test(v)));
  });

  it('通常CI経路で編集情報の下限と追加資料の品質を検証する', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
    const result = runValidator([]);
    const output = JSON.parse(result.stdout);

    assert.equal(result.status, 0, result.stdout || result.stderr);
    assert.ok(output.editorialImplemented >= 88);
    assert.equal(output.editorialRequired, 88);
    assert.deepEqual(output.violations, []);
  });
});
