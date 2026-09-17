import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { classifyPrQualityPaths } from '../plan-pr-quality.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

test('docsだけのPRは重いjobを起動しない', () => {
  const result = classifyPrQualityPaths(['docs/00_プロジェクト管理/example.md']);
  assert.deepEqual(Object.values(result), Array(Object.keys(result).length).fill(false));
});

test('webチャート変更はweb・unit・visualizationを選ぶ', () => {
  const result = classifyPrQualityPaths([
    'apps/web/src/components/stat-charts/Chart.tsx',
  ]);
  assert.equal(result.type_check, true);
  assert.equal(result.tests, true);
  assert.equal(result.web, true);
  assert.equal(result.visualization, true);
  assert.equal(result.admin, false);
  assert.equal(result.remotion, false);
});

test('adminだけの変更でweb buildを起動しない', () => {
  const result = classifyPrQualityPaths(['apps/admin/app/page.tsx']);
  assert.equal(result.admin, true);
  assert.equal(result.web, false);
  assert.equal(result.remotion, false);
});

test('共有依存の変更は利用アプリへ波及する', () => {
  const result = classifyPrQualityPaths(['packages/types/src/index.ts']);
  assert.equal(result.web, true);
  assert.equal(result.admin, true);
  assert.equal(result.remotion, true);
  assert.equal(result.packages, true);
});

test('CI本体変更は全jobを自己検証する', () => {
  const result = classifyPrQualityPaths(['.github/workflows/pr-quality-check.yml']);
  assert.deepEqual(Object.values(result), Array(Object.keys(result).length).fill(true));
});

test('GitのNUL区切り差分をGitHub Actions outputへ変換する', () => {
  const output = execFileSync(
    process.execPath,
    [path.join(ROOT, '.claude/scripts/lib/plan-pr-quality.mjs'), '--stdin0'],
    {
      input: Buffer.from('apps/admin/app/page.tsx\0docs/example.md\0'),
      encoding: 'utf8',
    },
  );
  assert.match(output, /^type_check=true$/m);
  assert.match(output, /^admin=true$/m);
  assert.match(output, /^web=false$/m);
});

test('PRは差分分類、週次は全数、ローカルcommitは全体型検査省略を明記する', () => {
  const pr = fs.readFileSync(path.join(ROOT, '.github/workflows/pr-quality-check.yml'), 'utf8');
  const weekly = fs.readFileSync(path.join(ROOT, '.github/workflows/quality-suite-weekly.yml'), 'utf8');
  const precommit = fs.readFileSync(path.join(ROOT, 'apps/web/scripts/pre-commit-checks.sh'), 'utf8');

  assert.match(pr, /plan-pr-quality\.mjs --stdin0/);
  assert.match(pr, /needs\.changes\.outputs\.visualization == 'true'/);
  assert.equal(
    (pr.match(/npm run build(?: -w | --workspace(?:=| ))apps\/web/g) ?? []).length,
    1,
    'PR内のweb buildは1回だけにする',
  );
  assert.match(pr, /name: pr-web-next-build/);
  assert.equal(
    (pr.match(/actions\/download-artifact@/g) ?? []).length,
    1,
    '代表E2Eはbuild artifactを再利用する (page-quality は 2026-09-18 に PR 必須から外した)',
  );
  assert.doesNotMatch(pr, /^  page-quality:$/m, 'page-quality は PR 必須 gate に戻さない (CI-SPEED-PAGE-QUALITY-DETERMINISTIC-01)');
  assert.match(pr, /tests\/e2e\/seo\/structured-data\.spec\.ts/);
  assert.doesNotMatch(pr, /contains\(needs\.\*\.result, 'skipped'\)/);
  assert.doesNotMatch(pr, /npm run test:coverage -w apps\/web/);
  assert.match(weekly, /schedule:/);
  assert.match(weekly, /npm run test:coverage -w apps\/web/);
  assert.match(weekly, /npx playwright test --project=e2e-chromium/);
  assert.match(weekly, /npm run build --workspace=apps\/remotion/);
  assert.match(weekly, /npm run test:e2e --workspace=apps\/admin/);
  assert.match(weekly, /needs: \[type-check, tests, admin-e2e, web-e2e\]/);
  assert.match(weekly, /gh issue (?:edit|comment)/);
  assert.match(weekly, /gh issue close/);
  assert.match(precommit, /PRECOMMIT_FULL_TYPECHECK/);
});
