import { headers } from "next/headers";
import { AdminSidebar } from "./AdminSidebar";
import { AppSidebar } from "./AppSidebar";

/**
 * パス名とセッションに基づいて適切なSidebarを表示するラッパーコンポーネント
 *
 * 表示条件:
 * - /adminパス: AdminSidebarを表示
 * - それ以外: AppSidebarを表示
 */
export async function SidebarWrapper() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminRoute = pathname.startsWith("/admin");

  // 管理者サイドバーを表示する条件: 管理者パス（/admin）にいる場合のみ
  return isAdminRoute ? <AdminSidebar /> : <AppSidebar />;
}
