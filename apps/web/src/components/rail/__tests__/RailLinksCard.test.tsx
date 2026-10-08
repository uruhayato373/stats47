import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RailLinksCard } from '../RailLinksCard';

const ITEMS = [
  { id: 'one', label: '項目1', href: '/one', count: 5 },
  { id: 'two', label: '項目2', href: '/two', count: 3, active: true },
];

describe('RailLinksCard', () => {
  it('リンク集合を独立したカードとして描画する', () => {
    render(
      <RailLinksCard
        trackingSurface="blog_sidebar"
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

  it('list の現在地に aria-current と active 表示を付ける', () => {
    render(
      <RailLinksCard
        trackingSurface="geo_sidebar"
        title="GIS一覧"
        layout="list"
        items={ITEMS}
      />
    );

    expect(screen.getByRole('link', { name: /項目2/ })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: /項目1/ })).not.toHaveAttribute(
      'aria-current'
    );
  });

  it('長いモバイル導線はカード単位で折りたためる', () => {
    const { container } = render(
      <RailLinksCard
        title="カテゴリから探す"
        items={ITEMS}
        collapsible
        trackingSurface="blog_sidebar"
      />
    );

    expect(
      screen.getByRole('region', { name: 'カテゴリから探す' })
    ).toBeInTheDocument();
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('順位リンクに任意のサムネイルを表示できる', () => {
    const { container } = render(
      <RailLinksCard
        trackingSurface="blog_sidebar"
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
        trackingSurface="blog_sidebar"
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

  it('タグのピルは丸みと小さい余白を使い、モバイルのタップ領域を保つ', () => {
    render(
      <RailLinksCard
        title="人気のタグ"
        layout="chips"
        items={ITEMS}
        trackingSurface="blog_sidebar"
      />
    );

    expect(screen.getByRole('link', { name: '項目1' })).toHaveClass(
      'min-h-11',
      'rounded-full',
      'px-2',
      'text-[11px]',
      'sm:min-h-7'
    );
  });

  it('記事本文内ではカードを重ねず、読む理由と不変IDを持つ導線を表示する', () => {
    const { container } = render(
      <RailLinksCard
        title="この記事のデータを見る"
        layout="media"
        frame="inline"
        trackingSurface="blog_ranking_card"
        items={[
          {
            id: 'ranking:annual-sunshine-duration',
            contentId: 'ranking:annual-sunshine-duration',
            trackingLabel: 'ranking:annual-sunshine-duration',
            label: '日照時間ランキング',
            description: 'この記事で使ったデータ',
            href: '/ranking/annual-sunshine-duration',
          },
        ]}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'この記事のデータを見る' })
    ).toBeInTheDocument();
    expect(container.querySelector('.rounded-card')).toBeNull();
    const link = screen.getByRole('link', {
      name: /この記事で使ったデータ.*日照時間ランキング/,
    });
    expect(link).toHaveAttribute(
      'data-content-id',
      'ranking:annual-sunshine-duration'
    );
    expect(link).toHaveAttribute(
      'data-nav-label',
      'ranking:annual-sunshine-duration'
    );
    expect(link).toHaveAttribute('data-nav-surface', 'blog_ranking_card');
  });
});
