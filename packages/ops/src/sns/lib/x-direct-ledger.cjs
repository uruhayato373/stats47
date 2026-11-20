'use strict';
/**
 * publish-x の直接指定モード (--media / --caption・キー指定) で、成功した投稿を台帳のどの行に書くかを決める。
 *
 * 更新してよいのは同じ domain・content_key の original の「下書き」1 件 (予約日時が最も早いもの) だけ。
 * 既に scheduled / posted の行は X 上の別の投稿なので触らない (旧実装は同じキーの scheduled 行まで
 * 今回の日時で上書きしていた)。下書きが無ければ、予約でも即時投稿でも新しい行を足す
 * (旧実装は即時投稿のときしか足さず、直接指定の予約が台帳に残らなかった。2026-09-30 に 3 件が漏れた)。
 */
function planDirectLedgerWrite(allPosts, { domain, contentKey }) {
  const drafts = allPosts
    .filter((p) => p.platform === 'x' && p.post_type === 'original' && p.domain === domain && p.content_key === contentKey && p.status === 'draft')
    .sort((a, b) => String(a.scheduled_at ?? '').localeCompare(String(b.scheduled_at ?? '')) || a.id - b.id);
  return drafts.length > 0 ? { action: 'update', id: drafts[0].id } : { action: 'insert' };
}

module.exports = { planDirectLedgerWrite };
