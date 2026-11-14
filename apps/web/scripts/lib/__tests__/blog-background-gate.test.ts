// @vitest-environment node
import { execFile } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

// 送り箱の記事に使える背景が無いと、push 後の公開 run で初めて skip される (2026-10-07、22 記事中 5 記事)。
// quality-gate.mjs が check-blog-background.ts を呼んで push 前に止める配線を、実物の CLI で固定する。
// R2 の代わりに手元の HTTP サーバーを読ませるので、外部には接続しない。
const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');
const SLUG = 'qg-background-fixture-no-asset';
const dirs: string[] = [];
const servers: Server[] = [];

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  for (const server of servers.splice(0)) server.close();
});

/** 公開済みの背景の記録 (ogp/generation.json) だけを返す R2 の代役。record が null なら全部 404 */
async function fakeR2(record: Record<string, unknown> | null): Promise<string> {
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
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

/** 公開フラグを立てた送り箱の記事に quality-gate を掛け、背景の blocker を返す */
async function backgroundBlockers(publicUrl: string): Promise<string[]> {
  const root = mkdtempSync(join(tmpdir(), 'qg-background-'));
  dirs.push(root);
  const articlePath = join(root, 'contents/blog', SLUG, 'article.md');
  mkdirSync(join(articlePath, '..'), { recursive: true });
  writeFileSync(
    articlePath,
    '---\ntitle: "検査用の題"\nseoTitle: "検査用の題"\npublished: true\n---\n\n## 本文\n\n検査用の本文です。\n'
  );
  const stdout = await new Promise<string>((done) => {
    // blocker があると exit 1 になる。JSON は stdout に出ている
    execFile(
      process.execPath,
      [join(PROJECT_ROOT, '.claude/scripts/blog/quality-gate.mjs'), articlePath],
      { cwd: PROJECT_ROOT, env: { ...process.env, R2_PUBLIC_FETCH_URL: publicUrl }, encoding: 'utf8' },
      (_error, out) => done(out)
    );
  });
  const result = JSON.parse(stdout) as { checks: { background?: string }; blockers: string[] };
  expect(['missing', 'stale-ai']).toContain(result.checks.background);
  return result.blockers.filter((blocker) => blocker.startsWith('背景: '));
}

describe('quality-gate の背景の検査 (送り箱の記事)', () => {
  it('git にも公開済みにも背景が無い記事を止め、Codex で記事固有背景を作る手順を示す', async () => {
    const blockers = await backgroundBlockers(await fakeR2(null));
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain('記事固有背景がありません');
    expect(blockers[0]).toContain(`npm run blog-images:codex -- request-article --slug ${SLUG} --article `);
  }, 60_000);

  it('タイトルを変えて公開済みの AI 背景の promptHash が外れた記事を止める', async () => {
    const blockers = await backgroundBlockers(
      await fakeR2({ source: 'ai', promptHash: 'sha256-old-title', sha256: 'a'.repeat(64) })
    );
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain('公開済みの AI 背景が使えません');
    expect(blockers[0]).toContain(`request-article --slug ${SLUG}`);
  }, 60_000);
});
