'use client';

/**
 * サイトのヘッダー。テンプレート (shadcndashboard) の vertical/header に寄せた。
 *
 * 左: サイドバーの開閉 (SidebarTrigger) + lg 未満でだけ出すロゴ。中: 検索。右: 配色の切り替え。
 * ナビのリンクはサイドバー (AppSidebar) に集め、ヘッダーには置かない。
 * ルートレイアウトの SidebarInset の中に置くので、画面遷移で再マウントされず検索欄の入力は残る。
 * `cookies()` / `headers()` は呼ばない (SSG 維持: .claude/rules/nextjs-ssg-preservation.md)。
 */
import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button } from '@stats47/components/atoms/ui/button';
import { Input } from '@stats47/components/atoms/ui/input';
import { Separator } from '@stats47/components/atoms/ui/separator';
import { SidebarTrigger } from '@stats47/components/atoms/ui/sidebar';
import { Moon, Search, Sun } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';

import { trackSearch } from '@/lib/analytics/events';

import { useTheme } from '@/hooks/useTheme';

export function SiteHeader() {
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <header className="portal-header sticky top-0 z-200 border-b border-border bg-background">
      <div className="flex h-12 items-center gap-2 px-2">
        <SidebarTrigger aria-label="メニューを開閉する" />
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 lg:hidden"
          aria-label="stats47 ホーム"
        >
          <ThemeAwareImage
            lightSrc="/brand/atlas-v1/mark.svg"
            darkSrc="/brand/atlas-v1/mark-inverse.svg"
            alt=""
            width={20}
            height={20}
            className="size-5 shrink-0"
          />
          <span className="whitespace-nowrap text-lg font-bold leading-none text-foreground">
            stats<span className="text-primary">47</span>
          </span>
        </Link>
        <Separator
          orientation="vertical"
          className="mx-1 h-4 data-[orientation=vertical]:self-center max-lg:hidden"
        />
        <form onSubmit={handleSearch} role="search" className="hidden sm:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="統計を検索"
              aria-label="統計を検索"
              className="h-8 w-56 pl-8"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            className="flex size-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:hidden"
            aria-label="検索"
          >
            <Search className="size-5" />
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="テーマの切り替え"
            className="relative overflow-hidden text-muted-foreground hover:text-foreground"
            suppressHydrationWarning
          >
            <span className="relative flex h-full w-full items-center justify-center">
              <Sun className="absolute size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
