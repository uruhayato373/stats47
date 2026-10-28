'use client';

/**
 * サイドバーのうちブラウザ側で動く小さな部品だけを置く。
 *
 * - SidebarActiveProvider: 現在の URL からサイドバーで現在地にする href を 1 つだけ決める
 * - SidebarNavContent / SidebarNavSurface: 導線名 (nav_surface) を PC の 'sidebar' / Sheet の 'sidebar-mobile' で付け分ける
 * - SidebarNavLink: 1 項目のリンク。現在地の印と、Sheet で押したときに閉じる処理だけを持つ
 * - SidebarNavSubLink: 開閉できる項目の下に並ぶリンク (SidebarMenuSubButton)。役割は SidebarNavLink と同じ
 * - SidebarCollapsibleGroup: グループ (カテゴリ・テーマ) の開閉。既定は開き、利用者が閉じられる
 * - SidebarCollapsibleItem: テーマの 5 系統の開閉 (テンプレートの nav-collapse)。既定は閉じ、現在地を含むときだけ開く
 *
 * リンクの並びと href はサーバー側の AppSidebar (index.tsx) が組み立てる。ここではテーマ定義など
 * 重いデータを import しない。nav_click の送信は共通のクリック監視 (NavClickTracker) が
 * data-nav-surface / data-nav-label から行う。
 * 閉じているグループ・項目の中のリンクも hidden="until-found" で SSR の HTML に残す
 * (検索エンジンとページ内検索が辿れる)。
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
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  useSidebar,
} from '@stats47/components/atoms/ui/sidebar';
import { ChevronDown, ChevronRight } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';

import { navSurfaceProps } from '@/lib/analytics/events';

import { getActiveSidebarHref } from './site-navigation';

const ActiveHrefContext = createContext<string | null>(null);

/**
 * 項目の見た目。テンプレートの nav-items と同じく行の高さ 36px + 上下 2px (1 行 40px)・横の余白 px-3・
 * 非選択も font-medium、現在地は bg-primary + text-background。
 * sidebar.tsx の既定 (h-8・data-active:bg-sidebar-accent) は変えず、呼び出し側のここで上書きする。
 */
const NAV_LINK_CLASS =
  'my-0.5 h-9 px-3 font-medium data-active:bg-primary data-active:text-background data-active:hover:bg-primary data-active:hover:text-background';

/** 開閉できる項目の下のリンク。テンプレートの nav-collapse の子 (px-2 py-1 my-1) と同じ寸法 */
const NAV_SUB_LINK_CLASS =
  'my-0.5 h-8 px-2 data-active:bg-primary/5 data-active:font-medium data-active:text-primary';

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

/** SidebarContent の外 (SidebarFooter) のリンクにも同じ導線名を付ける */
export function SidebarNavSurface({ children }: { children: React.ReactNode }) {
  const { isMobile } = useSidebar();
  return <div {...navSurfaceProps(isMobile ? 'sidebar-mobile' : 'sidebar')}>{children}</div>;
}

function useNavLinkState(href: string, matchActive: boolean) {
  const activeHref = useContext(ActiveHrefContext);
  const { isMobile, setOpenMobile } = useSidebar();
  const isActive = matchActive && activeHref === href;
  return {
    isActive,
    linkProps: {
      'data-active': isActive ? 'true' : undefined,
      'aria-current': isActive ? ('page' as const) : undefined,
      onClick: () => {
        if (isMobile) setOpenMobile(false);
      },
    },
  };
}

export function SidebarNavLink({
  href,
  label,
  matchActive = true,
  className,
  children,
}: {
  href: string;
  label: string;
  /** false にすると現在地の印を付けない (同じ href の別項目が現在地を持つ出口のリンク) */
  matchActive?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { isActive, linkProps } = useNavLinkState(href, matchActive);

  return (
    <SidebarMenuButton
      isActive={isActive}
      {...linkProps}
      data-nav-label={label}
      className={className ? `${NAV_LINK_CLASS} ${className}` : NAV_LINK_CLASS}
      render={<Link href={href} prefetch={false} />}
    >
      {children}
    </SidebarMenuButton>
  );
}

export function SidebarNavSubLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  const { isActive, linkProps } = useNavLinkState(href, true);

  return (
    <SidebarMenuSubButton
      isActive={isActive}
      {...linkProps}
      data-nav-label={label}
      className={NAV_SUB_LINK_CLASS}
      render={<Link href={href} prefetch={false} />}
    >
      <span>{label}</span>
    </SidebarMenuSubButton>
  );
}

/** 現在地がこの中にあるか。別の項目からこの中へ移ったときに開くため、変化を描画中に state へ反映する */
function useOpenOnActive(hrefs: readonly string[], defaultOpen: boolean) {
  const activeHref = useContext(ActiveHrefContext);
  const containsActive = activeHref !== null && hrefs.includes(activeHref);
  const [open, setOpen] = useState(defaultOpen || containsActive);
  const [prevContainsActive, setPrevContainsActive] = useState(containsActive);
  // 描画中の state 調整 (React 公式の「props の変化で state を合わせる」型)。effect で開くと 1 フレーム閉じて見える
  if (containsActive !== prevContainsActive) {
    setPrevContainsActive(containsActive);
    if (containsActive) setOpen(true);
  }
  return [open, setOpen] as const;
}

/**
 * 開閉できるグループ (shadcn の Collapsible SidebarGroup の組み立て)。既定は開く (defaultOpen で閉じられる)。
 * 現在地を含むときは既定にかかわらず開く。見出しは SidebarGroupLabel の既定の見た目のまま使う。
 */
export function SidebarCollapsibleGroup({
  label,
  hrefs,
  defaultOpen = true,
  children,
}: {
  label: string;
  hrefs: readonly string[];
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useOpenOnActive(hrefs, defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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

/**
 * 開閉できる項目 (テンプレートの nav-collapse: アイコン + 名前 + 右端の矢印、子は左線付きで字下げ)。
 * 既定は閉じる (defaultOpen で開ける)。現在地を含むときは既定にかかわらず開く。
 */
export function SidebarCollapsibleItem({
  label,
  hrefs,
  icon,
  defaultOpen = false,
  children,
}: {
  label: string;
  hrefs: readonly string[];
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useOpenOnActive(hrefs, defaultOpen);

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/collapsible"
      render={<SidebarMenuItem />}
    >
      <SidebarMenuButton className={NAV_LINK_CLASS} render={<CollapsibleTrigger />}>
        {icon}
        <span>{label}</span>
        <ChevronRight
          aria-hidden="true"
          className="ml-auto transition-transform group-data-open/collapsible:rotate-90"
        />
      </SidebarMenuButton>
      <CollapsibleContent hiddenUntilFound>
        <SidebarMenuSub>{children}</SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}
