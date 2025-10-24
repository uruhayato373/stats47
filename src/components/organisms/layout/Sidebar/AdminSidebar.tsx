import { getSidebarNavigationItems } from "@/lib/navigation/sidebar-config";
import { Database, FileText, Settings } from "lucide-react";
import Link from "next/link";
import { ActiveSidebarMenuButton } from "./ActiveSidebarMenuButton";

/**
 * 管理画面用サイドバー（サーバーコンポーネント）
 *
 * 表示条件:
 * - /admin パスにアクセスしている場合
 * - Mock環境で管理者としてログインしている場合
 *
 * 機能:
 * - e-STAT API管理
 * - 開発ツール（データベース、ログ）
 * - 設定
 */
export function AdminSidebar() {
  const navigationItems = getSidebarNavigationItems();

  return (
    <div className="w-64 h-full bg-sidebar border-r border-border flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Dashboard */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Dashboard
          </h3>
          <div className="space-y-1">
            <ActiveSidebarMenuButton href="/admin">
              <Settings className="size-4" />
              <span>概要</span>
            </ActiveSidebarMenuButton>
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* e-STAT API Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            e-STAT API
          </h3>
          <div className="space-y-1">
            {navigationItems.estat.map((item) => (
              <ActiveSidebarMenuButton key={item.href} href={item.href}>
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </ActiveSidebarMenuButton>
            ))}
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* Development Tools */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            開発ツール
          </h3>
          <div className="space-y-1">
            <ActiveSidebarMenuButton href="/admin/database">
              <Database className="size-4" />
              <span>データベース</span>
            </ActiveSidebarMenuButton>
            <ActiveSidebarMenuButton href="/admin/logs">
              <FileText className="size-4" />
              <span>ログ</span>
            </ActiveSidebarMenuButton>
          </div>
        </div>
      </div>
    </div>
  );
}
