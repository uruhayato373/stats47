import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  DiffPushGuardError,
  parseDiffPushFlags,
  pickReadbackSample,
  planDiffPush,
  resolveAuthoritativeGuardMode,
  runDiffPush,
  summarizeDiffPushPlan,
  type DiffPushFlags,
  type DiffPushIo,
} from '../diff-push-r2-core';
import type { RemoteObjectSummary } from '../lib/diff-push-remote-match';
import { R2_PUBLIC_BUCKET } from '../r2-key-classes';

interface FakeFile {
  key: string;
  size: number;
  body: string;
}

const md5 = (s: string) => createHash('md5').update(s).digest('hex');
const file = (key: string, body: string): FakeFile => ({ key, size: Buffer.byteLength(body), body });

/** R2 の代わり。list・put・head を記録し、put した中身を head で返す */
function fakeIo(options: {
  remote?: Record<string, string>;
  listFails?: boolean;
  putFails?: (key: string) => boolean;
  headOverride?: (key: string) => { contentLength: number | null; etag: string | null } | null;
} = {}) {
  const objects = new Map(Object.entries(options.remote ?? {}));
  const puts: string[] = [];
  const heads: string[] = [];
  const io: DiffPushIo<FakeFile> = {
    async list(): Promise<Map<string, RemoteObjectSummary>> {
      if (options.listFails) throw new Error('AccessDenied');
      return new Map([...objects].map(([key, body]) => [key, { size: Buffer.byteLength(body), etag: `"${md5(body)}"` }]));
    },
    async put(f) {
      if (options.putFails?.(f.key)) throw new Error('500');
      puts.push(f.key);
      objects.set(f.key, f.body);
    },
    async head(key) {
      heads.push(key);
      if (options.headOverride) return options.headOverride(key);
      const body = objects.get(key);
      return body === undefined ? null : { contentLength: Buffer.byteLength(body), etag: `"${md5(body)}"` };
    },
    md5Of: (f) => md5(f.body),
  };
  return { io, puts, heads };
}

const NO_FLAGS: DiffPushFlags = { allowFullUpload: false, allowAuthoritativeOverwrite: false };
const quiet = () => undefined;

function run(candidates: FakeFile[], io: DiffPushIo<FakeFile>, flags: DiffPushFlags = NO_FLAGS, readbackMax?: number) {
  return runDiffPush({ bucket: R2_PUBLIC_BUCKET, prefix: '', candidates, flags, io, log: quiet, readbackMax });
}

describe('(a) R2 の一覧が取れないとき', () => {
  it('全件を送らずに止まる (PUT 0 件)', async () => {
    const { io, puts } = fakeIo({ listFails: true });
    await expect(run([file('app/ranking/a/values.json', '1')], io)).rejects.toThrow(/--allow-full-upload/);
    expect(puts).toEqual([]);
  });

  it('--allow-full-upload があれば regenerable は照合せずに送る', async () => {
    const { io, puts } = fakeIo({ listFails: true });
    const result = await run([file('app/ranking/a/values.json', '1')], io, { ...NO_FLAGS, allowFullUpload: true });
    expect(puts).toEqual(['app/ranking/a/values.json']);
    expect(result.plan.entries[0].change).toBe('UNKNOWN');
  });

  it('--allow-full-upload でも authoritative は上書きか判定できないので上書きの許可が要る', async () => {
    const { io, puts } = fakeIo({ listFails: true });
    await expect(run([file('app/stats/a/values.json', '1')], io, { ...NO_FLAGS, allowFullUpload: true }))
      .rejects.toThrow(/\[UNKNOWN\] app\/stats\/a\/values\.json/);
    expect(puts).toEqual([]);
  });

  it('フラグ名を引数から読む', () => {
    expect(parseDiffPushFlags(['--prefix', 'x', '--allow-full-upload'])).toEqual({
      allowFullUpload: true, allowAuthoritativeOverwrite: false,
    });
    expect(parseDiffPushFlags(['--allow-authoritative-overwrite']).allowAuthoritativeOverwrite).toBe(true);
  });
});

