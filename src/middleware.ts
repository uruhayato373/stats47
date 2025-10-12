import { auth } from "@/lib/auth/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const isAdmin = req.auth?.user?.role === "admin";

  // デバッグログ（開発環境のみ）
  if (process.env.NODE_ENV === "development") {
    console.log("🔐 Middleware:", {
      pathname,
      isLoggedIn,
      isAdmin,
      username: req.auth?.user?.username,
      role: req.auth?.user?.role,
    });
  }

  // 認証が必要なパス
  const protectedPaths = ["/profile", "/admin"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  // 管理者専用パス
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));

  // 未認証ユーザーを保護されたパスから除外
  if (isProtectedPath && !isLoggedIn) {
    const homeUrl = new URL("/", req.url);
    homeUrl.searchParams.set("auth", "true");
    homeUrl.searchParams.set("callbackUrl", pathname);
    console.log("🔐 Redirecting to home with auth modal:", homeUrl.toString());
    return Response.redirect(homeUrl);
  }

  // 非管理者を管理者専用パスから除外
  if (isAdminPath && !isAdmin) {
    console.log("🔐 Redirecting non-admin to home");
    return Response.redirect(new URL("/", req.url));
  }

  // デフォルトは続行
  return;
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
