import { auth } from "@/features/auth/lib/auth";
import { headers } from "next/headers";
import { AdminSidebar } from "./AdminSidebar";
import { AppSidebar } from "./AppSidebar";

/**
 * パス名とセッションに基づいて適切なSidebarを表示するラッパーコンポーネント
 *
 * 表示条件:
 * - /adminパス: AdminSidebarを表示
 * - Mock環境 + 管理者セッション: AdminSidebarを表示
 * - それ以外: AppSidebarを表示
 */
export async function SidebarWrapper() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminRoute = pathname.startsWith("/admin");

  // Mock環境かどうかを確認
  const isMockEnv = process.env.NEXT_PUBLIC_USE_MOCK === "true";

  // セッション情報を取得（Mock環境では自動的に管理者セッション）
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  // 管理者サイドバーを表示する条件:
  // 1. 管理者パス（/admin）にいる
  // 2. Mock環境 かつ 管理者としてログインしている
  const shouldShowAdminSidebar = isAdminRoute || (isMockEnv && isAdmin);

  return shouldShowAdminSidebar ? <AdminSidebar /> : <AppSidebar />;
}
