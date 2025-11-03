"use client";

import Link from "next/link";

import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
} from "lucide-react";

import { HeaderAuthSection } from "@/features/auth/components/HeaderAuthSection";

import { useTheme } from "@/hooks/useTheme";

import { useSidebarStore } from "@/store/sidebar-store";

/**
 * アプリケーションヘッダーコンポーネント
 * レイアウト構造、ロゴ、テーマ切り替え、認証セクションを提供
 */
export default function Header() {
  const { toggleTheme } = useTheme();
  const { toggle } = useSidebarStore();

  return (
    <header className="sticky top-0 z-[60] w-full flex flex-wrap md:justify-start md:flex-nowrap bg-background text-sm py-2.5 border-b border-border">
      <nav className="px-4 sm:px-5.5 flex basis-full items-center w-full mx-auto">
        {/* Left: Sidebar Toggle Button + Logo */}
        <div className="w-full flex items-center gap-x-1.5">
          <button
            onClick={toggle}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-4" />
            <span className="sr-only">Toggle sidebar</span>
          </button>

          {/* Logo */}
          <ul className="flex items-center gap-1.5">
            <li className="inline-flex items-center relative pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-border after:rounded-full after:-translate-y-1/2 after:rotate-12">
              <Link
                href="/"
                className="flex items-center gap-x-1.5 text-muted-foreground hover:text-foreground focus:outline-hidden focus:text-foreground transition-colors"
              >
                <div className="size-8 rounded-md flex items-center justify-center bg-primary hover:bg-primary/90 transition-colors">
                  <svg
                    className="size-4 text-primary-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9,22 9,12 15,12 15,22" />
                  </svg>
                </div>
                <span className="text-foreground font-medium">
                  統計で見る都道府県
                </span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Right: Navigation Icons + Theme Toggle + Auth Section */}
        <div className="ms-auto flex items-center gap-x-2">
          {/* Navigation Icons: Dashboard, Ranking, Blog */}
          <ul className="flex items-center gap-1">
            <li className="inline-flex items-center relative pe-1 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-border after:rounded-full after:-translate-y-1/2 after:rotate-12">
              <Link
                href="/"
                className="inline-flex flex-col items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 gap-0.5"
                aria-label="Dashboard"
              >
                <LayoutDashboard className="size-4" />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  dashboard
                </span>
              </Link>
            </li>
            <li className="inline-flex items-center relative pe-1 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-border after:rounded-full after:-translate-y-1/2 after:rotate-12">
              <Link
                href="/"
                className="inline-flex flex-col items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 gap-0.5"
                aria-label="Ranking"
              >
                <BarChart3 className="size-4" />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  ranking
                </span>
              </Link>
            </li>
            <li className="inline-flex items-center">
              <Link
                href="/blog"
                className="inline-flex flex-col items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground px-3 py-2 gap-0.5"
                aria-label="Blog"
              >
                <BookOpen className="size-4" />
                <span className="text-[10px] leading-tight text-muted-foreground">
                  blog
                </span>
              </Link>
            </li>
          </ul>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
            aria-label="Toggle theme"
          >
            <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </button>

          {/* Auth Section */}
          <HeaderAuthSection />
        </div>
      </nav>
    </header>
  );
}
