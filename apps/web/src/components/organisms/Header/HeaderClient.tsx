'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { cn } from '@stats47/components';
import { Button } from '@stats47/components/atoms/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@stats47/components/atoms/ui/dropdown-menu';
import { Input } from '@stats47/components/atoms/ui/input';
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  Moon,
  Search,
  Sun,
} from 'lucide-react';

import { trackNavClick, trackSearch } from '@/lib/analytics/events';

import { useTheme } from '@/hooks/useTheme';

import { useSidebarStore } from '@/store/sidebar-store';

import { getActiveHeaderNav, type HeaderNavKey } from './header-navigation';

type NavItem = {
  key: HeaderNavKey;
  href: string;
  label: string;
};

// nav 並び順は情報設計 (docs/01_技術設計/07) + ベンチマーク §3.1 に沿う:
// ランキング → 都道府県 → 市区町村 → (テーマ dropdown) → 地域分析 → 統計ブログ。
// 「都道府県」は stats47 固有価値なので primary nav の上位に置く。
// テーマ dropdown は下の render で 都道府県 と 統計ブログ の間に挿入する。
const NAV_ITEMS_BEFORE_THEME: NavItem[] = [
  {
    key: 'ranking',
    href: '/ranking',
    label: 'ランキング',
  },
  {
    key: 'areas',
    href: '/areas',
    label: '都道府県',
  },
  {
    key: 'municipalities',
    href: '/municipalities',
    label: '市区町村',
  },
];

const NAV_ITEMS_AFTER_THEME: NavItem[] = [
  {
    key: 'geo',
    href: '/geo',
    label: '地域分析',
  },
  {
    key: 'blog',
    href: '/blog',
    label: '統計ブログ',
  },
];

/** メガメニューに出す curated テーマの最小ナビ情報。 */
interface ThemeNavItem {
  themeKey: string;
  title: string;
}

interface HeaderClientProps {
  themes: ThemeNavItem[];
  categories: Array<{
    categoryKey: string;
    title: string;
    count: number;
    rankings: Array<{ rankingKey: string; title: string }>;
  }>;
}

