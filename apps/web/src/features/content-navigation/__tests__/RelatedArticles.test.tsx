import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AreaRelatedBlogArticles } from '@/features/area-profile/components/AreaRelatedBlogArticles';
import { RelatedArticlesCard } from '@/features/ranking/components/RankingSidebar/RelatedArticlesCard';
import { ThemeRelatedArticles } from '@/features/theme-dashboard/components/ThemeRelatedArticles';

import { NavClickTracker, resolveNavClick } from '@/lib/analytics/components/NavClickTracker';

import { RelatedArticles } from '../RelatedArticles';

const { recommend } = vi.hoisted(() => ({ recommend: vi.fn() }));
vi.mock('../server', () => ({ readContentRecommendations: recommend }));
vi.mock('@/features/products', () => ({ findKindleProductForBlog: () => undefined, TrackedProductLink: () => null }));

const items = [{ id: 'blog:sunshine', key: 'sunshine', title: '日照時間の違い', href: '/blog/sunshine' }];
const location = { origin: 'http://localhost:3000', href: 'http://localhost:3000/areas/39000', pathname: '/areas/39000' };

describe('本文の関連記事を共通化する契約', () => {
  it('県・ランキング・テーマは選び方を保ち、同じ表示部品へ渡す', async () => {
    recommend.mockResolvedValue(items);
    const area = await AreaRelatedBlogArticles({ areaCode: '39000', highlights: { top: [], bottom: [] } });
    const ranking = await RelatedArticlesCard({ rankingKey: 'annual-sunshine-duration', areaType: 'prefecture' });
    const theme = await ThemeRelatedArticles({ themeKey: 'climate', tagKeys: [] });
    for (const tree of [area, ranking, theme]) {
      expect(tree?.type).toBe(RelatedArticles);
      expect(tree?.props.items).toBe(items);
    }
    expect(recommend).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 'area:39000', rankingKeys: [], kinds: ['blog'] }));
    expect(recommend).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 'ranking:annual-sunshine-duration', kinds: ['blog'] }));
    expect(recommend).toHaveBeenCalledWith(expect.objectContaining({ sourceId: 'theme:climate', kinds: ['blog'] }));
  });

  it('記事がなければ空の見出しや枠を出さない', () => {
    const { container } = render(<RelatedArticles items={[]} surface="area_blog" />);
    expect(container).toBeEmptyDOMElement();
  });

  it.each(['area_blog', 'ranking_blog', 'theme_blog'] as const)('%s: 大画像カード・共通見出し・記事 ID で描く', (surface) => {
    const { container } = render(<RelatedArticles items={items} surface={surface} />);
    expect(screen.getByRole('region', { name: '関連記事' })).toBeInTheDocument();
    expect(container.querySelector('[data-slot-kind="article-teaser-card"] img')).toBeInTheDocument();
    expect(resolveNavClick(screen.getByRole('link'), location)).toEqual({
      label: items[0].id, href: items[0].href, surface, cardVariant: 'related-articles-large-v1',
    });
  });
});

describe('関連記事の有効表示とクリック', () => {
  const gtag = vi.fn();
  let notify: (target: Element, ratio: number) => void;
  const disconnect = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('gtag', gtag.mockReset());
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: (entries: { target: Element; isIntersecting: boolean; intersectionRatio: number }[]) => void) {
        notify = (target, ratio) => callback([{ target, isIntersecting: ratio > 0, intersectionRatio: ratio }]);
      }
      observe = vi.fn();
      disconnect = disconnect;
    });
  });
  afterEach(() => { vi.useRealTimers(); });
  const events = (name: string) => gtag.mock.calls.filter(([, eventName]) => eventName === name);

  it('50% 未満・短い表示は数えず、連続 1 秒の表示を1回だけ数える', () => {
    render(<RelatedArticles items={items} surface="area_blog" />);
    const anchor = screen.getByRole('link');
    act(() => { notify(anchor, 0.25); vi.advanceTimersByTime(1000); });
    expect(events('nav_impression')).toHaveLength(0);
    act(() => { notify(anchor, 0.5); vi.advanceTimersByTime(999); notify(anchor, 0); vi.advanceTimersByTime(1000); });
    expect(events('nav_impression')).toHaveLength(0);
    act(() => { notify(anchor, 0.5); vi.advanceTimersByTime(1000); notify(anchor, 0); notify(anchor, 1); vi.advanceTimersByTime(1000); });
    expect(events('nav_impression')).toHaveLength(1);
    expect(events('nav_impression')[0][2]).toMatchObject({ nav_label: 'blog:sunshine', nav_surface: 'area_blog', card_variant: 'related-articles-large-v1' });
  });

  it('表示とクリックは同じ記事 ID・形式を使い、クリックを二重送信しない', () => {
    render(<><NavClickTracker /><RelatedArticles items={items} surface="ranking_blog" /></>);
    const anchor = screen.getByRole('link');
    act(() => { notify(anchor, 1); vi.advanceTimersByTime(1000); });
    // jsdom のページ移動だけを抑止。実装のクリック監視は捕捉段階で動く。
    anchor.addEventListener('click', (event) => event.preventDefault());
    act(() => { anchor.click(); vi.runAllTimers(); });
    expect(events('nav_click')).toHaveLength(1);
    expect(events('nav_click')[0][2]).toMatchObject(events('nav_impression')[0][2]);
  });

  it('タブを隠すと連続表示を中断し、unmount 後も送らない', () => {
    const { unmount } = render(<RelatedArticles items={items} surface="theme_blog" />);
    const anchor = screen.getByRole('link');
    const hidden = vi.spyOn(document, 'hidden', 'get');
    act(() => { notify(anchor, 1); vi.advanceTimersByTime(500); hidden.mockReturnValue(true); document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(1000); });
    expect(events('nav_impression')).toHaveLength(0);
    act(() => { hidden.mockReturnValue(false); document.dispatchEvent(new Event('visibilitychange')); vi.advanceTimersByTime(500); });
    unmount();
    act(() => { vi.advanceTimersByTime(1000); });
    expect(events('nav_impression')).toHaveLength(0);
    expect(disconnect).toHaveBeenCalled();
    hidden.mockRestore();
  });
});
