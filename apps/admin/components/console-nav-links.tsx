"use client";

import { usePathname, useSearchParams } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { isNavItemActive, type NavGroup } from "@/lib/nav-registry";

/** メニュー本体 (公式 Sidebar の Group / Menu)。現在地の判定は lib/nav-registry の純関数。 */
export function ConsoleNavLinks({ groups }: { groups: readonly NavGroup[] }) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));

  return (
    <>
      {groups.map((group, i) => (
        <SidebarGroup key={group.title ?? `group-${i}`}>
          {group.title ? <SidebarGroupLabel>{group.title}</SidebarGroupLabel> : null}
          <SidebarMenu>
            {group.items.map((item) => {
              const active = isNavItemActive(pathname, searchParams, item.href, hrefs);
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={active}>
                    <a href={item.href} aria-current={active ? "page" : undefined}>
                      {item.label}
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
