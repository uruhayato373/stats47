/**
 * サイト全体のナビ (AppSidebar) の契約。
 *
 * - SSR の HTML にナビの全リンクが a[href] で出る (検索エンジンと JS 前の利用者が辿れる)
 * - サイドバー内の現在地 ([data-active=true]) は常に 1 件だけ
 * - 主要ナビはサイトの内容の種類だけ。調査・地域間比較・下端の出口は置かない (2026-10-28 オーナー合意)
 * - テーマのグループを主要ナビの直後に置き、5 系統を既定で開く。カテゴリはその後で既定は閉じ、件数の札を出さない
 * - 主要ナビ・カテゴリ・テーマの系統の項目にはすべてアイコンがある
 * - lg (1024px) 未満ではヘッダーの開閉ボタンで Sheet が開き、リンクを押すと閉じる
 * - クリックは PC で 'sidebar'、Sheet で 'sidebar-mobile' の導線名で共通のクリック監視に渡る
 */
import { SidebarProvider } from '@stats47/components/atoms/ui/sidebar';
import { hrefFor } from '@stats47/data-configs/content/href';
import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { THEME_NAV_GROUPS } from '@/features/theme-dashboard/config/theme-navigation';
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
    // 地域の 3 段をメニューに出した (2026-10-31): 市区町村の比較・市区町村のページは「市区町村」、全国は「全国」
    ['/municipalities/themes/aging-society', '/municipalities'],
    ['/areas/37000/cities/37203', '/municipalities'],
    ['/municipalities/ranking/manufacturing-shipment-amount/23000', '/municipalities'],
    ['/areas/37000', '/areas'],
    ['/japan/labor-wages', '/japan'],
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

  it('テーマのグループは既定で開き、カテゴリは既定で閉じる (閉じてもリンクは DOM に残り、見出しで開ける)', async () => {
    const categoryHref = hrefFor('category', {
      categoryKey: RANKING_PROMINENCE_CATEGORIES[0].categoryKey,
    });
    const { container } = render(<Shell />);
    expect(screen.getByRole('button', { name: 'テーマ' })).toHaveAttribute('aria-expanded', 'true');
    const categoryTrigger = screen.getByRole('button', { name: 'カテゴリ' });
    expect(categoryTrigger).toHaveAttribute('aria-expanded', 'false');
    // 閉じていてもリンクは DOM に残る (hidden="until-found")
    expect(container.querySelector(`[data-slot="sidebar"] a[href="${categoryHref}"]`)).not.toBeNull();

    await act(async () => {
      fireEvent.click(categoryTrigger);
    });
    expect(categoryTrigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('カテゴリのページではカテゴリのグループが開く (現在地を含むグループは既定にかかわらず開く)', () => {
    navigation.pathname = hrefFor('category', {
      categoryKey: RANKING_PROMINENCE_CATEGORIES[0].categoryKey,
    });
    render(<Shell />);
    expect(screen.getByRole('button', { name: 'カテゴリ' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('テーマは 5 系統の開閉できる項目に分け、どの系統も既定で開く', () => {
    render(<Shell />);
    for (const group of THEME_NAV_GROUPS) {
      expect(screen.getByRole('button', { name: group.label })).toHaveAttribute('aria-expanded', 'true');
    }
  });

  it('主要ナビ・カテゴリ・テーマの系統の項目にはすべてアイコンがある', () => {
    const { container } = render(<Shell />);
    const buttons = container.querySelectorAll('[data-slot="sidebar"] [data-slot="sidebar-menu-button"]');
    expect(buttons.length).toBeGreaterThanOrEqual(
      PRIMARY_NAV_ITEMS.length + RANKING_PROMINENCE_CATEGORIES.length + THEME_NAV_GROUPS.length
    );
    for (const button of buttons) {
      expect(button.querySelector('svg'), button.textContent ?? '').not.toBeNull();
    }
  });

  it('調査・地域間比較・下端の出口は置かない (サイトの切り口ではない配線・ツール)', () => {
    const { container } = render(<Shell />);
    const sidebar = container.querySelector('[data-slot="sidebar"]');
    expect(sidebar?.querySelector('[data-slot="sidebar-footer"]')).toBeNull();
    expect(sidebar?.querySelector('a[href="/survey"]')).toBeNull();
    expect(sidebar?.querySelector('a[href="/category/population/compare"]')).toBeNull();
    expect(sidebar).not.toHaveTextContent('地域間比較');
  });

  it('調査のページではサイドバーのどの項目も現在地にしない', () => {
    navigation.pathname = '/survey/population-census';
    const { container } = render(<Shell />);
    expect(container.querySelectorAll('[data-slot="sidebar"] [data-active="true"]')).toHaveLength(0);
  });

  it('主要ナビ・カテゴリ・テーマのグループ名は同じ作り (SidebarGroupLabel + font-semibold)', () => {
    const { container } = render(<Shell />);
    const sidebar = container.querySelector('[data-slot="sidebar"]');
    const labels = [...(sidebar?.querySelectorAll('[data-slot="sidebar-group-label"]') ?? [])].map(
      (label) => label.textContent
    );
    expect(labels).toEqual(['メニュー', 'テーマ', 'カテゴリ']);
    // font-semibold は Sidebar の className (グループ名すべてへの子孫指定) で当てる
    expect(container.innerHTML).toContain('**:data-[slot=sidebar-group-label]:font-semibold');
  });

  it('ヘッダーはロゴ + 名前 + 副題の 2 段', () => {
    const { container } = render(<Shell />);
    const header = container.querySelector('[data-slot="sidebar"] [data-slot="sidebar-header"]');
    expect(header).toHaveTextContent('stats47');
    expect(header).toHaveTextContent('統計で見る都道府県');
  });

  it('カテゴリに件数の札を出さない (選ぶ判断に役立たない)', () => {
    const { container } = render(<Shell />);
    expect(container.querySelector('[data-slot="sidebar"] [data-slot="sidebar-menu-badge"]')).toBeNull();
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
