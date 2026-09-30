"use client";

import { ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

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

/** 「チャネル別」などの第二階層。現在地を含む枝だけ開いた状態で描く (doboku-note admin-app の SectionTree と同じ)。 */
function NavBranchItem({ branch, isActive }: { branch: NavBranch; isActive: IsActive }) {
  const open = branch.children.some((child) => isActive(child.href));
  return (
    <SidebarMenuItem>
      <details className="group/branch" open={open}>
        <SidebarMenuButton asChild>
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <ChevronRight aria-hidden="true" className="size-3.5 shrink-0 opacity-60 transition-transform group-open/branch:rotate-90" />
            {branch.label}
          </summary>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {branch.children.map((child) => {
            const active = isActive(child.href);
            return (
              <SidebarMenuSubItem key={child.href}>
                <SidebarMenuSubButton asChild isActive={active}>
                  <a href={child.href} aria-current={active ? "page" : undefined}>
                    {child.label}
                  </a>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      </details>
    </SidebarMenuItem>
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
          {group.title ? <SidebarGroupLabel>{group.title}</SidebarGroupLabel> : null}
          <SidebarMenu>
            {group.items.map((entry) => {
              if (isBranch(entry)) return <NavBranchItem key={`${group.title}-${entry.label}`} branch={entry} isActive={isActive} />;
              const active = isActive(entry.href);
              return (
                <SidebarMenuItem key={entry.href}>
                  <SidebarMenuButton asChild isActive={active}>
                    <a href={entry.href} aria-current={active ? "page" : undefined}>
                      {entry.label}
                    </a>
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
