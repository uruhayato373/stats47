const assert = require('node:assert/strict');
const test = require('node:test');

const {
  assertRecordIntegrity,
  isVerifiedThreadsPostUrl,
  isVerifiedXPostUrl,
} = require('../sns-posts-store.cjs');

test('Xの実投稿URLはstatus URLだけを許可する', () => {
  assert.equal(isVerifiedXPostUrl('https://x.com/stats47jp373/status/123'), true);
  assert.equal(isVerifiedXPostUrl('https://twitter.com/stats47jp373/status/123?ref=share'), true);
  assert.equal(isVerifiedXPostUrl('https://x.com/stats47jp373'), false);
  assert.equal(isVerifiedXPostUrl('https://stats47.jp/ranking/example'), false);
});

test('activeなX postedレコードは確認済みpost_urlを必須にする', () => {
  assert.throws(
    () => assertRecordIntegrity({ id: 1, platform: 'x', status: 'posted', post_url: null }),
    /確認済み post_url が必要/,
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({
      id: 2,
      platform: 'x',
      status: 'posted',
      post_url: 'https://x.com/stats47jp373/status/123',
    }),
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({ id: 3, platform: 'x', status: 'scheduled', post_url: null }),
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({ id: 4, platform: 'x', status: 'posted', post_url: null, deleted_at: '2026-09-04' }),
  );
});

test('Threadsの実投稿URLは /@user/post/<code> の permalink だけを許可する', () => {
  assert.equal(isVerifiedThreadsPostUrl('https://www.threads.net/@stats47jp/post/C8abc_-1'), true);
  assert.equal(isVerifiedThreadsPostUrl('https://www.threads.com/@stats47jp/post/C8abc'), true);
  assert.equal(isVerifiedThreadsPostUrl('https://www.threads.com/@stats47jp'), false);
  assert.equal(isVerifiedThreadsPostUrl('https://stats47.jp/ranking/example'), false);
});

test('activeなThreads postedレコードは確認済みpost_urlを必須にする', () => {
  assert.throws(
    () => assertRecordIntegrity({ id: 1, platform: 'threads', status: 'posted', post_url: null }),
    /Threads の posted レコードには確認済み post_url が必要/,
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({
      id: 2,
      platform: 'threads',
      status: 'posted',
      post_url: 'https://www.threads.com/@stats47jp/post/C8abc',
    }),
  );
  assert.doesNotThrow(() =>
    assertRecordIntegrity({ id: 3, platform: 'threads', status: 'scheduled', post_url: null }),
  );
});

// ---- 1 id から全部たどれる契約 (2026-10-09) ----
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  assertApprovedForPublish,
  externalIdOf,
} = require('../sns-posts-store.cjs');

/** 実物の store と config を一時 root へ写し、seed した台帳で動かす (本物の台帳を書かない) */
function storeInTempRoot(seed) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sns-store-'));
  const repo = path.resolve(__dirname, '../../../..');
  fs.mkdirSync(path.join(root, '.claude/scripts/lib'), { recursive: true });
  fs.copyFileSync(path.join(repo, '.claude/scripts/lib/sns-posts-store.cjs'), path.join(root, '.claude/scripts/lib/sns-posts-store.cjs'));
  fs.mkdirSync(path.join(root, 'config'), { recursive: true });
  for (const f of ['datasets.mjs', 'paths.mjs']) fs.copyFileSync(path.join(repo, 'config', f), path.join(root, 'config', f));
  fs.mkdirSync(path.join(root, 'data/sns'), { recursive: true });
  fs.writeFileSync(path.join(root, 'data/sns/posts.json'), JSON.stringify(seed));
  const store = require(path.join(root, '.claude/scripts/lib/sns-posts-store.cjs'));
  const read = () => JSON.parse(fs.readFileSync(path.join(root, 'data/sns/posts.json'), 'utf8'));
  return { store, read };
}

const base = { platform: 'x', post_type: 'original', domain: 'ranking', created_at: '2026-10-01', updated_at: '2026-10-01' };

