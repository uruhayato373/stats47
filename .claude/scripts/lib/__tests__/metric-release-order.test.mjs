import assert from 'node:assert/strict';
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
