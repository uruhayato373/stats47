import { useSession } from "next-auth/react";

/**
 * 認証状態とロール確認を統一するカスタムフック
 */
export function useAuth() {
  const { data: session, status } = useSession();

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isAdmin = session?.user?.role === "admin";

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 useAuth:", {
      isAdmin,
      role: session?.user?.role,
      isAuthenticated,
      username: session?.user?.username,
    });
  }

  return {
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
  };
}