test('status は draft / scheduled / posted / deleted 以外を拒否する (typo の状態で台帳が割れないため)', () => {
  assert.throws(() => assertRecordIntegrity({ id: 1, platform: 'x', status: 'publish' }), /status は/);
  assert.doesNotThrow(() => assertRecordIntegrity({ id: 1, platform: 'x', status: 'draft' }));
});

test('approval.state は語彙外を拒否し、承認の無い旧行 (approval 未設定) は通す', () => {
  assert.throws(() => assertRecordIntegrity({ id: 1, platform: 'x', status: 'draft', approval: { state: 'ok' } }), /approval\.state/);
  assert.doesNotThrow(() => assertRecordIntegrity({ id: 1, platform: 'x', status: 'draft' }));
});

test('承認済みでない行は予約・投稿の直前で止める (新規投稿は承認必須)', () => {
  assert.throws(() => assertApprovedForPublish({ id: 7, approval: { state: 'pending' } }), /未承認/);
  assert.throws(() => assertApprovedForPublish({ id: 7 }), /approval=pending/);
  assert.throws(() => assertApprovedForPublish({ id: 7, approval: { state: 'unrecorded' } }), /未承認/);
  assert.doesNotThrow(() => assertApprovedForPublish({ id: 7, approval: { state: 'approved', by: 'owner', at: '2026-10-09' } }));
});

test('外部 ID は post_url から導出し、Instagram だけ保存した media_id を返す', () => {
  assert.equal(externalIdOf({ platform: 'x', post_url: 'https://x.com/stats47jp373/status/2101249957218910222' }), '2101249957218910222');
  assert.equal(externalIdOf({ platform: 'youtube', post_url: 'https://www.youtube.com/watch?v=wjLQCiuEeNI' }), 'wjLQCiuEeNI');
  assert.equal(externalIdOf({ platform: 'threads', post_url: 'https://www.threads.com/@stats47jp/post/C8abc_-1' }), 'C8abc_-1');
  assert.equal(externalIdOf({ platform: 'tiktok', post_url: 'https://www.tiktok.com/@stats47/video/7351234567890' }), '7351234567890');
  // Instagram の permalink の shortcode は Graph API の media_id ではないので導出しない
  assert.equal(externalIdOf({ platform: 'instagram', post_url: 'https://www.instagram.com/p/ABC123/' }), null);
  assert.equal(externalIdOf({ platform: 'instagram', external_id: '18103248718992816' }), '18103248718992816');
  assert.equal(externalIdOf({ platform: 'x', post_url: null }), null);
});

test('insert は承認待ち (pending) を既定にし、最上位の古い nextId / total_count を落とす', () => {
  const { store, read } = storeInTempRoot({ _meta: { count: 0, nextId: 1 }, posts: [], nextId: 580, total_count: 394 });
  const row = store.insert({ ...base });
  assert.deepEqual(row.approval, { state: 'pending' });
  const saved = read();
  assert.equal(saved.nextId, undefined);
  assert.equal(saved.total_count, undefined);
  assert.equal(saved._meta.nextId, 2);
});

test('updateMany は 1 件でも検査に落ちれば何も書かない (backfill の途中状態を残さない)', () => {
  const posts = [{ ...base, id: 1, status: 'posted', post_url: 'https://x.com/a/status/1' }, { ...base, id: 2, status: 'draft' }];
  const { store, read } = storeInTempRoot({ _meta: { count: 2, nextId: 3 }, posts });
  assert.throws(
    () => store.updateMany([{ id: 1, patch: { approval: { state: 'unrecorded' } } }, { id: 2, patch: { status: 'bogus' } }]),
    /status は/,
  );
  assert.equal(read().posts[0].approval, undefined);
  assert.throws(() => store.updateMany([{ id: 99, patch: {} }]), /id=99/);
  store.updateMany([{ id: 1, patch: { approval: { state: 'unrecorded' } } }, { id: 2, patch: { approval: { state: 'pending' } } }]);
  assert.deepEqual(read().posts.map((p) => p.approval.state), ['unrecorded', 'pending']);
});
