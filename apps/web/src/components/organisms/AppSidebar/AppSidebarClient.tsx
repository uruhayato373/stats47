'use client';

/**
 * サイドバーのうちブラウザ側で動く小さな部品だけを置く。
 *
 * - SidebarActiveProvider: 現在の URL からサイドバーで現在地にする href を 1 つだけ決める
 * - SidebarNavContent: 導線名 (nav_surface) を PC の 'sidebar' / Sheet の 'sidebar-mobile' で付け分ける
 * - SidebarNavLink: 1 項目のリンク。現在地の印と、Sheet で押したときに閉じる処理だけを持つ
 *
 * リンクの並びと href はサーバー側の AppSidebar (index.tsx) が組み立てる。ここではテーマ定義など
 * 重いデータを import しない。nav_click の送信は共通のクリック監視 (NavClickTracker) が
 * data-nav-surface / data-nav-label から行う。
 */
import { createContext, useContext, useMemo } from 'react';

import { usePathname } from 'next/navigation';

import {
  SidebarContent,
  SidebarMenuButton,
  useSidebar,
} from '@stats47/components/atoms/ui/sidebar';

import Link from '@/components/atoms/SiteLink';

import { navSurfaceProps } from '@/lib/analytics/events';

import { getActiveSidebarHref } from './site-navigation';

const ActiveHrefContext = createContext<string | null>(null);

export function SidebarActiveProvider({
  hrefs,
  children,
}: {
  hrefs: readonly string[];
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  const activeHref = useMemo(
    () => getActiveSidebarHref(pathname, hrefs),
    [pathname, hrefs]
  );
  return (
    <ActiveHrefContext.Provider value={activeHref}>
      {children}
    </ActiveHrefContext.Provider>
  );
}

export function SidebarNavContent({ children }: { children: React.ReactNode }) {
  const { isMobile } = useSidebar();
  return (
    <SidebarContent {...navSurfaceProps(isMobile ? 'sidebar-mobile' : 'sidebar')}>
      {children}
    </SidebarContent>
  );
}

export function SidebarNavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  const activeHref = useContext(ActiveHrefContext);
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = activeHref === href;

  return (
    <SidebarMenuButton
      isActive={isActive}
      data-active={isActive ? 'true' : undefined}
      aria-current={isActive ? 'page' : undefined}
      data-nav-label={label}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
      render={<Link href={href} prefetch={false} />}
    >
      {children}
    </SidebarMenuButton>
  );
}