describe('(b) authoritative の上書き', () => {
  it('CHANGED の authoritative があれば key を列挙して止まり、ほかのファイルも送らない', async () => {
    const { io, puts } = fakeIo({ remote: { 'app/stats/a/values.json': 'old' } });
    const err = await run([
      file('app/ranking/a/values.json', 'new'),
      file('app/stats/a/values.json', 'new'),
    ], io).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(DiffPushGuardError);
    expect((err as Error).message).toMatch(/\[CHANGED\] app\/stats\/a\/values\.json/);
    expect((err as Error).message).toMatch(/--allow-authoritative-overwrite/);
    expect(puts).toEqual([]);
  });

  it('authoritative でも新しい key (NEW) は止めない', async () => {
    const { io, puts } = fakeIo();
    await run([file('app/blog/new-slug/article.md', 'body')], io);
    expect(puts).toEqual(['app/blog/new-slug/article.md']);
  });

  it('R2 と中身が同じ authoritative は上書きではないので止めない', async () => {
    const { io, puts } = fakeIo({ remote: { 'app/stats/a/values.json': 'same' } });
    await run([file('app/stats/a/values.json', 'same')], io);
    expect(puts).toEqual([]);
  });

  it('regenerable の CHANGED は止めない', async () => {
    const { io, puts } = fakeIo({ remote: { 'app/ranking/a/values.json': 'old' } });
    await run([file('app/ranking/a/values.json', 'new')], io);
    expect(puts).toEqual(['app/ranking/a/values.json']);
  });

  it('未登録の prefix の上書きは authoritative と同じく止める', async () => {
    const { io } = fakeIo({ remote: { 'unknown/a.json': 'old' } });
    await expect(run([file('unknown/a.json', 'new')], io)).rejects.toThrow(/区分表に未登録/);
  });

  it('--allow-authoritative-overwrite があれば上書きする', async () => {
    const { io, puts } = fakeIo({ remote: { 'app/stats/a/values.json': 'old' } });
    await run([file('app/stats/a/values.json', 'new')], io, { ...NO_FLAGS, allowAuthoritativeOverwrite: true });
    expect(puts).toEqual(['app/stats/a/values.json']);
  });
});

describe('(b) 段階導入: CI では既定で警告して続行', () => {
  it('ローカル (GITHUB_ACTIONS なし) は R2_AUTHORITATIVE_GUARD に関係なく enforce', () => {
    expect(resolveAuthoritativeGuardMode({})).toBe('enforce');
    expect(resolveAuthoritativeGuardMode({ R2_AUTHORITATIVE_GUARD: 'warn' })).toBe('enforce');
    expect(resolveAuthoritativeGuardMode({ CI: 'true' })).toBe('enforce');
  });

  it('CI の既定は warn、R2_AUTHORITATIVE_GUARD=enforce のときだけ enforce', () => {
    expect(resolveAuthoritativeGuardMode({ GITHUB_ACTIONS: 'true' })).toBe('warn');
    expect(resolveAuthoritativeGuardMode({ GITHUB_ACTIONS: 'true', R2_AUTHORITATIVE_GUARD: 'enforce' })).toBe('enforce');
  });

  it('warn では key を列挙する警告を出して上書きを送る', async () => {
    const { io, puts } = fakeIo({ remote: { 'app/stats/a/values.json': 'old' } });
    const lines: string[] = [];
    await runDiffPush({
      bucket: R2_PUBLIC_BUCKET, prefix: '', candidates: [file('app/stats/a/values.json', 'new')],
      flags: NO_FLAGS, io, authoritativeGuard: resolveAuthoritativeGuardMode({ GITHUB_ACTIONS: 'true' }),
      log: (line) => lines.push(line),
    });
    expect(puts).toEqual(['app/stats/a/values.json']);
    expect(lines.some((l) => l.startsWith('::warning') && l.includes('1 件上書き'))).toBe(true);
    expect(lines).toContain('  [CHANGED] app/stats/a/values.json');
  });

  it('CI でも enforce なら止まり、1 件も送らない', async () => {
    const { io, puts } = fakeIo({ remote: { 'app/stats/a/values.json': 'old' } });
    await expect(runDiffPush({
      bucket: R2_PUBLIC_BUCKET, prefix: '', candidates: [file('app/stats/a/values.json', 'new')],
      flags: NO_FLAGS, io, log: quiet,
      authoritativeGuard: resolveAuthoritativeGuardMode({ GITHUB_ACTIONS: 'true', R2_AUTHORITATIVE_GUARD: 'enforce' }),
    })).rejects.toThrow(DiffPushGuardError);
    expect(puts).toEqual([]);
  });

  it('ローカルの解決結果では止まる', async () => {
    const { io, puts } = fakeIo({ remote: { 'app/stats/a/values.json': 'old' } });
    await expect(runDiffPush({
      bucket: R2_PUBLIC_BUCKET, prefix: '', candidates: [file('app/stats/a/values.json', 'new')],
      flags: NO_FLAGS, io, log: quiet, authoritativeGuard: resolveAuthoritativeGuardMode({}),
    })).rejects.toThrow(/--allow-authoritative-overwrite/);
    expect(puts).toEqual([]);
  });

  it('warn でも一覧が取れないときの止め (a) は効く', async () => {
    const { io, puts } = fakeIo({ listFails: true });
    await expect(runDiffPush({
      bucket: R2_PUBLIC_BUCKET, prefix: '', candidates: [file('app/ranking/a.json', '1')],
      flags: NO_FLAGS, io, log: quiet, authoritativeGuard: 'warn',
    })).rejects.toThrow(/--allow-full-upload/);
    expect(puts).toEqual([]);
  });
});

