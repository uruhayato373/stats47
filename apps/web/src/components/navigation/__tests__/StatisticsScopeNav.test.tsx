import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatisticsScopeNav } from '../StatisticsScopeNav';

describe('StatisticsScopeNav', () => {
  it('3つの公開スコープを共通URLへ接続する', () => {
    render(<StatisticsScopeNav current="municipalities" />);

    expect(screen.getByRole('link', { name: '47都道府県' })).toHaveAttribute(
      'href',
      '/themes'
    );
    expect(screen.getByRole('link', { name: '市区町村' })).toHaveAttribute(
      'href',
      '/municipalities'
    );
    expect(screen.getByRole('link', { name: '日本' })).toHaveAttribute(
      'href',
      '/japan'
    );
  });

  it('現在スコープだけaria-current=pageにする', () => {
    render(<StatisticsScopeNav current="japan" />);

    expect(screen.getByRole('link', { name: '日本' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(
      screen.getByRole('link', { name: '47都道府県' })
    ).not.toHaveAttribute('aria-current');
  });
});
