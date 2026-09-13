import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assetPath,
  assertTarget,
  assertPreserved,
  assertProduction,
  sha256,
  uploadInBrowser,
} from '../lib/cover-update.mjs';

const note = {
  id: 123,
  key: 'nabc',
  user_id: 1,
  user: { urlname: 'stats47' },
  status: 'published',
  type: 'TextNote',
  name: 'Test',
  body: 'Published preview',
  separator: 5,
  price: 500,
  hashtag_notes: ['data'],
  has_draft: false,
};
const article = { noteId: 'nabc', noteUrl: 'https://note.com/stats47/n/nabc' };
test('wrong account or target cannot receive a cover', () => {
  assert.doesNotThrow(() => assertTarget(note, article));
  for (const changed of [
    { ...note, user: { urlname: 'dobokunote' } },
    { ...note, key: 'ndef' },
    { ...note, status: 'draft' },
    { ...note, id: null },
  ])
    assert.throws(() => assertTarget(changed, article), /identity/);
});
test('cover may change; article body, title, price, paid boundary and tags must be preserved', () => {
  assert.doesNotThrow(() =>
    assertPreserved(note, {
      ...note,
      eyecatch: 'https://assets.st-note.com/new.png',
      like_count: 10,
    })
  );
  for (const field of [
    'name',
    'body',
    'price',
    'separator',
    'hashtag_notes',
    'publish_at',
    'is_pinned',
  ])
    assert.throws(
      () => assertPreserved(note, { ...note, [field]: 'changed' }),
      new RegExp(field)
    );
});
test('hashes preserve evidence without storing public or paid body text', () => {
  const fingerprint = assertPreserved(note, note);
  assert.match(fingerprint.body, /^[0-9a-f]{64}$/);
  assert.equal(JSON.stringify(fingerprint).includes(note.body), false);
});
test('changed pixels or missing visual review reject a production image', () => {
  const bytes = Buffer.from('image');
  const a = {
    action: 'create',
    sha256: sha256(bytes),
    quality: { textBounds: 'pass', textOverlap: 'pass', visualReview: 'pass' },
  };
  assert.doesNotThrow(() =>
    assertProduction(a, bytes, { width: 1280, height: 670 })
  );
  assert.throws(
    () =>
      assertProduction(a, Buffer.from('changed'), { width: 1280, height: 670 }),
    /changed_after_review/
  );
  assert.throws(
    () =>
      assertProduction(
        { ...a, quality: { ...a.quality, visualReview: 'pending' } },
        bytes,
        { width: 1280, height: 670 }
      ),
    /visualReview/
  );
  assert.throws(
    () => assertProduction(a, bytes, { width: 1200, height: 630 }),
    /dimensions/
  );
  assert.throws(
    () =>
      assertProduction({ ...a, action: 'keep' }, bytes, {
        width: 1280,
        height: 670,
      }),
    /not_a_change/
  );
});
test('delivery query parameters do not disguise a cover change', () => {
  assert.equal(
    assetPath('https://assets.st-note.com/a.png?width=1280'),
    assetPath('https://assets.st-note.com/a.png?width=640')
  );
  assert.notEqual(
    assetPath('https://assets.st-note.com/a.png'),
    assetPath('https://assets.st-note.com/b.png')
  );
  assert.equal(assetPath(null), null);
});
test('upload contract sends only the four observed image fields, never the article body', async () => {
  const requests = [];
  const fakeWindow = {
    __noteCoverBytes: Buffer.from('png').toString('base64'),
  };
  const execute = new Function(
    'window',
    'location',
    'fetch',
    uploadInBrowser({ noteId: 123, width: 1280, height: 670 })
  );
  execute(fakeWindow, { origin: 'https://note.com' }, async (url, init) => {
    requests.push({ url, init });
    return {
      status: 201,
      json: async () => ({ data: { url: 'https://assets.st-note.com/a.png' } }),
    };
  });
  await new Promise((r) => setTimeout(r, 0));
  assert.equal(requests.length, 1);
  assert.equal(
    requests[0].url,
    'https://note.com/api/v1/image_upload/note_eyecatch'
  );
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].init.headers['X-Requested-With'], 'XMLHttpRequest');
  assert.deepEqual(
    [...requests[0].init.body.keys()],
    ['note_id', 'file', 'width', 'height']
  );
  assert.equal(requests[0].init.body.get('note_id'), '123');
  assert.equal(fakeWindow.__noteCoverResult.status, 201);
  assert.equal(fakeWindow.__noteCoverBytes, undefined);
});
