import { NextResponse } from "next/server";

import { authMiddleware } from "@/features/auth/lib/auth";

export default authMiddleware((req: any) => {
  const { pathname } = req.nextUrl;

  // dashboardからareaへのリダイレクト
  if (pathname.includes("/dashboard/")) {
    const newPath = pathname.replace("/dashboard/", "/area/");
    return NextResponse.redirect(new URL(newPath, req.url), 301);
  }

  // 旧URLから新URLへのリダイレクト
  if (pathname.startsWith("/estat-api/")) {
    const newPath = pathname.replace(
      "/estat-api/",
      "/admin/dev-tools/estat-api/"
    );
    return NextResponse.redirect(new URL(newPath, req.url), 301);
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
  if (isProtectedPath && !req.auth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 非管理者を管理者専用パスから除外
  if (isAdminPath && req.auth?.user?.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // パス名をヘッダーに追加（SidebarWrapperで使用）
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    "/estat-api/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
  ],
};
