import assert from 'node:assert/strict';
import test from 'node:test';
import http from 'node:http';
import { probeCoverageUrl, probeCoverageUrls } from '../lib/coverage-probe.mjs';

const userAgent = 'coverage-fixture';

test('one GET reads status, robots, soft404 and canonical from the same response', async () => {
  let count = 0;
  const actual = await probeCoverageUrl('https://example.test/', {
    userAgent,
    fetchImpl: async (_url, options) => {
      count++;
      assert.equal(options.redirect, 'manual');
      assert.equal(options.headers['User-Agent'], userAgent);
      return new Response('<html><head><link rel="canonical" href="https://example.test/"><meta name="robots" content="noindex"></head><body>article</body></html>', {
        status: 200, headers: { 'content-type': 'text/html' },
      });
    },
  });
  assert.equal(count, 1);
  assert.equal(actual.status, 200);
  assert.equal(actual.signals.robotsNoindex, true);
  assert.equal(actual.signals.canonical, 'https://example.test/');
});

for (const [status, type] of [[410, 'text/html'], [302, 'text/html'], [503, 'text/html'], [200, 'application/json']]) {
  test(`${status} ${type} cancels unused body without following redirects`, async () => {
    let cancelled = false;
    const actual = await probeCoverageUrl('https://example.test/', {
      userAgent,
      fetchImpl: async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }), {
        status, headers: { 'content-type': type },
      }),
    });
    assert.deepEqual(actual, { status, signals: null });
    assert.equal(cancelled, true);
  });
}

test('body timeout/failure returns recheck, never a successful 200 with missing signals', async () => {
  const actual = await probeCoverageUrl('https://example.test/', {
    userAgent,
    fetchImpl: async () => ({ status: 200, headers: new Headers({ 'content-type': 'text/html' }), text: async () => { throw Error('body aborted'); } }),
  });
  assert.deepEqual(actual, { status: 0, signals: null });
});

test('slow real response body is covered by the request deadline', async () => {
  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.write('<html>');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const result = await probeCoverageUrl(`http://127.0.0.1:${server.address().port}`, { userAgent, timeoutMs: 50 });
    assert.deepEqual(result, { status: 0, signals: null });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('bounded workers probe every URL once, retain individual failures and report progress', async () => {
  const urls = Array.from({ length: 25 }, (_, i) => `https://example.test/${i}`);
  let active = 0;
  let peak = 0;
  const seen = [];
  const progress = [];
  const { results, elapsedMs } = await probeCoverageUrls(urls, {
    concurrency: 4, userAgent, onProgress: (done, total) => progress.push([done, total]),
    fetchImpl: async (url) => {
      seen.push(url);
      peak = Math.max(peak, ++active);
      await new Promise((resolve) => setTimeout(resolve, 3));
      active--;
      if (url.endsWith('/7')) throw Error('network failure');
      return new Response('article', { status: 200, headers: { 'content-type': 'text/html' } });
    },
  });
  assert.equal(peak, 4);
  assert.deepEqual([...seen].sort(), [...urls].sort());
  assert.equal(results.size, 25);
  assert.equal(results.get(urls[7]).status, 0);
  assert.equal([...results.values()].filter((r) => r.status === 200).length, 24);
  assert.deepEqual(progress.at(-1), [25, 25]);
  assert.ok(elapsedMs >= 0);
});

test('an unresolved body cancellation cannot leave a probe pending after its deadline', async () => {
  let aborted = false;
  const result = await probeCoverageUrl('https://example.test/gone', {
    userAgent, timeoutMs: 20,
    fetchImpl: async (_url, { signal }) => {
      signal.addEventListener('abort', () => { aborted = true; });
      return { status: 410, headers: new Headers({ 'content-type': 'text/html' }),
        body: { cancel: () => new Promise(() => {}) } };
    },
  });
  assert.deepEqual(result, { status: 410, signals: null });
  assert.equal(aborted, true);
});

test('an uncooperative body reader still settles as recheck within the deadline', async () => {
  const result = await probeCoverageUrl('https://example.test/page', {
    userAgent, timeoutMs: 20,
    fetchImpl: async () => ({ status: 200, headers: new Headers({ 'content-type': 'text/html' }),
      text: () => new Promise(() => {}) }),
  });
  assert.deepEqual(result, { status: 0, signals: null });
});
