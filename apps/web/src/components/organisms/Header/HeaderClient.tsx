"use client";

import { useCallback, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@stats47/components";
import { Button } from "@stats47/components/atoms/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@stats47/components/atoms/ui/dropdown-menu";
import { Input } from "@stats47/components/atoms/ui/input";
import {
  BarChart3,
  ChevronDown,
  LayoutDashboard,
  MapPin,
  Menu,
  Moon,
  NotebookPen,
  Search,
  Sun,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { SHELL_WIDTH_CLASS } from "@/components/layout/PageShell";

import { useTheme } from "@/hooks/useTheme";

import { useSidebarStore } from "@/store/sidebar-store";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** active 判定: pathname がこの prefix を含むか */
  match: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/ranking",
    label: "ランキング",
    icon: TrendingUp,
    match: (p) => p.startsWith("/ranking") || p.startsWith("/category"),
  },
  {
    href: "/blog",
    label: "統計ブログ",
    icon: NotebookPen,
    match: (p) => p.startsWith("/blog"),
  },
  {
    href: "/areas",
    label: "都道府県",
    icon: MapPin,
    match: (p) => p.startsWith("/areas"),
  },
];

/** メガメニューに出す curated テーマの最小ナビ情報。 */
interface ThemeNavItem {
  themeKey: string;
  title: string;
}

interface HeaderClientProps {
  themes: ThemeNavItem[];
}

/**
 * アプリケーションヘッダー（Client）
 *
 * PC: ロゴ + ナビ（ランキング / ブログ + テーマ メガメニュー）+ 検索 + テーマ切替。
 * モバイル（lg 未満）: メニューボタンでドロワー（MobileNavDrawer）を開く。
 *
 * 設計仕様: docs/01_技術設計/13_統一レイアウト設計.md
 */
export function HeaderClient({ themes }: HeaderClientProps) {
  const { toggleTheme } = useTheme();
  const toggleDrawer = useSidebarStore((s) => s.toggle);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, router],
  );

  const themesActive = pathname.startsWith("/themes");

  return (
    <header
      className="sticky top-0 z-[200] h-16 border-b bg-background/95 shadow-sm backdrop-blur-xl supports-[backdrop-filter]:bg-background/85"
      suppressHydrationWarning
    >
      <div
        className={cn(
          SHELL_WIDTH_CLASS,
          "flex h-full items-center justify-between gap-4",
        )}
      >
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
            className="group flex items-center gap-2.5"
            aria-label="stats47 ホーム"
          >
            <span className="flex h-9 w-9 items-center justify-center bg-primary text-primary-foreground shadow-sm transition-transform group-hover:-translate-y-0.5">
              <BarChart3 className="h-[18px] w-[18px]" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[17px] font-bold text-foreground">
                stats<span className="text-primary">47</span>
              </span>
              <span className="mt-1 hidden text-[10px] font-medium text-muted-foreground sm:block">
                統計で見る都道府県
              </span>
            </span>
          </Link>
        </div>

        {/* 中央: デスクトップナビ */}
        <nav className="hidden h-full items-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
            const isActive = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex h-full items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}

          {/* テーマ メガメニュー (curated ダッシュボード。category は内部利用に降格) */}
          {themes.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "flex h-16 items-center gap-1.5 border-b-2 px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    themesActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                  aria-label="テーマ一覧"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  テーマ
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-[min(92vw,560px)] p-3"
              >
                <div className="grid grid-cols-2 gap-1">
                  {themes.map((theme) => {
                    const isActive = pathname.startsWith(
                      `/themes/${theme.themeKey}`,
                    );
                    return (
                      <Link
                        key={theme.themeKey}
                        href={`/themes/${theme.themeKey}`}
                        className={cn(
                          "rounded-md px-2.5 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
                        )}
                      >
                        <span className="truncate">{theme.title}</span>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  href="/themes"
                  className="mt-2 block rounded-md px-2.5 py-2 text-sm font-medium text-primary hover:bg-accent/60"
                >
                  すべてのテーマを見る →
                </Link>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* 右: 検索 + テーマ切替 */}
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="統計を検索"
                aria-label="統計を検索"
                className="h-10 w-60 border-border/80 bg-muted/50 pl-10 transition-colors focus-visible:bg-background"
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
            className="relative overflow-hidden text-muted-foreground hover:text-foreground"
            suppressHydrationWarning
          >
            <span className="relative flex h-full w-full items-center justify-center">
              <Sun className="absolute h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </span>
            <span className="sr-only">テーマの切り替え</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
