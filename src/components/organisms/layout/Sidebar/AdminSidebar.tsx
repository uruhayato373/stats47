import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/atoms/ui/sidebar";
import { getSidebarNavigationItems } from "@/lib/navigation/sidebar-config";
import { Database, FileText, Settings } from "lucide-react";
import { ActiveSidebarMenuButton } from "./ActiveSidebarMenuButton";

/**
 * 管理画面用サイドバー（サーバーコンポーネント）
 * e-STAT API、開発ツール、設定を表示
 */
export function AdminSidebar() {
  const navigationItems = getSidebarNavigationItems();

  return (
    <Sidebar collapsible="none">      
      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <ActiveSidebarMenuButton href="/admin">
                  <Settings className="size-4" />
                  <span>概要</span>
                </ActiveSidebarMenuButton>
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
                  <ActiveSidebarMenuButton href={item.href}>
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </ActiveSidebarMenuButton>
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
                <ActiveSidebarMenuButton href="/admin/database">
                  <Database className="size-4" />
                  <span>データベース</span>
                </ActiveSidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <ActiveSidebarMenuButton href="/admin/logs">
                  <FileText className="size-4" />
                  <span>ログ</span>
                </ActiveSidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
