import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RailLinksCard } from '../RailLinksCard';

const ITEMS = [
  { id: 'one', label: '項目1', href: '/one', count: 5 },
  { id: 'two', label: '項目2', href: '/two', count: 3 },
];

describe('RailLinksCard', () => {
  it('リンク集合を独立したカードとして描画する', () => {
    render(
      <RailLinksCard
        title="人気の項目"
        items={ITEMS}
        moreLink={{ href: '/all', label: 'すべて見る →' }}
      />
    );

    expect(
      screen.getByRole('region', { name: '人気の項目' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '項目1' })).toHaveAttribute(
      'href',
      '/one'
    );
    expect(screen.getByRole('link', { name: 'すべて見る →' })).toHaveAttribute(
      'href',
      '/all'
    );
  });

  it('長いモバイル導線はカード単位で折りたためる', () => {
    const { container } = render(
      <RailLinksCard title="カテゴリから探す" items={ITEMS} collapsible />
    );

    expect(
      screen.getByRole('region', { name: 'カテゴリから探す' })
    ).toBeInTheDocument();
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('順位リンクに任意のサムネイルを表示できる', () => {
    const { container } = render(
      <RailLinksCard
        title="人気記事"
        layout="ranked"
        items={[
          {
            ...ITEMS[0],
            thumbnail: {
              lightSrc: '/thumb-light.webp',
              darkSrc: '/thumb-dark.webp',
              alt: '',
            },
          },
        ]}
      />
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/thumb-light.webp'
    );
  });

  it('順位を付けない画像付きリンク一覧を表示できる', () => {
    const { container } = render(
      <RailLinksCard
        title="はじめに見るテーマ"
        layout="media"
        items={[
          {
            ...ITEMS[0],
            thumbnail: {
              lightSrc: '/theme-light.webp',
              darkSrc: '/theme-dark.webp',
              alt: '',
            },
          },
        ]}
      />
    );

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      '/theme-light.webp'
    );
    expect(screen.getByRole('link', { name: '項目1' })).toBeInTheDocument();
    expect(container.querySelector('ol')).not.toBeInTheDocument();
  });
});
