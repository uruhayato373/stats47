"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "./AppSidebar";
import { AdminSidebar } from "./AdminSidebar";

/**
 * パス名に基づいて適切なSidebarを表示するラッパーコンポーネント
 */
export function SidebarWrapper() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin");

  return isAdminRoute ? <AdminSidebar /> : <AppSidebar />;
}
