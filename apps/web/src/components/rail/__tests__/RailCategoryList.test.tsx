import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RailCategoryList } from '../RailCategoryList';

const { navMock } = vi.hoisted(() => ({ navMock: vi.fn() }));
vi.mock('@/lib/analytics/events', () => ({
  trackNavClick: (...args: unknown[]) => navMock(...args),
}));

const ITEMS = [
  { categoryKey: 'population', categoryName: '人口・世帯', count: 120 },
  { categoryKey: 'economy', categoryName: '経済・産業', count: 45 },
];

describe('RailCategoryList', () => {
  it('通常行を /category/<key> の RailNavRow としてカテゴリ導線の nav 内に描画する', () => {
    render(<RailCategoryList items={ITEMS} trackingSurface="home_category" />);

    const nav = screen.getByRole('navigation', { name: 'カテゴリから探す' });
    const link = within(nav).getByRole('link', { name: /人口・世帯/ });
    expect(link).toHaveAttribute('href', '/category/population');
    expect(link.tagName).toBe('A');
  });

  it('件数ありは「N件」と sr-only「のランキング」を表示する', () => {
    render(<RailCategoryList items={ITEMS} trackingSurface="home_category" />);

    const link = screen.getByRole('link', { name: /人口・世帯/ });
    expect(link).toHaveTextContent('120件');
    expect(link).toHaveTextContent('のランキング');
  });

  it('showCount=false では件数を表示しない', () => {
    render(
      <RailCategoryList
        items={ITEMS}
        showCount={false}
        trackingSurface="home_category"
      />
    );

    const link = screen.getByRole('link', { name: '人口・世帯' });
    expect(link).not.toHaveTextContent('件');
  });

  it('activeCategoryKey に一致する行は aria-current="page" と bg-accent を持つ', () => {
    render(
      <RailCategoryList
        items={ITEMS}
        activeCategoryKey="economy"
        trackingSurface="category_sidebar"
      />
    );

    const active = screen.getByRole('link', { name: /経済・産業/ });
    const inactive = screen.getByRole('link', { name: /人口・世帯/ });
    expect(active).toHaveAttribute('aria-current', 'page');
    expect(active).toHaveClass('bg-accent', 'font-semibold', 'text-primary');
    expect(inactive).not.toHaveAttribute('aria-current');
  });

  it('行クリックで trackingSurface を渡した trackNavClick を呼ぶ', () => {
    navMock.mockClear();
    render(<RailCategoryList items={ITEMS} trackingSurface="ranking_category" />);

    screen.getByRole('link', { name: /人口・世帯/ }).click();

    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({
        label: '人口・世帯',
        href: '/category/population',
        surface: 'ranking_category',
      })
    );
  });

  it('moreLink は最終行としてtrackingLabelで計測される', () => {
    navMock.mockClear();
    render(
      <RailCategoryList
        items={ITEMS}
        trackingSurface="home_category"
        moreLink={{
          href: '/ranking',
          label: 'すべてのランキングを見る',
          trackingLabel: 'category:all',
        }}
      />
    );

    const nav = screen.getByRole('navigation', { name: 'カテゴリから探す' });
    const links = within(nav).getAllByRole('link');
    const last = links[links.length - 1];
    expect(last).toHaveTextContent('すべてのランキングを見る');
    expect(last).toHaveAttribute('href', '/ranking');

    last.click();
    expect(navMock).toHaveBeenCalledWith(
      expect.objectContaining({
        label: 'category:all',
        href: '/ranking',
        surface: 'home_category',
      })
    );
  });

  it('density=compact は min-h-11 sm:min-h-9 のタップ領域を保つ', () => {
    render(
      <RailCategoryList
        items={ITEMS}
        density="compact"
        trackingSurface="home_category"
      />
    );

    const link = screen.getByRole('link', { name: /人口・世帯/ });
    expect(link).toHaveClass('min-h-11', 'sm:min-h-9');
  });

  it('Tab でフォーカスできるリンクとして focus-visible:ring-2 を持つ', () => {
    render(<RailCategoryList items={ITEMS} trackingSurface="home_category" />);

    const link = screen.getByRole('link', { name: /人口・世帯/ });
    expect(link.tagName).toBe('A');
    expect(link).toHaveClass('focus-visible:ring-2');
    link.focus();
    expect(link).toHaveFocus();
  });
});
