import { HOME_PORTAL_USE_CASES, listCategories } from '@stats47/data-configs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const { navMock } = vi.hoisted(() => ({ navMock: vi.fn() }));
vi.mock('@/lib/analytics/events', () => ({
  trackNavClick: (...args: unknown[]) => navMock(...args),
}));

import { PortalAreaEntry } from '../PortalAreaEntry';
import { PortalBlogCard } from '../PortalBlogCard';
import { PortalCategoryGrid } from '../PortalCategoryGrid';
import { PortalUseCaseGrid } from '../PortalUseCaseGrid';

const AREA_MAP_SVG =
  '<svg data-map-layout="prefecture-overview"><path data-pref-code="13"/></svg>';

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
    render(<PortalUseCaseGrid />);
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

describe('PortalAreaEntry', () => {
  it('/areas への地図付き単一入口を描画する', () => {
    const { container } = render(<PortalAreaEntry mapSvg={AREA_MAP_SVG} />);
    const link = screen.getByRole('link', { name: /都道府県から探す/ });
    expect(link).toHaveAttribute('href', '/areas');
    expect(link).toHaveClass('aspect-[1.47/1]');
    expect(
      container.querySelector('[data-map-layout="prefecture-overview"]')
    ).toBeInTheDocument();
  });

  it('クリックで home_area を計測する', () => {
    navMock.mockClear();
    render(<PortalAreaEntry mapSvg={AREA_MAP_SVG} />);
    fireEvent.click(screen.getByRole('link', { name: /都道府県から探す/ }));
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'home_area', href: '/areas' })
    );
  });
});

describe('PortalBlogCard', () => {
  it('画像に依存せずタイトルと要約を表示する', () => {
    const { container } = render(
      <PortalBlogCard
        slug="population-change"
        title="人口が増えている都道府県は？"
        description="47都道府県の人口増減率を比較します。"
      />
    );

    expect(
      screen.getByRole('link', { name: /人口が増えている都道府県/ })
    ).toHaveAttribute('href', '/blog/population-change');
    expect(
      screen.getByRole('link', { name: /人口が増えている都道府県/ })
    ).toHaveClass('aspect-[1.47/1]');
    expect(
      screen.getByText('47都道府県の人口増減率を比較します。')
    ).toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });
});
