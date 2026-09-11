import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('an upstream body failure returns 502 and keeps staged data available', { timeout: 10000 }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'theme-preview-test-'));
  let child;
  try {
    const key = 'app/probe/values.json';
    const bytes = Buffer.from(JSON.stringify({ ok: true }));
    await mkdir(join(dir, 'app/probe'), { recursive: true });
    await writeFile(join(dir, key), bytes);
    await writeFile(join(dir, 'manifest.json'), JSON.stringify({ files: [{
      key, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
    }] }));
    const mock = join(dir, 'mock-upstream.mjs');
    await writeFile(mock, `globalThis.fetch = async (url) => url === 'https://storage.stats47.jp/categories/all.json'
      ? new Response(JSON.stringify({ categories: [{ categoryKey: 'population' }] }))
      : new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('partial'));
        setTimeout(() => controller.error(new Error('upstream body failed')), 10);
      }
    }), { status: 200 });`);
    child = spawn(process.execPath, ['--import', mock,
      fileURLToPath(new URL('../preview-theme-release.mjs', import.meta.url)),
      '--manifest', join(dir, 'manifest.json'), '--stage-dir', dir, '--port', '0',
    ], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', chunk => { stderr += chunk; });
    const url = await new Promise((resolve, reject) => {
      let stdout = '';
      child.stdout.on('data', chunk => {
        stdout += chunk;
        const match = stdout.match(/http:\/\/127\.0\.0\.1:\d+/);
        if (match) resolve(match[0]);
      });
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`Preview exited ${code}: ${stderr}`)));
    });
    const upstream = await fetch(`${url}/app/upstream.json`);
    assert.equal(upstream.status, 502);
    assert.equal(await upstream.text(), 'Preview data unavailable');
    const staged = await fetch(`${url}/${key}`);
    assert.equal(staged.status, 200);
    assert.deepEqual(await staged.json(), { ok: true });
    const categories = await fetch(`${url}/categories/all.json`);
    assert.equal(categories.status, 200);
    assert.equal(categories.headers.get('x-theme-preview-source'), 'public');
    assert.deepEqual(await categories.json(), { categories: [{ categoryKey: 'population' }] });
    assert.equal((await fetch(`${url}/categories/unlisted.json`)).status, 404);
    assert.equal((await fetch(`${url}/private/credentials.json`)).status, 404);
    assert.equal(stderr, '');
  } finally {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    await rm(dir, { recursive: true, force: true });
  }
});