describe('(c) 書いた後の照合', () => {
  it('1 件でも PUT に失敗したら件数不一致で止まる', async () => {
    const { io } = fakeIo({ putFails: (key) => key.endsWith('b.json') });
    await expect(run([file('app/ranking/a.json', '1'), file('app/ranking/b.json', '2')], io))
      .rejects.toThrow(/attempted=2 success=1 errors=1/);
  });

  it('HEAD の ETag が本文の MD5 と違えば止まる', async () => {
    const { io } = fakeIo({ headOverride: () => ({ contentLength: 1, etag: '"00000000000000000000000000000000"' }) });
    await expect(run([file('app/ranking/a.json', '1')], io)).rejects.toThrow(/読み戻しが一致しません/);
  });

  it('HEAD のサイズが違えば止まる', async () => {
    const { io } = fakeIo({ headOverride: () => ({ contentLength: 99, etag: `"${md5('1')}"` }) });
    await expect(run([file('app/ranking/a.json', '1')], io)).rejects.toThrow(/size 99\/1/);
  });

  it('R2 に無ければ止まる', async () => {
    const { io } = fakeIo({ headOverride: () => null });
    await expect(run([file('app/ranking/a.json', '1')], io)).rejects.toThrow(/R2 に無い/);
  });

  it('抜き取りは既定で最大 20 件、少なければ全件', async () => {
    const many = Array.from({ length: 45 }, (_, i) => file(`app/ranking/k${i}.json`, String(i)));
    const big = fakeIo();
    const result = await run(many, big.io);
    expect(result.readback.checked).toBe(20);
    expect(big.heads).toHaveLength(20);
    expect(big.heads[0]).toBe('app/ranking/k0.json');
    expect(big.heads[19]).toBe('app/ranking/k44.json');

    const small = fakeIo();
    const r2 = await run(many.slice(0, 3), small.io);
    expect(r2.readback.checked).toBe(3);
  });

  it('pickReadbackSample は重複なく端を含む', () => {
    const picked = pickReadbackSample(Array.from({ length: 100 }, (_, i) => i), 20);
    expect(new Set(picked).size).toBe(20);
    expect(picked[0]).toBe(0);
    expect(picked[19]).toBe(99);
  });
});

