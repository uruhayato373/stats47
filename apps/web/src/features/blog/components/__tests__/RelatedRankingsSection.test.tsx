import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ブログ記事の「関連ランキング」は公開中の都道府県ランキングだけを出す (RANKING-ACTIVE-WITHOUT-VALUES-01)。
 * 2026-10-08、非公開の指標を rankingRefs に持つ記事が、R2 に残った古い item を読んで 410 のページへリンクしていた。
 */

const { readItemMock, readByTagsMock } = vi.hoisted(() => ({
  readItemMock: vi.fn(),
  readByTagsMock: vi.fn(),
}));

vi.mock('@stats47/ranking/server', () => ({
  getRankingTitle: (item: { title: string }) => item.title,
  readRankingItemByKeyAndAreaTypeFromR2: (key: string) => readItemMock(key),
  readRelatedRankingItemsByTagKeysFromR2: () => readByTagsMock(),
}));
vi.mock('@/config/known-ranking-keys', () => ({
  KNOWN_RANKING_KEYS: new Set(['published-a', 'published-tag']),
}));
vi.mock('@/config/category-blog-tag-keys', () => ({
  getCategoryKeysForBlogTagKeys: () => [],
}));

import { RelatedRankingsSection } from '../RelatedRankingsSection';

function item(rankingKey: string) {
  return { rankingKey, title: rankingKey };
}

beforeEach(() => {
  readItemMock.mockReset();
  readByTagsMock.mockReset();
  readItemMock.mockImplementation(async (key: string) => ({ success: true, data: item(key) }));
  readByTagsMock.mockResolvedValue({ success: true, data: [item('published-tag'), item('stale-tag')] });
});

async function hrefs(props: Parameters<typeof RelatedRankingsSection>[0]) {
  const element = await RelatedRankingsSection(props);
  if (!element) return [];
  const { container } = render(element);
  return [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));
}

describe('RelatedRankingsSection', () => {
  it('記事の指標のうち公開中のランキングだけを読み、非公開の指標の item は読まない', async () => {
    const links = await hrefs({ tagKeys: [], rankingKeys: ['unpublished-city-only', 'published-a'] });
    expect(readItemMock.mock.calls.map(([key]) => key)).toEqual(['published-a']);
    expect(links).toEqual(['/ranking/published-a']);
  });

  it('タグ経由の候補にも公開中でない指標が混ざっていればリンクにしない', async () => {
    const links = await hrefs({ tagKeys: ['tag'], rankingKeys: [] });
    expect(links).toEqual(['/ranking/published-tag']);
  });

  it('記事の指標がすべて非公開でタグも無ければ何も描かない', async () => {
    expect(await RelatedRankingsSection({ tagKeys: [], rankingKeys: ['unpublished-city-only'] })).toBeNull();
    expect(readItemMock).not.toHaveBeenCalled();
  });
});
