import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { trackNavClick } from '@/lib/analytics/events';

import { RankingLinkCard, type RankingLinkCardData } from '../RankingLinkCard';

vi.mock('@/lib/analytics/events', () => ({ trackNavClick: vi.fn() }));

const DATA: RankingLinkCardData = {
  unit: '円',
  yearName: '2024年',
  top: [
    { rank: 1, areaName: '高知県', value: '17,033' },
    { rank: 2, areaName: '宮崎県', value: '14,734' },
    { rank: 3, areaName: '大阪府', value: '13,481' },
  ],
  mapSvg: '<svg viewBox="0 0 320 190" data-testid="mini-map"></svg>',
};

function mockFetch(body: RankingLinkCardData | null) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => body })),
  );
}

function renderCard(href = '/ranking/happoshu-consumption-expenditure') {
  return render(
    <RankingLinkCard href={href}>発泡酒ランキングをもっと見る</RankingLinkCard>,
  );
}

describe('RankingLinkCard', () => {
  beforeEach(() => vi.mocked(trackNavClick).mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it('データ到着前から記事のラベルでリンクを出し、上位3行の高さを確保する (表示のずれ防止)', () => {
    mockFetch(DATA);
    const { container } = renderCard();

    const link = screen.getByRole('link', { name: /発泡酒ランキングをもっと見る/ });
    expect(link).toHaveAttribute('href', '/ranking/happoshu-consumption-expenditure');
    expect(container.querySelectorAll('.animate-pulse.h-5')).toHaveLength(3);
  });

  it('APIの上位3県と地図を表示する', async () => {
    mockFetch(DATA);
    renderCard();

    await screen.findByText('高知県');
    expect(screen.getByText('2024年 上位3県')).toBeInTheDocument();
    expect(screen.getByText('17,033')).toBeInTheDocument();
    expect(screen.getByText('大阪府')).toBeInTheDocument();
    expect(screen.getByTestId('mini-map')).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith('/api/ranking-card/happoshu-consumption-expenditure');
  });

  it('データが無い指標では地図と上位欄を畳み、リンクだけを残す', async () => {
    mockFetch(null);
    const { container } = renderCard();

    await waitFor(() => expect(container.querySelector('.animate-pulse')).toBeNull());
    expect(screen.queryByText(/上位3県/)).toBeNull();
    expect(screen.getByRole('link', { name: /もっと見る/ })).toBeInTheDocument();
  });

  it('ランキング以外のリンクではAPIを呼ばない', () => {
    mockFetch(DATA);
    renderCard('/category/economy');

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.queryByText(/上位3県/)).toBeNull();
  });

  it('クリックでblog_ranking_cardのnav_clickをrankingKey付きで送る', () => {
    mockFetch(DATA);
    renderCard();

    fireEvent.click(screen.getByRole('link'));
    expect(trackNavClick).toHaveBeenCalledWith({
      label: 'happoshu-consumption-expenditure',
      href: '/ranking/happoshu-consumption-expenditure',
      surface: 'blog_ranking_card',
    });
  });
});
