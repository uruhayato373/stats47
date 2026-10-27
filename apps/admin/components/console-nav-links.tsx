"use client";

import { ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { isBranch, isNavItemActive, navHrefs, type NavBranch, type NavGroup } from "@/lib/nav-registry";

type IsActive = (href: string) => boolean;

/** 見本 (shadcndashboard.dev) と同じ選択中の形: 主色で塗り、文字は反転・medium。ホバーは主色 5% */
const ITEM = "hover:bg-primary/5 data-active:bg-primary data-active:font-medium data-active:text-primary-foreground";

/** 「チャネル別」などの第二階層。現在地を含む枝だけ開いた状態で描く (doboku-note admin-app の SectionTree と同じ)。 */
function NavBranchItem({ branch, isActive }: { branch: NavBranch; isActive: IsActive }) {
  const open = branch.children.some((child) => isActive(child.href));
  return (
    <Collapsible defaultOpen={open} render={<SidebarMenuItem />} className="group/branch">
      <CollapsibleTrigger render={<SidebarMenuButton className="hover:bg-primary/5" />}>
        <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 opacity-60 transition-transform group-data-[open]/branch:rotate-90" />
        {branch.label}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <SidebarMenuSub>
          {branch.children.map((child) => {
            const active = isActive(child.href);
            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton isActive={active} className={ITEM} render={<a href={child.href} aria-current={active ? "page" : undefined} />}>
                  {child.label}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  );
}

/** メニュー本体 (公式 Sidebar の Group / Menu)。現在地の判定は lib/nav-registry の純関数。 */
export function ConsoleNavLinks({ groups }: { groups: readonly NavGroup[] }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const hrefs = navHrefs(groups);
  const isActive: IsActive = (href) => isNavItemActive(pathname, searchParams, href, hrefs);

  return (
    <>
      {groups.map((group, i) => (
        <SidebarGroup key={group.title ?? `group-${i}`}>
          {group.title ? (
            group.href ? (
              <SidebarGroupLabel
                render={<a href={group.href} aria-current={pathname === group.href ? "page" : undefined} className="font-semibold hover:text-sidebar-foreground" />}
              >
                {group.title}
              </SidebarGroupLabel>
            ) : (
              <SidebarGroupLabel className="font-semibold">{group.title}</SidebarGroupLabel>
            )
          ) : null}
          <SidebarMenu>
            {group.items.map((entry) => {
              if (isBranch(entry)) return <NavBranchItem key={`${group.title}-${entry.label}`} branch={entry} isActive={isActive} />;
              const active = isActive(entry.href);
              return (
                <SidebarMenuItem key={entry.href}>
                  <SidebarMenuButton isActive={active} className={ITEM} render={<a href={entry.href} aria-current={active ? "page" : undefined} />}>
                    {entry.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}
