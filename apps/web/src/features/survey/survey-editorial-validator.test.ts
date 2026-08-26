import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../../../..');
const TSX_CLI = path.join(ROOT, 'node_modules/tsx/dist/cli.mjs');
const VALIDATOR = path.join(
  ROOT,
  '.claude/scripts/surveys/validate-survey-portfolio.ts'
);
const tempDirs: string[] = [];

function runValidator(args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [TSX_CLI, VALIDATOR, '--json', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

afterEach(() => {
  for (const dir of tempDirs.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

describe('validate-survey-portfolio editorial gates', () => {
  it('通常実行でeditorial件数の悪化をratchetする', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'survey-editorial-ratchet-'));
    tempDirs.push(dir);
    const surveysPath = path.join(dir, 'surveys.json');
    writeFileSync(surveysPath, JSON.stringify([{ id: 'missing-editorial' }]));

    const result = runValidator([], {
      STATE_DIR: path.join(dir, 'state'),
      SURVEYS_JSON: surveysPath,
    });
    const output = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(output.violations).toContainEqual(
      '[S8] editorial 実装数 0 が ratchet 73 を下回る'
    );
  });

  it('--require-all-editorialでmaster全件の実装を要求する', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'survey-editorial-validator-'));
    tempDirs.push(dir);
    const surveysPath = path.join(dir, 'surveys.json');
    writeFileSync(
      surveysPath,
      JSON.stringify(
        Array.from({ length: 80 }, (_, i) => ({ id: `missing-${i + 1}` }))
      )
    );

    const result = runValidator(['--require-all-editorial'], {
      STATE_DIR: path.join(dir, 'state'),
      SURVEYS_JSON: surveysPath,
    });
    const output = JSON.parse(result.stdout);

    expect(result.status).toBe(1);
    expect(output.editorialImplemented).toBe(0);
    expect(output.editorialRequired).toBe(80);
    expect(output.violations).toContainEqual(
      expect.stringMatching(/^\[S8\] editorial 未実装 80 件:/)
    );
  });
});
