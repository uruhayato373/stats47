'use client';

/**
 * サイドバーのうちブラウザ側で動く小さな部品だけを置く。
 *
 * - SidebarActiveProvider: 現在の URL からサイドバーで現在地にする href を 1 つだけ決める
 * - SidebarNavContent: 導線名 (nav_surface) を PC の 'sidebar' / Sheet の 'sidebar-mobile' で付け分ける
 * - SidebarNavLink: 1 項目のリンク。現在地の印と、Sheet で押したときに閉じる処理だけを持つ
 * - SidebarCollapsibleGroup: 項目の多いグループ (カテゴリ) の開閉。既定は閉じ、現在地を含むときだけ開く
 *
 * リンクの並びと href はサーバー側の AppSidebar (index.tsx) が組み立てる。ここではテーマ定義など
 * 重いデータを import しない。nav_click の送信は共通のクリック監視 (NavClickTracker) が
 * data-nav-surface / data-nav-label から行う。
 */
import { createContext, useContext, useMemo, useState } from 'react';

import { usePathname } from 'next/navigation';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@stats47/components/atoms/ui/collapsible';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuButton,
  useSidebar,
} from '@stats47/components/atoms/ui/sidebar';
import { ChevronDown } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';

import { navSurfaceProps } from '@/lib/analytics/events';

import { getActiveSidebarHref, SIDEBAR_GROUP_LABEL_CLASS } from './site-navigation';

const ActiveHrefContext = createContext<string | null>(null);

/**
 * 項目の見た目。テンプレートの nav-items と同じく、非選択も font-medium、現在地は bg-primary + text-background。
 * sidebar.tsx の既定 (data-active:bg-sidebar-accent) は変えず、呼び出し側のここで上書きする。
 */
const NAV_LINK_CLASS =
  'font-medium data-active:bg-primary data-active:text-background data-active:hover:bg-primary data-active:hover:text-background';

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
      className={NAV_LINK_CLASS}
      onClick={() => {
        if (isMobile) setOpenMobile(false);
      }}
      render={<Link href={href} prefetch={false} />}
    >
      {children}
    </SidebarMenuButton>
  );
}

/**
 * 開閉できるグループ (shadcn の Collapsible SidebarGroup の組み立て)。
 *
 * 既定は閉じる。現在地がこのグループの中にあれば開き、別の項目からこのグループの中へ移ったときも開く。
 * 閉じている間もリンクは hidden="until-found" で SSR の HTML に残す (検索エンジンとページ内検索が辿れる)。
 */
export function SidebarCollapsibleGroup({
  label,
  hrefs,
  children,
}: {
  label: string;
  hrefs: readonly string[];
  children: React.ReactNode;
}) {
  const activeHref = useContext(ActiveHrefContext);
  const containsActive = activeHref !== null && hrefs.includes(activeHref);
  const [open, setOpen] = useState(containsActive);
  const [prevContainsActive, setPrevContainsActive] = useState(containsActive);
  // 描画中の state 調整 (React 公式の「props の変化で state を合わせる」型)。effect で開くと 1 フレーム閉じて見える
  if (containsActive !== prevContainsActive) {
    setPrevContainsActive(containsActive);
    if (containsActive) setOpen(true);
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          className={`${SIDEBAR_GROUP_LABEL_CLASS} hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
          render={<CollapsibleTrigger />}
        >
          {label}
          <ChevronDown
            aria-hidden="true"
            className="ml-auto transition-transform group-data-open/collapsible:rotate-180"
          />
        </SidebarGroupLabel>
        <CollapsibleContent hiddenUntilFound>{children}</CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
