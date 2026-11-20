import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

// 送り箱の記事に使える背景が無いと、push 後の公開 run で初めて skip される (2026-10-07、22 記事中 5 記事)。
// quality-gate.mjs が check-blog-background.ts を呼んで push 前に止める配線を、実物の CLI で固定する。
// R2 の代わりに手元の HTTP サーバーを読ませるので、外部には接続しない。
const PROJECT_ROOT = resolve(fileURLToPath(new URL('../../../../../', import.meta.url)));
const SLUG = 'qg-background-fixture-no-asset';
const dirs = [];
const servers = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  for (const server of servers.splice(0)) server.close();
});

/** 公開済みの背景の記録 (ogp/generation.json) だけを返す R2 の代役。record が null なら全部 404 */
async function fakeR2(record) {
  const server = createServer((request, response) => {
    if (record && request.url?.endsWith('/ogp/generation.json')) {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ metadata: { background: record } }));
      return;
    }
    response.writeHead(404);
    response.end();
  });
  servers.push(server);
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return `http://127.0.0.1:${server.address().port}`;
}

/** 公開フラグを立てた送り箱の記事に quality-gate を掛け、背景の blocker を返す */
async function backgroundBlockers(publicUrl) {
  const root = mkdtempSync(join(tmpdir(), 'qg-background-'));
  dirs.push(root);
  const articlePath = join(root, 'contents/blog', SLUG, 'article.md');
  mkdirSync(join(articlePath, '..'), { recursive: true });
  writeFileSync(
    articlePath,
    '---\ntitle: "検査用の題"\nseoTitle: "検査用の題"\npublished: true\n---\n\n## 本文\n\n検査用の本文です。\n'
  );
  const stdout = await new Promise((done) => {
    // blocker があると exit 1 になる。JSON は stdout に出ている
    execFile(
      process.execPath,
      [join(PROJECT_ROOT, 'packages/ops/src/blog/quality-gate.mjs'), articlePath],
      { cwd: PROJECT_ROOT, env: { ...process.env, R2_PUBLIC_FETCH_URL: publicUrl }, encoding: 'utf8' },
      (_error, out) => done(out)
    );
  });
  const result = JSON.parse(stdout);
  assert.ok(['missing', 'stale-ai'].includes(result.checks.background));
  return result.blockers.filter((blocker) => blocker.startsWith('背景: '));
}

describe('quality-gate の背景の検査 (送り箱の記事)', () => {
  it('git にも公開済みにも背景が無い記事を止め、Codex で記事固有背景を作る手順を示す', { timeout: 60_000 }, async () => {
    const blockers = await backgroundBlockers(await fakeR2(null));
    assert.equal(blockers.length, 1);
    assert.ok(blockers[0].includes('記事固有背景がありません'));
    assert.ok(blockers[0].includes(`npm run blog-images:codex -- request-article --slug ${SLUG} --article `));
  });

  it('タイトルを変えて公開済みの AI 背景の promptHash が外れた記事を止める', { timeout: 60_000 }, async () => {
    const blockers = await backgroundBlockers(
      await fakeR2({ source: 'ai', promptHash: 'sha256-old-title', sha256: 'a'.repeat(64) })
    );
    assert.equal(blockers.length, 1);
    assert.ok(blockers[0].includes('公開済みの AI 背景が使えません'));
    assert.ok(blockers[0].includes(`request-article --slug ${SLUG}`));
  });
});
