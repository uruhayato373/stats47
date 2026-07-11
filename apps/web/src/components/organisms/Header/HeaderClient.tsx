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
    <header className="h-16 glass sticky top-0 z-[200]" suppressHydrationWarning>
      <div className={cn(SHELL_WIDTH_CLASS, "flex h-full items-center justify-between")}>
        {/* 左: モバイルメニュー + ロゴ */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDrawer}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="メニューを開く"
            suppressHydrationWarning
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 text-[15px] font-bold"
          >
            <span className="rounded-md bg-primary p-1 text-primary-foreground">
              <BarChart3 className="h-3.5 w-3.5" />
            </span>
            <span className="hidden sm:inline">統計で見る都道府県</span>
            <span className="sm:hidden">統計47</span>
          </Link>
        </div>

        {/* 中央: デスクトップナビ */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
            const isActive = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
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
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    themesActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
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
                placeholder="検索..."
                className="w-56 pl-10"
              />
            </div>
          </form>

          <Link
            href="/search"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            aria-label="検索"
          >
            <Search className="h-5 w-5" />
          </Link>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="テーマの切り替え"
            className="relative overflow-hidden"
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
