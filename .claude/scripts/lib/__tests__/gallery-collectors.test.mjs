import assert from 'node:assert/strict';
import test from 'node:test';

import { buildTab } from '../gallery-collectors.mjs';

test('blog-card は 1200×630 の約1.91:1として列挙する', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        articles: [{ slug: 'sample-article', published: true }],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );

  try {
    const tab = await buildTab('blog-card', {
      site: 'https://stats47.example',
      r2: 'https://storage.stats47.example',
      projectRoot: process.cwd(),
    });

    assert.equal(tab.aspect, '1.91:1');
    assert.deepEqual(
      tab.entries[0].images.map((image) => image.url),
      [
        'https://storage.stats47.example/app/blog/sample-article/thumbnail-light.webp',
        'https://storage.stats47.example/app/blog/sample-article/thumbnail-dark.webp',
      ]
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
