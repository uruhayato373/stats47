import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 旧URLから新URLへのリダイレクト
  if (pathname.startsWith("/estat-api/")) {
    const newPath = pathname.replace(
      "/estat-api/",
      "/admin/dev-tools/estat-api/"
    );
    return NextResponse.redirect(new URL(newPath, request.url), 301); // 恒久的リダイレクト
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/estat-api/:path*"],
};
