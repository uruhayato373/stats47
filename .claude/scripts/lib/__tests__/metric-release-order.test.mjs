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

test('the release allowlist includes cards and municipal presentation, excludes raw observations and unrelated assets', () => {
  const literal = workflow.match(/const allowed = (\/.+\/);/)[1];
  const allowed = Function('return ' + literal)();
  for (const key of ['app/ranking/x/item.json', 'app/ranking-items/all.json', 'app/home/featured.json', 'app/municipalities/ranking/x/values.json', 'app/page-components/theme/climate.json']) assert.ok(allowed.test(key), key);
  for (const key of ['app/stats/x/values.json', 'app/ranking/x/values.json', 'app/blog/x/article.mdx', 'gis/x.json', 'app/page-components/../../secret.json']) assert.equal(allowed.test(key), false, key);
});
