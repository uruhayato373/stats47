import { describe, expect, it } from 'vitest';
import {
  formatJst,
  formatLabel,
  matchesPostQuery,
  sortPosts,
  mediaAspect,
} from '@/lib/sns-ledger';

describe('SNS ID台帳の表示', () => {
  it('IDは完全一致、複数IDはカンマ区切り、本文は大小文字を無視して探す', () => {
    const p = { id: 1109, caption: '北海道 Population', content_key: '01000' };
    expect(matchesPostQuery(p, '#1109')).toBe(true);
    expect(matchesPostQuery(p, '1109,1110,1111')).toBe(true);
    expect(matchesPostQuery(p, '#1110、 #1109')).toBe(true);
    expect(matchesPostQuery(p, '109')).toBe(false);
    expect(matchesPostQuery(p, '北海道')).toBe(true);
    expect(matchesPostQuery(p, 'population')).toBe(true);
  });
  it('UTC・旧JST文字列は同じ日本時間で表示', () => {
    expect(formatJst('2026-10-12T03:10:00Z')).toBe('2026/10/12 12:10');
    expect(formatJst('2026-10-12 12:10:00')).toBe('2026/10/12 12:10');
    expect(formatJst('2026-10-11T15:10:00Z')).toBe('2026/10/12 00:10');
    expect(formatJst(null)).toBe('—');
  });
  it('予約順は欠落日時を末尾へ置き、元配列を変更しない', () => {
    const p = [
      { id: 3, platform: 'x' },
      { id: 1, platform: 'x', scheduled_at: '2026-10-12T03:10:00Z' },
      { id: 2, platform: 'x', scheduled_at: '2026-10-12 11:00:00' },
    ];
    expect(sortPosts(p, 'schedule').map((x) => x.id)).toEqual([2, 1, 3]);
    expect(sortPosts(p, 'id').map((x) => x.id)).toEqual([3, 2, 1]);
    expect(p[0].id).toBe(3);
  });
  it.each(['household-receipt', 'area-atlas', 'rank-routes'])(
    '新しい画像型 %s は日本語表示・縦長',
    (domain) => {
      expect(formatLabel(domain)).not.toBe(domain);
      expect(mediaAspect({ platform: 'x', domain })).toBe('aspect-4/5');
    }
  );
});

describe('展開候補', () => {
  it('予約・公開・削除済みを候補に戻さず、画像と本文の不足を区別する', async () => {
    const { isCandidate, candidateStage } = await import('@/lib/sns-ledger');
    const base = { id: 1, platform: 'x', status: 'draft', caption: '本文' };
    expect(isCandidate(base)).toBe(true);
    for (const patch of [{ status: 'posted' }, { scheduled_at: '2026-10-12' }, { deleted_at: '2026-10-11' }, { post_url: 'https://x.com/a/status/1' }]) expect(isCandidate({ ...base, ...patch })).toBe(false);
    expect(candidateStage(base)).toBe('needs-media');
    const assets = [{ role: 'image', order: 1, state: 'archived' }];
    expect(candidateStage({ ...base, assets, caption: '' })).toBe('needs-copy');
    expect(candidateStage({ ...base, assets })).toBe('review');
    expect(candidateStage({ ...base, assets, planning: { origin: 'material-import', batch: '2026-10-11', title: '県図鑑', note: '', preview_only: true } })).toBe('preview');
    expect(matchesPostQuery({ planning: { title: '県図鑑 沖縄県' } }, '沖縄')).toBe(true);
  });
});
