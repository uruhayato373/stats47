"use client";

import { useCallback, useEffect, useState } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@stats47/components";
import { Separator } from "@stats47/components/atoms/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@stats47/components/atoms/ui/sheet";
import { ArrowLeftRight, BarChart3, BookOpen, Home, LayoutDashboard, MapPin, ScatterChart, Search } from "lucide-react";



import type { Category } from "@/features/category";

import { AdSenseAd, MAIN_SIDEBAR } from "@/lib/google-adsense";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import { usePageType } from "@/hooks/usePageType";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";

import { useSidebarStore } from "@/store/sidebar-store";


import { CategoryAccordion } from "./CategoryAccordion";
import { SidebarErrorState } from "./SidebarErrorState";
import { SidebarPageSection } from "./SidebarPageSection";

interface SidebarClientProps {
  categories: Category[];
  error?: string;
}

const NAV_LINKS = [
  { href: "/", label: "ホーム", icon: Home, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  { href: "/ranking", label: "ランキング", icon: BarChart3, color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
  { href: "/blog", label: "ブログ", icon: BookOpen, color: "bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-400" },
  { href: "/correlation", label: "相関分析", icon: ScatterChart, color: "bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
  { href: "/compare", label: "地域間比較", icon: ArrowLeftRight, color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
  { href: "/areas", label: "地域の特徴", icon: MapPin, color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400" },
  { href: "/themes", label: "テーマ", icon: LayoutDashboard, color: "bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400" },
  { href: "/search", label: "検索", icon: Search, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
] as const;

export function SidebarClient({ categories, error }: SidebarClientProps) {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const open = useSidebarStore((state) => state.open);
  const close = useSidebarStore((state) => state.close);
  const isMobile = useBreakpoint("belowLg");
  const pathname = usePathname();

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (newOpen) { open(); } else { close(); }
    },
    [open, close],
  );

  const [mobileReady, setMobileReady] = useState(false);
  useEffect(() => {
    if (isMobile) {
      close();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync responsive state
      setMobileReady(true);
    } else {
      setMobileReady(false);
    }
  }, [isMobile, close]);

  usePageType();
  useSidebarNavigation({ isMobile });

  const sidebarInner = (
    <div className="flex-1 min-h-0 overflow-y-auto p-2">
      {/* 共通ナビリンク */}
      <div className="mb-2 px-2">
        {NAV_LINKS.map(({ href, label, icon: Icon, color }) => {
          const isActive = href === "/"
            ? pathname === "/"
            : pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                "flex items-center gap-2 px-3 py-1 text-xs font-normal text-foreground/80 rounded-lg transition-colors hover:bg-accent/50 active:bg-accent",
                isActive && "bg-accent text-accent-foreground"
              )}
            >
              <div className={cn("flex h-6 w-6 items-center justify-center rounded-md", color)}>
                <Icon size={15} />
              </div>
              {label}
            </Link>
          );
        })}
      </div>

      <Separator className="my-1.5" />

      {/* カテゴリセクション */}
      <div className="mb-2 px-2">
        <h2 className="mb-0.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          統計カテゴリー
        </h2>
        {error ? (
          <SidebarErrorState error={error} />
        ) : (
          <CategoryAccordion categories={categories} />
        )}
      </div>

      {/* ページ固有セクション */}
      <SidebarPageSection />

      <Separator className="my-1.5" />

      {/* 広告エリア */}
      <div className="px-2 mt-2">
        <AdSenseAd
          format={MAIN_SIDEBAR.format}
          slotId={MAIN_SIDEBAR.slotId}
          showLabel={false}
        />
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={mobileReady && isOpen} onOpenChange={handleOpenChange}>
        <SheetContent side="left" className="p-0 w-60 border-r">
          <SheetTitle className="sr-only">メニュー</SheetTitle>
          <SheetDescription className="sr-only">
            ナビゲーションメニュー
          </SheetDescription>
          <div className="w-full h-full bg-sidebar flex flex-col">
            {sidebarInner}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="hidden lg:block shrink-0 h-full">
      <div className="w-60 min-w-[240px] shrink-0 h-full bg-sidebar border-r border-border flex flex-col">
        {sidebarInner}
      </div>
    </div>
  );
}
