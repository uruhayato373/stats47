"use client";

import { useSidebarStore } from "@/store/sidebar-store";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AppSidebar } from "./AppSidebar";

/**
 * パス名とセッションに基づいて適切なSidebarを表示するラッパーコンポーネント
 *
 * 表示条件:
 * - /adminパス: AdminSidebarを表示
 * - それ以外: AppSidebarを表示
 * - isOpenがfalseの場合: 非表示
 */
export function SidebarWrapper() {
  const pathname = usePathname();
  const { isOpen } = useSidebarStore();
  const isAdminRoute = pathname.startsWith("/admin");

  if (!isOpen) {
    return null;
  }

  // 管理者サイドバーを表示する条件: 管理者パス（/admin）にいる場合のみ
  return isAdminRoute ? <AdminSidebar /> : <AppSidebar />;
}
