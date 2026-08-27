import assert from 'node:assert/strict';
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
