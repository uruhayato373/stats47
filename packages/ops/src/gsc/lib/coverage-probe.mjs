import { performance } from 'node:perf_hooks';
import { readCanonicalUrl, readHtmlIndexSignals } from '../coverage-policy.mjs';

/** A status and its HTML signals must come from the same GET. Always consume/cancel the body. */
export async function probeCoverageUrl(url, { fetchImpl = fetch, dispatcher, userAgent, timeoutMs = 12000 } = {}) {
  const ctrl = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => { ctrl.abort(); reject(new Error('probe_timeout')); }, timeoutMs);
  });
  try {
    return await Promise.race([deadline, (async () => {
      const res = await fetchImpl(url, {
        method: 'GET', redirect: 'manual', signal: ctrl.signal,
        headers: { 'User-Agent': userAgent },
        ...(dispatcher ? { dispatcher } : {}),
      });
      if (res.status !== 200 || !(res.headers.get('content-type') ?? '').includes('text/html')) {
        // Some undici bodies never settle cancel(), even after abort. Status is
        // already known; initiate cancellation and close the request without awaiting it.
        void res.body?.cancel().catch(() => {});
        ctrl.abort();
        return { status: res.status, signals: null };
      }
      const html = await res.text();
      return {
        status: res.status,
        signals: {
          ...readHtmlIndexSignals(html, res.headers.get('x-robots-tag') ?? ''),
          canonical: readCanonicalUrl(html),
        },
      };
    })()]);
  } catch {
    // A truncated/timed-out 200 body is not evidence that the page is indexable.
    return { status: 0, signals: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeCoverageUrls(urls, { concurrency = 12, onProgress = () => {}, ...options } = {}) {
  const started = performance.now();
  const results = new Map();
  let next = 0;
  let done = 0;
  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      results.set(url, await probeCoverageUrl(url, options));
      onProgress(++done, urls.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
  return { results, elapsedMs: Math.round(performance.now() - started) };
}
