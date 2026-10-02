import { describe, expect, it } from 'vitest';
import { coverSearchText, coverViewUrl, readCoverView } from '@/lib/note-cover-view';

const categories = [{ key: 'household' }, { key: 'intro' }];
describe('カバー一覧の共有URL', () => {
  it('旧URLと無効な条件を、表示できる初期値へ戻す', () => {
    expect(readCoverView(new URLSearchParams('view=complete&category=household&page=-10&size=999&review=oops&sort=unknown'), categories))
      .toMatchObject({ view: 'table', category: 'household', page: 1, size: 12, review: '', sort: 'title' });
  });
  it('条件変更はページだけ戻し、検索・表示・並べ替えを保持する', () => {
    const url = coverViewUrl('category=household&page=4&q=aichi&sort=title&dir=desc&view=gallery', { review: 'pass' });
    const query = new URL(url, 'http://localhost').searchParams;
    expect(query.get('page')).toBeNull();
    expect(readCoverView(query, categories)).toMatchObject({ category: 'household', q: 'aichi', review: 'pass', view: 'gallery', desc: true });
    expect(coverViewUrl(query.toString(), { page: '2' }, false)).toContain('page=2');
  });
  it('解除は別分類・状態の取りこぼしを残さない', () => {
    const url = coverViewUrl('category=household&q=愛知&publication=published&review=pass&sort=title&view=gallery&page=3', { category: undefined, q: undefined, review: undefined, publication: undefined });
    expect(url).toBe('/content/note/covers?sort=title&view=gallery');
  });
  it('全角IDと前後の空白でも検索できる', () => {
    expect(coverSearchText(' Ａ－ＫＡＫＥＩ－ＡＩＣＨＩ ')).toBe('a-kakei-aichi');
  });
});
