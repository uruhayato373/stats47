import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/atoms/ui/sidebar";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import Link from "next/link";
import { Settings, Database, FileText } from "lucide-react";

/**
 * 管理画面用サイドバー
 * e-STAT API、開発ツール、設定を表示
 */
export function AdminSidebar() {
  const { navigationItems, isActiveLink } = useSidebarNavigation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-3">
        <h2 className="text-lg font-semibold">管理画面</h2>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActiveLink("/admin")}>
                  <Link href="/admin">
                    <Settings className="size-4" />
                    <span>概要</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* e-STAT API Section */}
        <SidebarGroup>
          <SidebarGroupLabel>e-STAT API</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.estat.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActiveLink(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Development Tools */}
        <SidebarGroup>
          <SidebarGroupLabel>開発ツール</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActiveLink("/admin/database")}>
                  <Link href="/admin/database">
                    <Database className="size-4" />
                    <span>データベース</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActiveLink("/admin/logs")}>
                  <Link href="/admin/logs">
                    <FileText className="size-4" />
                    <span>ログ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
