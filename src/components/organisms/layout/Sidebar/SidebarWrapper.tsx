import { headers } from "next/headers";
import { AdminSidebar } from "./AdminSidebar";
import { AppSidebar } from "./AppSidebar";

/**
 * パス名に基づいて適切なSidebarを表示するラッパーコンポーネント（サーバーコンポーネント）
 */
export async function SidebarWrapper() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminRoute = pathname.startsWith("/admin");

  return isAdminRoute ? <AdminSidebar /> : <AppSidebar />;
}
