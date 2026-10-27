import { Suspense } from "react";
import { ChartNoAxesCombinedIcon } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NAV_GROUPS } from "@/lib/nav-registry";

import { ConsoleNavLinks } from "./console-nav-links";

/** 左サイドメニュー (公式 dashboard-01 の app-sidebar と同じ形・inset)。メニューの定義は lib/nav-registry.ts。md 未満では Sheet になる。 */
export function ConsoleSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!" render={<a href="/" />}>
              <ChartNoAxesCombinedIcon className="size-5!" />
              <span className="text-base font-semibold">stats47 管理</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
          <ConsoleNavLinks groups={NAV_GROUPS} />
        </Suspense>
      </SidebarContent>
    </Sidebar>
  );
}
