import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { NAV_GROUPS } from "@/lib/nav-registry";

import { ConsoleNavLinks } from "./console-nav-links";

/**
 * 左サイドメニュー。見本 (shadcndashboard.dev) と同じく inset の Sidebar の中身を白地 + 1px 枠の箱にし、
 * ロゴ行の下に線を引く。メニューの定義は lib/nav-registry.ts。md 未満では Sheet になる。
 */
export function ConsoleSidebar() {
  return (
    <Sidebar collapsible="offcanvas" variant="inset" className="**:data-[slot=sidebar-inner]:border **:data-[slot=sidebar-inner]:bg-background">
      <SidebarHeader className="flex-row items-center justify-between border-b p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5!" render={<Link href="/" />}>
              <ChartNoAxesCombinedIcon className="size-5!" />
              <span className="text-base font-semibold">stats47 管理</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <Badge variant="secondary">local</Badge>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
          <ConsoleNavLinks groups={NAV_GROUPS} />
        </Suspense>
      </SidebarContent>
    </Sidebar>
  );
}
