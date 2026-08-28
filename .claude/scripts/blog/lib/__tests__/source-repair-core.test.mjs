import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  parseSourceRepairPayload,
  resolveCasJsonWrite,
  sha256Text,
} from '../source-repair-core.mjs';

test('base64 JSON payloadを件数上限内で解釈する', () => {
  const encoded = Buffer.from(JSON.stringify([{ slug: 'a' }])).toString(
    'base64'
  );
  assert.deepEqual(parseSourceRepairPayload(encoded), [{ slug: 'a' }]);
  assert.throws(() => parseSourceRepairPayload('not-base64!'), /base64/);
});

test('Node 20 + tsx の package namespace からtaxonomy resolverを復元できる', () => {
  const code = `
    import * as dataConfigModule from '@stats47/data-configs';
    import * as surveyTaxonomyModule from './packages/ranking/src/survey/survey-taxonomy.ts';
    const dataConfig = dataConfigModule.default ?? dataConfigModule;
    const surveyTaxonomy = surveyTaxonomyModule.default ?? surveyTaxonomyModule;
    if (!dataConfig.METRICS_REGISTRY) throw new Error('METRICS_REGISTRY missing');
    if (typeof surveyTaxonomy.resolveBlogChartSurveyTaxonomy !== 'function') {
      throw new Error('resolveBlogChartSurveyTaxonomy missing');
    }
  `;
  const result = spawnSync(
    process.execPath,
    ['--import', 'tsx', '--input-type=module', '--eval', code],
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('新規objectはexpected hashなしでcreateする', () => {
  assert.deepEqual(
    resolveCasJsonWrite({
      currentContent: null,
      nextContent: '{}\n',
      expectedSha256: null,
      label: 'new',
    }),
    { action: 'create', beforeSha256: null }
  );
});

test('既存objectの内容一致はidempotentに通す', () => {
  const content = '{"ok":true}\n';
  assert.deepEqual(
    resolveCasJsonWrite({
      currentContent: content,
      nextContent: content,
      expectedSha256: null,
      label: 'same',
    }),
    { action: 'unchanged', beforeSha256: sha256Text(content) }
  );
});

test('既存objectの更新はCAS一致時だけ通す', () => {
  const currentContent = '{"old":true}\n';
  const expectedSha256 = sha256Text(currentContent);
  assert.deepEqual(
    resolveCasJsonWrite({
      currentContent,
      nextContent: '{"new":true}\n',
      expectedSha256,
      label: 'update',
    }),
    { action: 'update', beforeSha256: expectedSha256 }
  );
  assert.throws(
    () =>
      resolveCasJsonWrite({
        currentContent,
        nextContent: '{"new":true}\n',
        expectedSha256: '0'.repeat(64),
        label: 'update',
      }),
    /CAS不一致/
  );
  assert.throws(
    () =>
      resolveCasJsonWrite({
        currentContent,
        nextContent: '{"new":true}\n',
        expectedSha256: null,
        label: 'update',
      }),
    /expectedSha256/
  );
});
