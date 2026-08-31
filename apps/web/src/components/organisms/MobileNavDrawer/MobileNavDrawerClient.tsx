'use client';

import { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@stats47/components';
import { Separator } from '@stats47/components/atoms/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@stats47/components/atoms/ui/sheet';
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  Home,
  Map,
  MapPin,
  Search,
  TrendingUp,
} from 'lucide-react';

import { trackNavClick } from '@/lib/analytics/events';

import { useBreakpoint } from '@/hooks/useBreakpoint';

import { useSidebarStore } from '@/store/sidebar-store';

/** ドロワーに出す curated テーマの最小ナビ情報。 */
interface ThemeNavItem {
  themeKey: string;
  title: string;
}

interface MobileNavDrawerClientProps {
  themes: ThemeNavItem[];
}

// 並び順・ラベルは desktop ヘッダー (HeaderClient) に揃える:
// ホーム → ランキング → 都道府県 → 市区町村 → 地域分析 → 統計ブログ → 地域間比較 → 検索。
// ラベルは surface 間で nav_label が割れないよう desktop と一致させる
// (「地域の特徴」→「都道府県」/「ブログ」→「統計ブログ」)。
const NAV_LINKS = [
  {
    href: '/',
    label: 'ホーム',
    icon: Home,
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
  {
    href: '/ranking',
    label: 'ランキング',
    icon: TrendingUp,
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400',
  },
  {
    href: '/areas',
    label: '都道府県',
    icon: MapPin,
    color:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  {
    href: '/municipalities',
    label: '市区町村',
    icon: Building2,
    color:
      'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  },
  {
    href: '/geo',
    label: '地域分析',
    icon: Map,
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  },
  {
    href: '/blog',
    label: '統計ブログ',
    icon: BookOpen,
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400',
  },
  {
    href: '/category/population/compare',
    label: '地域間比較',
    icon: ArrowLeftRight,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  },
  {
    href: '/search',
    label: '検索',
    icon: Search,
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
] as const;

/**
 * モバイル専用ナビゲーションドロワー（Sheet）
 *
 * PC 常設サイドバー廃止に伴い、モバイル（lg 未満）のナビ手段として残す。
 * `useSidebarStore.isOpen` で開閉。PC では何も描画しない。
 *
 * 設計仕様: docs/01_技術設計/04_デザインシステム.md
 */
export function MobileNavDrawerClient({ themes }: MobileNavDrawerClientProps) {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const open = useSidebarStore((s) => s.open);
  const close = useSidebarStore((s) => s.close);
  const isMobile = useBreakpoint('belowLg');
  const pathname = usePathname();

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (next) {
        open();
      } else {
        close();
      }
    },
    [open, close]
  );

  // ルート変更時に閉じる
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  useEffect(() => {
    if (mounted) {
      close();
    }
    // pathname 変化時のみ閉じる
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // PC では描画しない（Sheet 自体を出さない）
  if (!isMobile) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="left" className="w-72 border-r p-0">
        <SheetTitle className="sr-only">メニュー</SheetTitle>
        <SheetDescription className="sr-only">
          ナビゲーションメニュー
        </SheetDescription>
        <div className="flex h-full w-full flex-col bg-sidebar">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {/* 主要ナビ */}
            <nav className="space-y-0.5">
              {NAV_LINKS.map(({ href, label, icon: Icon, color }) => {
                const isActive =
                  href === '/' ? pathname === '/' : pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    prefetch={false}
                    onClick={() =>
                      trackNavClick({ label, href, surface: 'mobile-drawer' })
                    }
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/60',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-md',
                        color
                      )}
                    >
                      <Icon size={16} />
                    </span>
                    {label}
                  </Link>
                );
              })}
            </nav>

            <Separator className="my-3" />

            {/* テーマ (curated ダッシュボード。category は内部利用に降格) */}
            <h2 className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              テーマ
            </h2>
            <nav className="flex flex-col">
              {themes.map((theme) => {
                const href = `/themes/${theme.themeKey}`;
                const isActive = pathname?.startsWith(href) ?? false;
                return (
                  <Link
                    key={theme.themeKey}
                    href={href}
                    prefetch={false}
                    onClick={() =>
                      trackNavClick({
                        label: theme.title,
                        href,
                        surface: 'mobile-drawer',
                      })
                    }
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent/60',
                      isActive && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {theme.title}
                  </Link>
                );
              })}
              <Link
                href="/themes"
                prefetch={false}
                onClick={() =>
                  trackNavClick({
                    label: 'すべてのテーマ',
                    href: '/themes',
                    surface: 'mobile-drawer',
                  })
                }
                className="mt-1 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-accent/60"
              >
                すべてのテーマを見る →
              </Link>
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
