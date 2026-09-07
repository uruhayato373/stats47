import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RailSearchCard } from '../RailSearchCard';

describe('RailSearchCard', () => {
  it('検索条件を受け取って独立した検索カードを描画する', () => {
    const { container } = render(
      <RailSearchCard
        title="記事検索"
        action="/search"
        placeholder="キーワードで検索"
        ariaLabel="ブログ記事を検索"
        hiddenFields={{ type: 'blog' }}
      />
    );

    expect(
      screen.getByRole('region', { name: '記事検索' })
    ).toBeInTheDocument();
    expect(screen.getByRole('search')).toHaveAttribute('action', '/search');
    expect(
      screen.getByRole('searchbox', { name: 'ブログ記事を検索' })
    ).toHaveAttribute('name', 'q');
    expect(container.querySelector('input[name="type"]')).toHaveValue('blog');
  });
});
