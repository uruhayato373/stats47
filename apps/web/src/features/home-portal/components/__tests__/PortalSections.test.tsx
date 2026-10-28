import { HOME_PORTAL_USE_CASES } from '@stats47/data-configs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const { navMock } = vi.hoisted(() => ({ navMock: vi.fn() }));
vi.mock('@/lib/analytics/events', () => ({
  trackNavClick: (...args: unknown[]) => navMock(...args),
}));

import { PortalBlogCard } from '../PortalBlogCard';
import { PortalUseCaseGrid } from '../PortalUseCaseGrid';

describe('PortalUseCaseGrid', () => {
  it('active な use case を /themes/<key> リンクで描画する', () => {
    const { container } = render(<PortalUseCaseGrid />);
    const active = HOME_PORTAL_USE_CASES.filter((u) => u.isActive);
    expect(screen.getAllByRole('link')).toHaveLength(active.length);
    const migrationLink = screen.getByRole('link', {
      name: /移住先を比較したい/,
    });
    expect(migrationLink).toHaveAttribute(
      'href',
      '/themes/population-dynamics'
    );
    // カードの高さは中身で決める (固定比率を持たない)
    expect(migrationLink.className).not.toMatch(/aspect-/);
    expect(migrationLink.parentElement).toHaveClass(
      'grid-flow-col',
      'xl:auto-cols-[calc((100%_-_2.25rem)/4)]'
    );
    expect(migrationLink.parentElement).toHaveAttribute('role', 'region');
    const images = [...container.querySelectorAll('img')];
    expect(images).toHaveLength(active.length);
    expect(images[0]?.getAttribute('src')).toContain(
      '%2Fimages%2Fhome%2Fuse-cases%2Fmigration.webp'
    );
    expect(images.every((image) => image.getAttribute('alt') === '')).toBe(
      true
    );
    // 題名は行数で切らず文節で折り返す。挿絵は題名の上 (横に並べて題名の列を潰さない)
    const useCaseTitle = screen.getByText('移住先を比較したい');
    expect(useCaseTitle).toHaveClass('text-sm', 'font-semibold', 'text-pretty');
    expect(useCaseTitle.className).not.toMatch(/line-clamp/);
    expect(
      images[0].compareDocumentPosition(useCaseTitle) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      screen.getByText('人口移動・転入超過から住みやすい地域を探す')
    ).toHaveClass('text-[13px]', 'line-clamp-2');
  });

  it('use case クリックで home_use_case を計測する', () => {
    navMock.mockClear();
    render(<PortalUseCaseGrid />);
    fireEvent.click(screen.getByRole('link', { name: /移住先を比較したい/ }));
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'home_use_case' })
    );
  });
});

describe('PortalBlogCard', () => {
  it('ランキング基準の文字階層と右下の文字なしサムネイルを表示する', () => {
    const { container } = render(
      <PortalBlogCard
        slug="population-change"
        title="人口が増えている都道府県は？"
      />
    );

    const link = screen.getByRole('link', {
      name: /人口が増えている都道府県/,
    });
    const image = container.querySelector('img');

    expect(link).toHaveAttribute('href', '/blog/population-change');
    // カード全体は固定比率を持たず、画像だけを aspect-video の枠に置く (狭い幅で画像が帯にならない)
    expect(link.className).not.toMatch(/aspect-/);
    expect(image?.parentElement).toHaveClass('aspect-video');
    expect(image).toHaveAttribute(
      'src',
      'https://storage.stats47.jp/app/blog/population-change/thumbnail-light.webp?v=20260822-v3'
    );
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveClass('absolute', 'object-cover');
    // 題名は語の途中で切らない (行数で省略しない)。節の見出しと同じ「統計ブログ」の札は置かない
    const blogTitle = screen.getByText('人口が増えている都道府県は？');
    expect(blogTitle).toHaveClass('text-sm', 'font-semibold', 'text-pretty');
    expect(blogTitle.className).not.toMatch(/line-clamp/);
    expect(screen.queryByText('統計ブログ')).toBeNull();
  });

  it('カテゴリ配置では category_blog を計測する', () => {
    navMock.mockClear();
    render(
      <PortalBlogCard
        slug="population-change"
        title="人口が増えている都道府県は？"
        surface="category_blog"
      />
    );

    fireEvent.click(
      screen.getByRole('link', { name: /人口が増えている都道府県/ })
    );
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: 'category_blog',
        href: '/blog/population-change',
      })
    );
  });
});
