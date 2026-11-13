import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RelatedContentNavigation } from '../RelatedContentNavigation';

const { readContentRecommendations } = vi.hoisted(() => ({ readContentRecommendations: vi.fn() }));
vi.mock('../server', () => ({ readContentRecommendations }));

const context = {
  title: '市区町村別のランキング', linkLabel: '市区町村別を見る',
  sourceId: 'ranking:example', kinds: ['municipality-ranking'] as ['municipality-ranking'],
  limit: 1, surface: 'ranking_municipality' as const,
};

describe('関連付けから取得する短いリンク', () => {
  it('解決されたURL・指標名・計測IDを使い、カードは追加しない', async () => {
    readContentRecommendations.mockResolvedValueOnce([
      { id: 'municipality-ranking:example', href: '/municipalities/ranking/example', title: '対応先の指標名' },
    ]);
    const tree = await RelatedContentNavigation(context);
    const { container } = render(tree);
    const link = screen.getByRole('link', { name: '市区町村別を見る' });
    expect(link).toHaveAttribute('href', '/municipalities/ranking/example');
    expect(link).toHaveAttribute('title', '対応先の指標名');
    expect(link).toHaveAttribute('data-nav-surface', 'ranking_municipality');
    expect(link).toHaveAttribute('data-content-id', 'municipality-ranking:example');
    expect(container.querySelector('[data-slot="card"]')).toBeNull();
    expect(readContentRecommendations).toHaveBeenCalledWith({ sourceId: 'ranking:example', kinds: ['municipality-ranking'], limit: 1 });
  });

  it('対応する公開ページがなければ何も出さない', async () => {
    readContentRecommendations.mockResolvedValueOnce([]);
    expect(await RelatedContentNavigation(context)).toBeNull();
  });
});
