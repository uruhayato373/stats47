import { type NextRequest, NextResponse } from "next/server";

import { BLOG_SLUG_REDIRECTS } from "@/config/blog-redirects";
import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";

/**
 * 旧URL構造のカテゴリキー一覧
 * /{categoryKey}/{subcategoryKey}/ranking/{rankingKey} や
 * /{categoryKey}/{subcategoryKey}/dashboard/{prefCode} の判定に使用
 */
const OLD_CATEGORY_KEYS = new Set([
  "administrativefinancial",
  "agriculture",
  "commercial",
  "construction",
  "economy",
  "educationsports",
  "energy",
  "ict",
  "infrastructure",
  "international",
  "laborwage",
  "landweather",
  "miningindustry",
  "population",
  "safetyenvironment",
  "socialsecurity",
  "tourism",
]);

/**
 * 旧URL → 新URL の 301 リダイレクトを試行する。
 * マッチしなければ null を返す。
 */
function tryLegacyRedirect(pathname: string, baseUrl: string): Response | null {
  const segments = pathname.split("/").filter(Boolean);

  // /{cat}/{sub}/dashboard/{prefCode} → /areas/{prefCode}
  // /{cat}/{sub}/ranking/{rankingKey} → /ranking/{rankingKey}
  if (segments.length >= 4 && OLD_CATEGORY_KEYS.has(segments[0])) {
    const pageType = segments[2]; // "dashboard" or "ranking"
    const key = segments[3];
    if (pageType === "dashboard" && /^\d{5}$/.test(key)) {
      return NextResponse.redirect(new URL(`/areas/${key}`, baseUrl), { status: 301 });
    }
    if (pageType === "ranking" && key) {
      if (GONE_RANKING_KEYS.has(key)) {
        return new Response(null, { status: 410 });
      }
      return NextResponse.redirect(new URL(`/ranking/${key}`, baseUrl), { status: 301 });
    }
  }

  // /area-profile/{prefCode}[/...] → /areas/{prefCode}
  if (segments.length >= 2 && segments[0] === "area-profile" && /^\d{5}$/.test(segments[1])) {
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), { status: 301 });
  }

  // /dashboard/{prefCode}/{cat}/{sub} → /areas/{prefCode}
  // 旧URL構造のバリアント（セグメント順序が逆のパターン）
  if (segments.length >= 2 && segments[0] === "dashboard" && /^\d{5}$/.test(segments[1])) {
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), { status: 301 });
  }

  // 旧URL で 410 Gone を返すパターン:
  // - /blog/prefecture-rank/...
  // - /stats/prefecture-rank/...
  if (
    pathname.startsWith("/blog/prefecture-rank/") ||
    pathname.startsWith("/stats/prefecture-rank/")
  ) {
    return new Response(null, { status: 410 });
  }

  if (segments.length >= 2 && segments.length <= 3 && OLD_CATEGORY_KEYS.has(segments[0])) {
    // /{cat}/{sub} or /{cat}/{sub}/dashboard or /{cat}/{sub}/ranking
    // → /category/{cat} カテゴリランキング一覧へ 301 リダイレクト
    return NextResponse.redirect(new URL(`/category/${segments[0]}`, baseUrl), { status: 301 });
  }

  // OLD_CATEGORY_KEYS にマッチしない旧URL構造（サブカテゴリ先頭等）
  // /econohousehold-economy/... のようなパターンに 410 Gone を返す
  if (
    segments.length >= 3 &&
    (segments.includes("dashboard") || segments.includes("ranking"))
  ) {
    const hasPrefCode = segments.some((s) => /^\d{5}$/.test(s));
    if (hasPrefCode) {
      return new Response(null, { status: 410 });
    }
  }

  return null;
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- www → 非www リダイレクト（301 Permanent） ---
  const host = req.headers.get("host") || "";
  if (host.startsWith("www.")) {
    const url = new URL(pathname, "https://stats47.jp");
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // --- Trailing slash の正規化（301 Permanent） ---
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = new URL(pathname.slice(0, -1), req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // --- /blog/tags/{tagKey} or /blog/tag/{tagKey} → 410 Gone ---
  // 旧パスは全て廃止。現行は /tag/{tagKey} のみ。
  // 301 リダイレクトするとリダイレクト先が 404 のケース（記事0件タグ）で
  // Google に「壊れたリダイレクト」と判定されるため、全て 410 で統一。
  {
    const tagMatch = pathname.match(/^\/blog\/tags?\/(.+)$/);
    if (tagMatch) {
      return new Response(null, { status: 410 });
    }
  }

  // --- /tag/{日本語tagKey} への直接アクセス → 410 Gone ---
  {
    const directTagMatch = pathname.match(/^\/tag\/(.+)$/);
    if (directTagMatch) {
      const tagKey = decodeURIComponent(directTagMatch[1]);
      if (/[^\x00-\x7F]/.test(tagKey)) {
        return new Response(null, { status: 410 });
      }
    }
  }

  // --- ブログ slug 変更の 301 リダイレクト ---
  if (pathname.startsWith("/blog/")) {
    const slug = pathname.slice("/blog/".length);
    const newSlug = BLOG_SLUG_REDIRECTS[slug];
    if (newSlug) {
      return NextResponse.redirect(new URL(`/blog/${newSlug}`, req.url), {
        status: 301,
      });
    }
  }

  // --- 削除済みランキングキーへの直接アクセス → 410 Gone ---
  if (pathname.startsWith("/ranking/")) {
    const rankingKey = pathname.slice("/ranking/".length);
    if (GONE_RANKING_KEYS.has(rankingKey)) {
      return new Response(null, { status: 410 });
    }
  }

  // --- Fix 1: /correlation/{slug} → 410 Gone ---
  // correlation ページは /correlation?x=...&y=... で動作。/correlation/xxx-and-yyy は存在しないルート。
  // Google がクロールして 5xx（タイムアウト）を返していた。
  if (pathname.startsWith("/correlation/")) {
    return new Response(null, { status: 410 });
  }

  // --- Fix 2: /dashboard/* → 410 Gone ---
  // 旧 URL 構造の亜種。tryLegacyRedirect がカバーしない /dashboard/00000/* 等を捕捉。
  if (pathname.startsWith("/dashboard") || pathname.includes("/dashboard/")) {
    return new Response(null, { status: 410 });
  }

  // --- Fix 4: /areas/{無効コード} → 410 Gone ---
  // /areas/00000, /areas/14100 等の無効な都道府県コードが soft 404 を発生させていた。
  {
    const areaSegments = pathname.split("/").filter(Boolean);
    if (areaSegments[0] === "areas" && areaSegments.length >= 2 && areaSegments[1] !== "cities") {
      const code = areaSegments[1];
      if (/^\d{5}$/.test(code)) {
        const prefNum = parseInt(code.slice(0, 2), 10);
        const suffix = code.slice(2);
        if (prefNum < 1 || prefNum > 47 || suffix !== "000") {
          return new Response(null, { status: 410 });
        }
      }
    }
  }

  // --- Fix 5: /blog/{旧カテゴリ名} → 410 Gone ---
  // /blog/construction, /blog/socialsecurity 等がブログスラッグとして解釈され soft 404。
  if (pathname.startsWith("/blog/")) {
    const blogSlug = pathname.slice("/blog/".length).split("/")[0];
    if (OLD_CATEGORY_KEYS.has(blogSlug)) {
      return new Response(null, { status: 410 });
    }
  }

  // --- 旧URL構造の 301 リダイレクト / 410 Gone ---
  const legacyResponse = tryLegacyRedirect(pathname, req.url);
  if (legacyResponse) return legacyResponse;

  // --- 市区町村 URL → 410 Gone ---
  // /areas/{areaCode}/{5桁cityCode}[/...] は市区町村ページ。robots.txt でブロック済みのため
  // 301 リダイレクトではなく 410 Gone を返す（リダイレクト先がブロック済みだと GSC で二重問題になる）
  {
    const areaSegments = pathname.split("/").filter(Boolean);
    if (
      areaSegments.length >= 3 &&
      areaSegments[0] === "areas" &&
      areaSegments[1] !== "cities" &&
      /^\d{5}$/.test(areaSegments[2]) &&
      areaSegments[2] !== areaSegments[1] // cityCode !== areaCode（自分自身ではない）
    ) {
      return new NextResponse(null, { status: 410 });
    }
  }

  // --- カテゴリ URL リダイレクト ---
  // /{categoryKey} → /category/{categoryKey}
  {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 1 && OLD_CATEGORY_KEYS.has(segments[0])) {
      return NextResponse.redirect(new URL(`/category/${segments[0]}`, req.url), { status: 301 });
    }
  }

  // /areas/{areaCode}?category={key} → /areas/{areaCode}/{key} へ 301 リダイレクト
  if (pathname.startsWith("/areas/") && req.nextUrl.searchParams.has("category")) {
    const pathSegments = pathname.split("/").filter(Boolean);
    // /areas/{areaCode} or /areas/{areaCode}/{cityCode} のパターンに対応
    if (pathSegments.length >= 2) {
      const categoryKey = req.nextUrl.searchParams.get("category");
      if (categoryKey) {
        const newUrl = new URL(`${pathname}/${categoryKey}`, req.url);
        // ranking パラメータは維持
        const ranking = req.nextUrl.searchParams.get("ranking");
        if (ranking) {
          newUrl.searchParams.set("ranking", ranking);
        }
        return NextResponse.redirect(newUrl, { status: 301 });
      }
    }
  }

  // /ranking?subcategory=xxx → /ranking へ 301 リダイレクト（旧URL互換）
  if (pathname === "/ranking" && req.nextUrl.searchParams.has("subcategory")) {
    const url = new URL("/ranking", req.url);
    return NextResponse.redirect(url, { status: 301 });
  }

  // /blog?q=xxx 等 → /search?type=blog&... へ 301 リダイレクト
  if (pathname === "/blog") {
    const sp = req.nextUrl.searchParams;
    const blogParamKeys = ["q", "tags", "year", "month"];
    if (blogParamKeys.some((key) => sp.has(key))) {
      const url = new URL("/search", req.url);
      url.searchParams.set("type", "blog");
      for (const key of blogParamKeys) {
        const value = sp.get(key);
        if (value) url.searchParams.set(key, value);
      }
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  // パス名ヘッダーの追加
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    /*
     * すべてのパスにマッチするが、以下を除外:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコン)
     * - static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
