/**
 * サイト全体のナビ (AppSidebar) の契約。
 *
 * - SSR の HTML にナビの全リンクが a[href] で出る (検索エンジンと JS 前の利用者が辿れる)
 * - サイドバー内の現在地 ([data-active=true]) は常に 1 件だけ
 * - lg (1024px) 未満ではヘッダーの開閉ボタンで Sheet が開き、リンクを押すと閉じる
 * - クリックは PC で 'sidebar'、Sheet で 'sidebar-mobile' の導線名で共通のクリック監視に渡る
 */
import { SidebarProvider } from '@stats47/components/atoms/ui/sidebar';
import { hrefFor } from '@stats47/data-configs/content/href';
import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { NAV_THEMES, themeHref } from '@/features/theme-dashboard/config/theme-urls';

import { resolveNavClick } from '@/lib/analytics/components/NavClickTracker';

import { SiteHeader } from '../../SiteHeader/SiteHeader';
import { AppSidebar } from '../index';
import { PRIMARY_NAV_ITEMS } from '../site-navigation';

const navigation = vi.hoisted(() => ({ pathname: '/' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), systemTheme: 'light', resolvedTheme: 'light' }),
}));

const EXPECTED_HREFS = [
  ...PRIMARY_NAV_ITEMS.map((item) => item.href),
  ...RANKING_PROMINENCE_CATEGORIES.map((category) =>
    hrefFor('category', { categoryKey: category.categoryKey })
  ),
  ...NAV_THEMES.map((theme) => themeHref(theme.themeKey)),
  '/themes',
];

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: width });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function Shell() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <div>
        <SiteHeader />
      </div>
    </SidebarProvider>
  );
}

describe('AppSidebar', () => {
  beforeEach(() => {
    navigation.pathname = '/';
    setViewportWidth(1440);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('SSR の HTML に主要ナビ・カテゴリ・テーマの全 href が a 要素で出る', () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Shell />);
    const sidebar = container.querySelector('[data-slot="sidebar"]');
    expect(sidebar).not.toBeNull();
    const hrefs = new Set(
      [...(sidebar?.querySelectorAll('a[href]') ?? [])].map((a) => a.getAttribute('href'))
    );

    expect(EXPECTED_HREFS.length).toBeGreaterThan(PRIMARY_NAV_ITEMS.length + 10);
    for (const href of EXPECTED_HREFS) {
      expect(hrefs, href).toContain(href);
    }
  });

  it.each([
    ['/', '/'],
    ['/ranking/annual-income', '/ranking'],
    ['/category/laborwage', '/category/laborwage'],
    ['/areas/37000/cities/37203', '/municipalities'],
    ['/themes', '/themes'],
    [themeHref(NAV_THEMES[0].themeKey), themeHref(NAV_THEMES[0].themeKey)],
  ])('%s ではサイドバー内の現在地が %s の 1 件だけ', (pathname, expectedHref) => {
    navigation.pathname = pathname;
    const { container } = render(<Shell />);
    const active = container.querySelectorAll('[data-slot="sidebar"] [data-active="true"]');
    expect(active).toHaveLength(1);
    expect(active[0]).toHaveAttribute('href', expectedHref);
    expect(active[0]).toHaveAttribute('aria-current', 'page');
  });

  it('PC のサイドバーのリンクは sidebar の導線名で送られる', () => {
    const { container } = render(<Shell />);
    const link = container.querySelector('[data-slot="sidebar"] a[href="/ranking"]');
    expect(
      resolveNavClick(link, { href: 'http://localhost/', origin: 'http://localhost', pathname: '/' })
    ).toEqual({ label: 'ランキング', href: '/ranking', surface: 'sidebar' });
  });

  it('390px では開閉ボタンで Sheet が開き、リンクを押すと閉じる', async () => {
    setViewportWidth(390);
    render(<Shell />);

    // hydration 後は Sheet に替わり、閉じている間はナビのリンクが無い
    expect(document.querySelector('[data-slot="sidebar"] a[href="/ranking"]')).toBeNull();

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'メニューを開閉する' }));
    });
    const sheet = await screen.findByRole('dialog');
    const link = within(sheet).getByRole('link', { name: 'ランキング' });
    expect(
      resolveNavClick(link, { href: 'http://localhost/', origin: 'http://localhost', pathname: '/' })
    ).toMatchObject({ surface: 'sidebar-mobile' });

    await act(async () => {
      fireEvent.click(link);
    });
    await vi.waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });
});
