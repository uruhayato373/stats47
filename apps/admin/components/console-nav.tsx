import { Suspense } from "react";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { NAV_GROUPS } from "@/lib/nav-registry";

import { ConsoleNavLinks } from "./console-nav-links";
import { ThemeToggle } from "./theme-toggle";

/** 左サイドメニュー (shadcn/ui 公式の Sidebar)。メニューの定義は lib/nav-registry.ts。md 未満では Sheet になる。 */
export function ConsoleSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="px-4 pt-5">
        <span className="block text-sm font-bold leading-tight tracking-tight text-sidebar-foreground">stats47</span>
        <span className="block text-xs text-muted-foreground">管理コンソール</span>
        <span className="mt-1 block text-[11px] text-muted-foreground/70">local · :4747</span>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
          <ConsoleNavLinks groups={NAV_GROUPS} />
        </Suspense>
      </SidebarContent>
      <SidebarFooter className="px-3 pb-4">
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
