import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const workflow = readFileSync(fileURLToPath(new URL('../../../../.github/workflows/deploy-workers.yml', import.meta.url)), 'utf8');

test('a metric migration verifies and publishes snapshots before building the app', () => {
  const verify = workflow.indexOf('npm run metrics:verify-snapshots');
  const publish = workflow.indexOf('push-exact-r2-assets.ts --manifest');
  const build = workflow.indexOf('run: npm run workers:build');
  assert.ok(verify > 0 && publish > verify && build > publish);
  assert.ok(workflow.includes('export-master-snapshots.ts --staged-metrics'));
  assert.ok(workflow.includes('group: r2-write'));
  assert.ok(workflow.includes('cancel-in-progress: false'));
});

test('the release allowlist includes cards and municipal presentation, excludes raw observations and unrelated assets', async () => {
  // デプロイは対象パスを共通の定義から読む (METRIC-RELEASE-PATHS-SSOT-01)。正規表現を workflow に直書きしない
  assert.ok(workflow.includes('import {RELEASE_KEY_PATTERN as allowed} from "./.github/scripts/metric-release-paths.mjs"'));
  assert.ok(!/const allowed = \//.test(workflow));
  const { RELEASE_KEY_PATTERN: allowed } = await import(new URL('../../../../.github/scripts/metric-release-paths.mjs', import.meta.url));
  // 期待する種類はここに直接書く。定義から 1 種類消すと落ちる
  for (const key of ['app/ranking/x/item.json', 'app/ranking-items/all.json', 'app/home/featured.json', 'app/municipalities/ranking/x/values.json', 'app/municipalities/ranking/x/item.json', 'app/municipalities/ranking/x/ai-content.json', 'app/areas/13000/cities/13101/databook.json', 'app/categories/all.json', 'app/categories/population/items.json', 'app/survey/all.json', 'app/survey/census/items.json', 'app/page-components/theme/climate.json']) assert.ok(allowed.test(key), key);
  for (const key of ['app/stats/x/values.json', 'app/ranking/x/values.json', 'app/blog/x/article.mdx', 'gis/x.json', 'app/page-components/../../secret.json']) assert.equal(allowed.test(key), false, key);
});

// DEPLOY-R2-AHEAD-OF-APP-01: 2026-10-21 (run 39589689158) に、R2 反映の後の Build が OpenNext の
// Next.js サポート期限の判定だけで落ち、次のデプロイまで旧版のアプリが新しいスナップショットを読んだ。
// Build は新しいスナップショットを読むので反映を Build の後へは移せない。代わりに、スナップショットの中身と
// 関係なく Build を落とす条件を反映より前に検査する。
const precheckScript = fileURLToPath(new URL('../../../../.github/scripts/check-build-preconditions.mjs', import.meta.url));

/** deploy job の step を、名前と本文の組へ分ける (順序は workflow の記述順 = 実行順)。 */
function deploySteps() {
  const job = workflow.slice(workflow.indexOf('\n  deploy:\n'));
  return job.split(/^ {6}- name: /m).slice(1).map((chunk) => ({ name: chunk.slice(0, chunk.indexOf('\n')).trim(), body: chunk }));
}

test('conditions that fail the build regardless of snapshot content are checked before the R2 publish', () => {
  const steps = deploySteps();
  const at = (needle) => steps.findIndex((step) => step.body.includes(needle));
  const precheck = at('node .github/scripts/check-build-preconditions.mjs');
  const auth = at('npx wrangler whoami');
  const publish = at('push-exact-r2-assets.ts --manifest');
  const build = at('run: npm run workers:build');
  assert.ok(precheck >= 0, 'deploy job に Build の前提条件を検査する段が無い');
  assert.ok(auth >= 0 && publish >= 0 && build >= 0);
  assert.ok(precheck < publish, 'Build の前提条件の検査は R2 反映より前に置く');
  assert.ok(auth < publish, 'Cloudflare の認証の検査は R2 反映より前に置く');
  assert.ok(publish < build, 'Build は新しいスナップショットを読むので、反映は Build より前のまま');
  // 前の段が落ちたら後の段は走らない、という GitHub Actions の既定に頼る。反映の段に if: を足すか、
  // 反映より前の段に continue-on-error を足すと、検査が落ちても反映が走るようになる。
  assert.equal(/^ {8}if:/m.test(steps[publish].body), false, 'R2 反映の段に if: を付けない');
  for (const step of steps.slice(0, publish)) {
    assert.equal(/^ {8}continue-on-error:/m.test(step.body), false, `反映より前の段 "${step.name}" に continue-on-error を付けない`);
  }
});

test('the precheck fails on the date-only condition that broke the build, and passes on the installed Next.js', () => {
  // Next.js 14 は 2025-10-26 にサポート期限を過ぎた。Build はこの版をコードの中身と関係なく拒否する
  const expired = spawnSync(process.execPath, [precheckScript, '--next-version', '14.2.35'], { encoding: 'utf8' });
  assert.equal(expired.status, 1, expired.stdout + expired.stderr);
  assert.match(expired.stderr, /14\.2\.35/);
  assert.match(expired.stderr, /R2/);
  // 今 apps/web に入っている版で落ちるなら、次のデプロイの Build も同じ判定で落ちる。PR の時点で赤にする
  const current = spawnSync(process.execPath, [precheckScript], { encoding: 'utf8' });
  assert.equal(current.status, 0, current.stdout + current.stderr);
});

// CI-TOOLING-FOLLOWUP-01: PR の Build Check は next build だけを走らせ、OpenNext の Build (workers:build) を
// 通らない。OpenNext のサポート期限の判定は next build では落ちないので、PR が緑のまま main へ入り、
// デプロイの検査で初めて赤になる。PR の build job でも同じ検査を next build より前に走らせる。
test('the PR build job runs the build precondition check before next build', () => {
  const pr = readFileSync(fileURLToPath(new URL('../../../../.github/workflows/pr-quality-check.yml', import.meta.url)), 'utf8');
  const start = pr.indexOf('\n  build:\n');
  assert.ok(start >= 0, 'pr-quality-check.yml に build job が無い');
  const rest = pr.slice(start + 1);
  const next = rest.slice(1).search(/^ {2}[\w-]+:\n/m);
  const job = next >= 0 ? rest.slice(0, next + 1) : rest;
  const steps = job.split(/^ {6}- name: /m).slice(1).map((chunk) => ({ name: chunk.slice(0, chunk.indexOf('\n')).trim(), body: chunk }));
  const precheck = steps.findIndex((step) => step.body.includes('run: node .github/scripts/check-build-preconditions.mjs'));
  const build = steps.findIndex((step) => step.body.includes('run: npm run build -w apps/web'));
  assert.ok(build >= 0, 'build job に next build の段が無い');
  assert.ok(precheck >= 0, 'PR の build job に Build の前提条件を検査する段が無い');
  assert.ok(precheck < build, 'Build の前提条件の検査は next build より前に置く (落ちる PR で Build の時間を使わない)');
  // 検査が落ちても job が緑になる書き方を止める
  assert.equal(/^ {8}if:/m.test(steps[precheck].body), false, '検査の段に if: を付けない');
  assert.equal(/^ {8}continue-on-error:\s*true/m.test(steps[precheck].body), false, '検査の段に continue-on-error: true を付けない');
});

// KAKEI-CATALOG-CI-01: metrics:check は check-metric-contract.ts と check-kakei-analysis-catalog.ts を続けて走らせるが、
// PR の CI は前者だけを動かしていた。合成の入力で検査する vitest だけでは、掲載先のページが非公開になった・
// 指標の絞り込みが変わった、を PR で止められない。metrics:check に入っている検査は PR の Static Gates でも全部走らせる。
test('the PR static gates run every check that metrics:check runs', () => {
  const pkg = JSON.parse(readFileSync(fileURLToPath(new URL('../../../../packages/data-configs/package.json', import.meta.url)), 'utf8'));
  const checks = [...pkg.scripts['metrics:check'].matchAll(/tsx (scripts\/[\w-]+\.ts)/g)].map((m) => m[1]);
  assert.ok(checks.includes('scripts/check-kakei-analysis-catalog.ts'), 'metrics:check に家計の分析単位の台帳の検査が無い');
  const pr = readFileSync(fileURLToPath(new URL('../../../../.github/workflows/pr-quality-check.yml', import.meta.url)), 'utf8');
  const start = pr.indexOf('\n  static-gates:\n');
  assert.ok(start >= 0, 'pr-quality-check.yml に static-gates job が無い');
  const rest = pr.slice(start + 1);
  const next = rest.slice(1).search(/^ {2}[\w-]+:\n/m);
  const job = next >= 0 ? rest.slice(0, next + 1) : rest;
  const steps = job.split(/^ {6}- name: /m).slice(1);
  for (const check of checks) {
    const step = steps.find((chunk) => chunk.includes(`npx tsx packages/data-configs/${check}`));
    assert.ok(step, `PR の Static Gates が ${check} を走らせていない`);
    assert.equal(/^ {8}if:/m.test(step), false, `${check} の段に if: を付けない`);
    assert.equal(/^ {8}continue-on-error:\s*true/m.test(step), false, `${check} の段に continue-on-error: true を付けない`);
  }
});