describe('(c) 段階導入: 読み戻しの不一致は CI では既定で警告して続行', () => {
  const badEtag = () => ({ contentLength: 1, etag: '"00000000000000000000000000000000"' });
  const runWith = (io: DiffPushIo<FakeFile>, env: NodeJS.ProcessEnv, log: (l: string) => void = quiet) => runDiffPush({
    bucket: R2_PUBLIC_BUCKET, prefix: '', candidates: [file('app/ranking/a.json', '1')], flags: NO_FLAGS, io, log,
    readbackGuard: resolveAuthoritativeGuardMode(env),
  });

  it('CI の既定は不一致の key を ::warning で列挙して続行する', async () => {
    const lines: string[] = [];
    const { io, puts } = fakeIo({ headOverride: badEtag });
    const result = await runWith(io, { GITHUB_ACTIONS: 'true' }, (l) => lines.push(l));
    expect(puts).toEqual(['app/ranking/a.json']);
    expect(result.readback.mismatches).toHaveLength(1);
    expect(lines.some((l) => l.startsWith('::warning title=R2 readback mismatch'))).toBe(true);
    expect(lines.some((l) => l.includes('app/ranking/a.json: size 1/1 etag'))).toBe(true);
  });

  it('CI でも R2_AUTHORITATIVE_GUARD=enforce なら止まる', async () => {
    const { io } = fakeIo({ headOverride: badEtag });
    await expect(runWith(io, { GITHUB_ACTIONS: 'true', R2_AUTHORITATIVE_GUARD: 'enforce' }))
      .rejects.toThrow(/読み戻しが一致しません/);
  });

  it('ローカルは常に止まる', async () => {
    const { io } = fakeIo({ headOverride: badEtag });
    await expect(runWith(io, { R2_AUTHORITATIVE_GUARD: 'warn' })).rejects.toThrow(/読み戻しが一致しません/);
  });

  it('送った件数の不一致は CI の既定 (warn) でも止まる', async () => {
    const { io } = fakeIo({ putFails: () => true });
    await expect(runWith(io, { GITHUB_ACTIONS: 'true' })).rejects.toThrow(/R2差分同期が不完全です/);
  });

  it('ETag が multipart の形ならサイズだけ照合し、照合しなかった件数を数える', async () => {
    const lines: string[] = [];
    const { io } = fakeIo({ headOverride: () => ({ contentLength: 1, etag: '"0123456789abcdef0123456789abcdef-3"' }) });
    const result = await runWith(io, {}, (l) => lines.push(l));
    expect(result.readback).toEqual({ checked: 1, mismatches: [], etagSkipped: 1 });
    expect(lines.some((l) => l.includes('サイズだけ照合: 1 件'))).toBe(true);
  });

  it('ETag が multipart の形でもサイズが違えば不一致', async () => {
    const { io } = fakeIo({ headOverride: () => ({ contentLength: 9, etag: '"0123456789abcdef0123456789abcdef-3"' }) });
    await expect(runWith(io, {})).rejects.toThrow(/size 9\/1/);
  });
});

describe('(d) 区分ごとの件数', () => {
  it('regenerable / authoritative ごとに NEW・CHANGED・削除・一致を数える', () => {
    const remote = new Map<string, RemoteObjectSummary>([
      ['app/ranking/a.json', { size: 3, etag: `"${md5('old')}"` }],
      ['app/stats/s/values.json', { size: 3, etag: `"${md5('old')}"` }],
      ['app/home/featured.json', { size: 4, etag: `"${md5('same')}"` }],
    ]);
    const plan = planDiffPush({
      bucket: R2_PUBLIC_BUCKET,
      candidates: [
        file('app/ranking/a.json', 'new'),
        file('app/ranking/b.json', 'new'),
        file('app/stats/s/values.json', 'new'),
        file('app/blog/x/article.md', 'new'),
        file('app/home/featured.json', 'same'),
      ],
      removedKeys: ['app/stats/gone/values.json', 'app/category/c/items.json'],
      remote,
      md5Of: (f) => md5(f.body),
    });
    expect(summarizeDiffPushPlan(plan)).toEqual({
      regenerable: { NEW: 1, CHANGED: 1, UNKNOWN: 0, UNCHANGED: 1, REMOVED: 1 },
      authoritative: { NEW: 1, CHANGED: 1, UNKNOWN: 0, UNCHANGED: 0, REMOVED: 1 },
    });
  });
});
