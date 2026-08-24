import { HOME_PORTAL_USE_CASES, listCategories } from '@stats47/data-configs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const { navMock } = vi.hoisted(() => ({ navMock: vi.fn() }));
vi.mock('@/lib/analytics/events', () => ({
  trackNavClick: (...args: unknown[]) => navMock(...args),
}));

import { PortalBlogCard } from '../PortalBlogCard';
import { PortalCategoryGrid } from '../PortalCategoryGrid';
import { PortalUseCaseGrid } from '../PortalUseCaseGrid';

describe('PortalCategoryGrid', () => {
  it('全カテゴリを /category/<key> リンクで描画する', () => {
    render(<PortalCategoryGrid />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(listCategories().length + 1);
    const population = screen.getByRole('link', { name: /人口・世帯/ });
    expect(population).toHaveAttribute('href', '/category/population');
  });

  it('カテゴリクリックで home_category を計測する', () => {
    navMock.mockClear();
    render(<PortalCategoryGrid />);
    fireEvent.click(screen.getByRole('link', { name: /人口・世帯/ }));
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: 'home_category',
        href: '/category/population',
      })
    );
  });
});

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
    expect(migrationLink).toHaveClass('aspect-[1.47/1]');
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
    expect(screen.getByText('移住先を比較したい')).toHaveClass(
      'text-sm',
      'font-semibold',
      'line-clamp-2'
    );
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
    expect(link).toHaveClass('aspect-[1.47/1]');
    expect(image).toHaveAttribute(
      'src',
      'https://storage.stats47.jp/app/blog/population-change/thumbnail-light.webp?v=20260822-v3'
    );
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveClass('absolute', 'object-cover');
    expect(screen.getByText('人口が増えている都道府県は？')).toHaveClass(
      'text-sm',
      'font-semibold',
      'line-clamp-2'
    );
    expect(screen.getByText('統計ブログ')).toBeVisible();
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
