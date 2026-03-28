"use client";

import { useCallback, useState } from "react";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@stats47/components";
import { Button } from "@stats47/components/atoms/ui/button";
import { Input } from "@stats47/components/atoms/ui/input";
import {
  BarChart3,
  Menu,
  Moon,
  NotebookPen,
  Search,
  Sun,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";


import { useTheme } from "@/hooks/useTheme";

import { usePageTypeStore } from "@/store/page-type-store";
import { useSidebarStore } from "@/store/sidebar-store";

/**
 * ナビゲーション項目の型定義
 */
type NavigationItem = {
  type: "ranking" | "blog";
  href: string;
  label: string;
  icon?: LucideIcon;
};

/**
 * ナビゲーション項目の定義
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    type: "ranking",
    href: "/ranking",
    label: "ランキング",
    icon: TrendingUp,
  },
  {
    type: "blog",
    href: "/blog",
    label: "統計ブログ",
    icon: NotebookPen,
  },
] as const;

/**
 * ナビゲーション項目のアクティブ状態を判定
 *
 * @param item - ナビゲーション項目
 * @param pathname - 現在のパス名
 * @returns アクティブな場合はtrue
 */
function isNavigationActive(
  item: NavigationItem,
  pathname: string | null
): boolean {
  if (!pathname) return false;

  switch (item.type) {
    case "ranking":
      return pathname.includes("/ranking");
    case "blog":
      return pathname.startsWith("/blog");
    default:
      return false;
  }
}

/**
 * アプリケーションヘッダーコンポーネント
 * レイアウト構造、ロゴ、テーマ切り替え、認証セクションを提供
 */
export default function Header() {
  const { toggleTheme } = useTheme();
  const { toggle } = useSidebarStore();
  const router = useRouter();
  const pathname = usePathname();
  const { setPageType } = usePageTypeStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    },
    [searchQuery, router]
  );

  return (
    <header
      className="h-16 glass sticky top-0 z-[200]"
      suppressHydrationWarning
    >
      <div className="w-full h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground touch-manipulation"
            aria-label="サイドバーの開閉"
            suppressHydrationWarning
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className="font-bold text-xl flex items-center gap-2"
          >
            <div className="bg-primary text-primary-foreground p-1 rounded">
              <BarChart3 className="h-4 w-4" />
            </div>
            統計で見る都道府県
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {/* 検索フォーム（デスクトップ） */}
          <form onSubmit={handleSearch} className="hidden lg:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="検索..."
                className="pl-10 w-64"
              />
            </div>
          </form>

          {/* デスクトップ用テキストナビゲーション */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAVIGATION_ITEMS.map((item) => {
              const isActive = isNavigationActive(item, pathname);
              return (
                <Link
                  key={item.type}
                  href={item.href}
                  onClick={() => setPageType(item.type)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-md transition",
                    isActive
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
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
      </div>
    </header>
  );
}
