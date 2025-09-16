import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // /choropleth → /estat/response?mode=map にリダイレクト
  if (pathname === '/choropleth') {
    const url = new URL('/estat/response', request.url);

    // 既存のクエリパラメータを保持
    const searchParams = new URLSearchParams(search);
    searchParams.set('mode', 'map');

    url.search = searchParams.toString();

    // 301リダイレクト（永続的なリダイレクト）
    return NextResponse.redirect(url, { status: 301 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};