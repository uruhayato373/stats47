'use client';

/**
 * サイトのヘッダー。テンプレート (shadcndashboard) の vertical/header に寄せた。
 *
 * 左: サイドバーの開閉 (SidebarTrigger) + lg 未満でだけ出すロゴ。中: 検索。
 * 右: テンプレートと同じ寸法 (size="icon") のアイコンボタン群。一覧への出口 (ランキング・テーマ) と配色の切り替え。
 * ナビのリンクはサイドバー (AppSidebar) に集め、ヘッダーには置かない。
 * ルートレイアウトの SidebarInset の中に置くので、画面遷移で再マウントされず検索欄の入力は残る。
 * 行の高さ (HEADER_HEIGHT_CLASS) は AppSidebar の SidebarHeader と同じ値にし、両方の下線を一直線に揃える。
 * 検索欄はテンプレートの shared/header/search.tsx と同じ組み立て (アイコン left-3・Input pl-10!・幅 w-xs)。
 * pl-10 に ! を付けるのは、style-lyra.css がレイヤーの外で .cn-input の px-2.5 を当て、素の pl-* に勝つため
 * (テンプレートも同じく ! を付けている)。表示文字の大きさも同じ理由で text-sm! にする (lyra の .cn-input は text-xs)。
 * `cookies()` / `headers()` は呼ばない (SSG 維持: .claude/rules/nextjs-ssg-preservation.md)。
 */
import { useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button, buttonVariants } from '@stats47/components/atoms/ui/button';
import { Input } from '@stats47/components/atoms/ui/input';
import { Separator } from '@stats47/components/atoms/ui/separator';
import { SidebarTrigger } from '@stats47/components/atoms/ui/sidebar';
import { LayoutGrid, ListOrdered, Moon, Search, Sun } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';

import { trackSearch } from '@/lib/analytics/events';

import { useTheme } from '@/hooks/useTheme';

/**
 * ヘッダーとサイドバー上端の行の高さ (56px)。AppSidebar の SidebarHeader にも同じ h-14 を書く
 * (AppSidebar は Server Component なので、'use client' のこのファイルから定数を import しない)。
 */
const HEADER_HEIGHT_CLASS = 'h-14';

/** 右端のアイコンボタン (テンプレートの header と同じ ghost + size="icon") */
const ICON_BUTTON_CLASS = buttonVariants({
  variant: 'ghost',
  size: 'icon',
  className: 'text-muted-foreground hover:text-foreground',
});

/** 右端に並べる一覧への出口。サイドバーを閉じていても 1 回で一覧へ行ける */
const HEADER_LINKS = [
  { href: '/ranking', label: 'ランキング一覧', icon: ListOrdered },
  { href: '/themes', label: 'テーマ一覧', icon: LayoutGrid },
] as const;

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
    <header
      className={`portal-header sticky top-0 z-200 border-b border-border bg-background ${HEADER_HEIGHT_CLASS}`}
    >
      <div className="flex h-full items-center gap-2 p-2">
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
          <div className="relative flex w-xs items-center">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="統計を検索"
              aria-label="統計を検索"
              className="pl-10! text-sm! placeholder:text-muted-foreground"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            data-slot="button"
            className={`${ICON_BUTTON_CLASS} sm:hidden`}
            aria-label="検索"
          >
            <Search className="size-4" />
          </Link>
          {HEADER_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              data-slot="button"
              data-nav-label={label}
              className={ICON_BUTTON_CLASS}
              aria-label={label}
              title={label}
            >
              <Icon className="size-4" />
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="テーマの切り替え"
            className="relative overflow-hidden text-muted-foreground hover:text-foreground"
            title="テーマの切り替え"
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
