import { open, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { httpUrl } from './contracts.mjs';

export class TooLargeError extends Error {
  constructor() { super('skip-too-large'); this.name = 'TooLargeError'; }
}
const USER_AGENT = 'stats47-open-data-archiver';
const DISCOVERY_LIMIT = 8 * 1024 ** 2;
const length = (s) => s !== null && /^\d+$/.test(s) && Number.isSafeInteger(Number(s)) ? Number(s) : null;

/** The host lease covers the entire body, including redirects and cancellation. */
export function createHttpClient({ fetchImpl = fetch, intervalMs = 1000, sleep = delay } = {}) {
  const hosts = new Map();
  async function request(input, options, consume) {
    let url = httpUrl(input);
    for (let redirects = 0; redirects <= 5; redirects++) {
      const host = new URL(url).host;
      const previous = hosts.get(host) ?? { done: Promise.resolve(), last: 0 };
      let release;
      const state = { done: new Promise((resolve) => { release = resolve; }), last: 0 };
      hosts.set(host, state);
      await previous.done;
      await sleep(Math.max(0, previous.last + intervalMs - Date.now()));
      let response;
      let next;
      try {
        state.last = Date.now();
        response = await fetchImpl(url, { ...options, redirect: 'manual', signal: AbortSignal.timeout(120_000), headers: { 'user-agent': USER_AGENT, 'accept-encoding': 'identity', ...options.headers } });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get('location');
          if (!location) throw Error('Redirect without Location');
          next = httpUrl(new URL(location, url).href);
          if (options.headers?.authorization && new URL(next).origin !== new URL(url).origin) throw Error('Refusing credentialed cross-origin redirect');
        } else return await consume(response, url);
      } finally {
        await response?.body?.cancel().catch(() => {});
        release();
      }
      url = next;
    }
    throw Error('Too many redirects');
  }
  function metadata(response, url) {
    const total = response.headers.get('content-range')?.match(/\/([0-9]+)$/)?.[1];
    return { url, status: response.status, reachable: response.ok, bytes: total ? length(total) : length(response.headers.get('content-length')), contentType: response.headers.get('content-type') ?? 'application/octet-stream' };
  }
  return {
    async probe(url, headers = {}) {
      const head = await request(url, { method: 'HEAD', headers }, (r, finalUrl) => metadata(r, finalUrl));
      if (head.reachable && head.bytes !== null) return head;
      if (!head.reachable && ![400, 403, 405, 501].includes(head.status)) return head;
      // Never consume a full body if Range is ignored.
      return request(url, { method: 'GET', headers: { ...headers, range: 'bytes=0-0' } }, (r, finalUrl) => metadata(r, finalUrl));
    },
    async text(url) {
      return request(url, { method: 'GET' }, async (r) => {
        if (!r.ok) throw Error(`Discovery HTTP ${r.status}`);
        const chunks = []; let bytes = 0;
        for await (const chunk of r.body) {
          bytes += chunk.length;
          if (bytes > DISCOVERY_LIMIT) throw new TooLargeError();
          chunks.push(chunk);
        }
        return Buffer.concat(chunks).toString('utf8');
      });
    },
    async download(url, file, maxBytes, headers = {}) {
      try {
        return await request(url, { method: 'GET', headers }, async (r, finalUrl) => {
          if (r.status !== 200) throw Error(`Download HTTP ${r.status}`);
          const meta = metadata(r, finalUrl);
          if (meta.bytes !== null && meta.bytes > maxBytes) throw new TooLargeError();
          if (maxBytes < 0) throw new TooLargeError();
          const handle = await open(file, 'wx');
          let bytes = 0; const hash = createHash('sha256');
          try {
            for await (const chunk of r.body) {
              bytes += chunk.length;
              if (bytes > maxBytes) throw new TooLargeError();
              hash.update(chunk);
              await handle.writeFile(chunk);
            }
          } finally { await handle.close(); }
          if (!r.headers.get('content-encoding') && meta.bytes !== null && meta.bytes !== bytes) throw Error('Content-Length mismatch');
          return { ...meta, bytes, sha256: hash.digest('hex') };
        });
      } catch (error) { await rm(file, { force: true }); throw error; }
    },
  };
}
