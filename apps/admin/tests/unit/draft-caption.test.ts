import fs from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupFixtureRoot,
  makeFixtureRoot,
  readPosts,
  type SeedPost,
} from '../helpers/fixture-root';

const original: SeedPost = {
  id: 1,
  platform: 'x',
  status: 'draft',
  caption: '元の本文',
  domain: 'household-receipt',
  content_key: '28000',
  approval: { state: 'approved', by: 'owner' },
  assets: [
    {
      role: 'image',
      order: 1,
      state: 'archived',
      drive_path: 'SNS素材/x/1/image-1.png',
    },
  ],
  created_at: '2026-10-10T00:00:00Z',
  updated_at: '2026-10-10T00:00:00Z',
};
let root: string;
afterEach(() => {
  if (root) cleanupFixtureRoot(root);
  delete process.env.STATS47_PROJECT_ROOT;
});
async function setup(patch: Partial<SeedPost> = {}) {
  root = makeFixtureRoot({
    posts: [
      { ...original, ...patch },
      { ...original, id: 2, caption: '別の投稿' },
    ],
  });
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  const store = await import('@/lib/server/posts-store');
  const { PATCH } = await import('@/app/api/posts/[id]/caption/route');
  const revision = store.postRevision(store.getById(1)!);
  const send = (
    body: unknown = { caption: '変更した本文\n2行目', revision },
    headers: Record<string, string> = {},
    id = '1',
    url = 'http://127.0.0.1:4747'
  ) =>
    PATCH(
      new Request(`${url}/api/posts/${id}/caption`, {
        method: 'PATCH',
        headers: {
          origin: 'http://127.0.0.1:4747',
          'content-type': 'application/json',
          ...headers,
        },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) }
    );
  return { store, send, revision };
}
describe('下書き本文の保存API', () => {
  it('既存IDの本文だけ保存し、素材を保持、承認待ちへ戻す。再読込しても保存される', async () => {
    const { send, revision } = await setup();
    const before = readPosts(root);
    const res = await send();
    expect(res.status).toBe(200);
    const { post } = await res.json();
    expect(post.id).toBe(1);
    expect(post.revision).not.toBe(revision);
    expect(post.media_candidates[0].url).toBe('/sns-asset/1/image-1.png');
    const [saved, other] = readPosts(root);
    expect(saved).toMatchObject({
      ...original,
      caption: '変更した本文\n2行目',
      approval: { state: 'pending' },
      updated_at: expect.any(String),
    });
    expect(saved.approval).not.toHaveProperty('by');
    expect(other).toEqual(before[1]);
    expect(saved).not.toHaveProperty('revision');
    vi.resetModules();
    expect((await import('@/lib/server/posts-store')).getById(1)?.caption).toBe(
      '変更した本文\n2行目'
    );
  });
  it('同じ本文の保存では承認・更新日を変更しない', async () => {
    const { send, revision } = await setup();
    const before = readPosts(root);
    expect((await send({ caption: original.caption, revision })).status).toBe(
      200
    );
    expect(readPosts(root)).toEqual(before);
  });
  it.each([
    { status: 'scheduled' },
    { status: 'posted' },
    { status: 'deleted' },
    { scheduled_at: '2026-11-01' },
    { post_url: 'https://x.com/stats47jp/status/123' },
    { posted_at: '2026-10-01' },
    { deleted_at: '2026-10-01' },
    { external_id: '123' },
  ])('編集対象外を拒否: %j', async (patch) => {
    const { send } = await setup(patch);
    const before = readPosts(root);
    expect([404, 409]).toContain((await send()).status);
    expect(readPosts(root)).toEqual(before);
  });
  it('別操作で素材・本文が変わった古い版を拒否し、最新の値を保持する', async () => {
    const { send } = await setup();
    const file = path.join(root, 'data/sns/posts.json');
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.posts[0].caption = '他の操作で更新'; // updated_atは同じでも検知
    fs.writeFileSync(file, JSON.stringify(data));
    expect((await send()).status).toBe(409);
    expect(readPosts(root)[0].caption).toBe('他の操作で更新');
  });
  it.each<Record<string, string>>([
    { origin: 'https://example.com' },
    { origin: 'null' },
    { origin: '' },
    { 'sec-fetch-site': 'cross-site' },
  ])('外部originを拒否: %j', async (headers) => {
    const { send } = await setup();
    expect((await send(undefined, headers)).status).toBe(403);
    expect(readPosts(root)[0].caption).toBe(original.caption);
  });
  it('外向きhost・不正ID・不在ID・JSON以外を拒否する', async () => {
    const { send } = await setup();
    expect(
      (
        await send(
          undefined,
          { origin: 'http://evil.test' },
          '1',
          'http://evil.test'
        )
      ).status
    ).toBe(403);
    expect((await send(undefined, {}, '1abc')).status).toBe(400);
    expect((await send(undefined, {}, '99999')).status).toBe(404);
    expect(
      (await send(undefined, { 'content-type': 'text/plain' })).status
    ).toBe(415);
    expect((await send('{')).status).toBe(400);
  });
  it('空本文・超過・余分なstatusやID・版なしを拒否する', async () => {
    const { send, revision } = await setup();
    const before = readPosts(root);
    for (const body of [
      { caption: '  ', revision },
      { caption: 'a'.repeat(10001), revision },
      { caption: '本文', revision, status: 'posted' },
      { caption: '本文', revision, id: 2 },
      { caption: '本文' },
    ]) {
      expect((await send(body)).status).toBe(400);
    }
    expect(readPosts(root)).toEqual(before);
  });
});