/**
 * アプリケーションヘッダー（Client）
 *
 * PC: ロゴ + ナビ（ランキング / カテゴリ / 都道府県 / テーマ / ブログ）
 *     + 検索 + テーマ切替。
 * モバイル（lg 未満）: メニューボタンでドロワー（MobileNavDrawer）を開く。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
export function HeaderClient({ themes, categories }: HeaderClientProps) {
  const { toggleTheme } = useTheme();
  const toggleDrawer = useSidebarStore((s) => s.toggle);
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(
    categories[0]?.categoryKey ?? ''
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;
      try {
        trackSearch({ searchTerm: q });
      } catch {
        // analytics 失敗で遷移を止めない
      }
      router.push(`/search?q=${encodeURIComponent(q)}`);
    },
    [searchQuery, router]
  );

  const activeNav = getActiveHeaderNav(pathname);
  const selectedCategory =
    categories.find(
      (category) => category.categoryKey === selectedCategoryKey
    ) ?? categories[0];

  const handleNavClick = (label: string, href: string) => {
    try {
      trackNavClick({ label, href, surface: 'desktop-header' });
    } catch {
      // analytics 失敗で遷移を止めない
    }
  };

  const renderNavLink = ({ key, href, label }: NavItem) => {
    const isActive = activeNav === key;
    return (
      <Link
        key={href}
        href={href}
        onClick={() => handleNavClick(label, href)}
        aria-current={isActive ? 'page' : undefined}
        data-active={isActive ? 'true' : undefined}
        className={cn(
          'relative flex h-full items-center whitespace-nowrap border-b-2 px-3 text-[13px] font-semibold transition-colors',
          isActive
            ? 'border-primary text-foreground'
            : 'border-transparent text-foreground/80 hover:text-foreground'
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className="portal-header sticky top-0 z-[200] h-14 border-b bg-card lg:h-[52px]"
      suppressHydrationWarning
    >
      <div className="flex h-full w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
        {/* 左: モバイルメニュー + ロゴ */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDrawer}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="メニューを開く"
            suppressHydrationWarning
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2"
            aria-label="stats47 ホーム"
          >
            <BarChart3
              aria-hidden="true"
              className="size-5 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 lg:size-6"
            />
            <span className="whitespace-nowrap text-lg font-bold leading-none tracking-tight text-foreground lg:text-xl">
              stats<span className="text-primary">47</span>
            </span>
          </Link>
        </div>

        {/* 中央: デスクトップナビ (ランキング → 都道府県 → 市区町村 → テーマ → 地域分析 → 統計ブログ) */}
        <nav className="hidden h-full items-center gap-1 lg:flex">
          {NAV_ITEMS_BEFORE_THEME.slice(0, 1).map(renderNavLink)}

          {categories.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex h-full items-center gap-1 whitespace-nowrap border-b-2 px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    activeNav === 'category'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-foreground/80 hover:text-foreground'
                  )}
                  aria-label="カテゴリから探す"
                  data-active={activeNav === 'category' ? 'true' : undefined}
                >
                  カテゴリ
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-[min(92vw,760px)] p-0"
              >
                <div className="grid min-h-[430px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <div className="border-r border-border p-2">
                    <p className="border-b border-border px-2 pb-2 text-xs font-semibold text-muted-foreground">
                      カテゴリから探す
                    </p>
                    <div className="grid grid-cols-2 pt-1">
                      {categories.map((category) => {
                        const isSelected =
                          category.categoryKey ===
                          selectedCategory?.categoryKey;
                        return (
                          <Link
                            key={category.categoryKey}
                            href={`/category/${category.categoryKey}`}
                            onMouseEnter={() =>
                              setSelectedCategoryKey(category.categoryKey)
                            }
                            onFocus={() =>
                              setSelectedCategoryKey(category.categoryKey)
                            }
                            onClick={() =>
                              handleNavClick(
                                category.title,
                                `/category/${category.categoryKey}`
                              )
                            }
                            className={cn(
                              'flex min-h-10 items-center gap-2 px-2 py-1.5 text-[13px] transition-colors',
                              isSelected
                                ? 'bg-accent text-accent-foreground'
                                : 'text-foreground/80 hover:bg-accent/60 hover:text-foreground'
                            )}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {category.title}
                            </span>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                              {category.count}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-4">
                    {selectedCategory && (
                      <>
                        <div className="flex items-baseline justify-between border-b border-border pb-3">
                          <p className="font-semibold text-foreground">
                            {selectedCategory.title}
                          </p>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {selectedCategory.count}件
                          </span>
                        </div>
                        <div className="pt-2">
                          {selectedCategory.rankings.map((ranking) => {
                            const href = `/ranking/${ranking.rankingKey}`;
                            return (
                              <Link
                                key={ranking.rankingKey}
                                href={href}
                                onClick={() =>
                                  handleNavClick(ranking.title, href)
                                }
                                className="group flex min-h-11 items-center gap-2 border-b border-border py-2 text-sm text-foreground/80 hover:text-primary"
                              >
                                <span className="min-w-0 flex-1 line-clamp-2">
                                  {ranking.title}
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                              </Link>
                            );
                          })}
                        </div>
                        <Link
                          href={`/category/${selectedCategory.categoryKey}`}
                          onClick={() =>
                            handleNavClick(
                              `${selectedCategory.title}をすべて見る`,
                              `/category/${selectedCategory.categoryKey}`
                            )
                          }
                          className="mt-4 flex items-center justify-between text-sm font-semibold text-primary hover:underline"
                        >
                          このカテゴリをすべて見る
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {NAV_ITEMS_BEFORE_THEME.slice(1).map(renderNavLink)}

          {/* テーマ メガメニュー (市区町村 と 地域分析 の間。category は内部利用に降格) */}
          {themes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex h-full items-center gap-1 whitespace-nowrap border-b-2 px-3 text-[13px] font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    activeNav === 'themes'
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-foreground/80 hover:text-foreground'
                  )}
                  aria-label="テーマ一覧"
                  data-active={activeNav === 'themes' ? 'true' : undefined}
                >
                  テーマ
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                sideOffset={8}
                className="w-[min(92vw,560px)] p-3"
              >
                <div className="grid grid-cols-2 gap-1">
                  {themes.map((theme) => {
                    const href = `/themes/${theme.themeKey}`;
                    const isActive = pathname.startsWith(href);
                    return (
                      <Link
                        key={theme.themeKey}
                        href={href}
                        onClick={() => handleNavClick(theme.title, href)}
                        className={cn(
                          'rounded-md px-2.5 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-foreground/80 hover:bg-accent/60 hover:text-foreground'
                        )}
                      >
                        <span className="truncate">{theme.title}</span>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href="/themes"
                  onClick={() => handleNavClick('すべてのテーマ', '/themes')}
                  className="mt-2 block rounded-md px-2.5 py-2 text-sm font-medium text-primary hover:bg-accent/60"
                >
                  すべてのテーマを見る →
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {NAV_ITEMS_AFTER_THEME.map(renderNavLink)}
        </nav>

        {/* 右: 検索 + テーマ切替 */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <form onSubmit={handleSearch} className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="統計を検索"
                aria-label="統計を検索"
                className="h-8 w-44 border-border/80 bg-muted/50 pl-8 pr-3 text-[13px] transition-colors focus-visible:bg-background"
              />
            </div>
          </form>

          <Link
            href="/search"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="検索"
          >
            <Search className="h-5 w-5" />
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="テーマの切り替え"
            className="relative overflow-hidden text-muted-foreground hover:text-foreground lg:size-8"
            suppressHydrationWarning
          >
            <span className="relative flex h-full w-full items-center justify-center">
              <Sun className="absolute size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 lg:size-4" />
              <Moon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 lg:size-4" />
            </span>
            <span className="sr-only">テーマの切り替え</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
