import { type NextRequest, NextResponse } from "next/server";

import { UrlPolicy } from "@/lib/url-policy";

import { BLOG_SLUG_REDIRECTS } from "@/config/blog-redirects";

/**
 * 410 Gone 応答（CDN cacheable + noindex 強化）。
 *
 * Phase 9 (2026-04-26) で `no-store, must-revalidate` から変更。
 * - 旧設定では Google が毎回 origin に再確認し、クロール予算を 410 URL 群に吸収させていた
 * - CDN キャッシュ可能化により Google の再確認頻度が下がり、新コンテンツへ予算が回る
 * - X-Robots-Tag: noindex も併用して削除シグナル強化
 *
 * 公式根拠: https://developers.google.com/search/docs/crawling-indexing/http-caching
 */
function gone(): Response {
  return new Response(null, {
    status: 410,
    headers: {
      "Cache-Control": "public, max-age=86400, s-maxage=604800",
      "X-Robots-Tag": "noindex",
    },
  });
}

/**
 * 旧URL構造のカテゴリキー一覧。
 * /{cat}/{sub}/dashboard|ranking/{x} などのレガシーパス判定に使用。
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
 * `isValidPrefCode` は UrlPolicy から再 export（既存テスト互換のため）。
 */
export const isValidPrefCode = UrlPolicy.area.isValidPrefCode;

// ============================================================================
// Section 1: 旧 URL 構造の 301 リダイレクト / 410 Gone
// ============================================================================
// Phase 9 (2026-04-26): リダイレクト先が unknown / gone なら 301 ではなく直接 410
// （301→410 チェーン解消で Google の「壊れたリダイレクト」判定を回避）。

function tryLegacyRedirect(pathname: string, baseUrl: string): Response | null {
  const segments = pathname.split("/").filter(Boolean);

  // /{cat}/{sub}/dashboard/{prefCode} → /areas/{prefCode}
  // /{cat}/{sub}/ranking/{rankingKey} → /ranking/{rankingKey}
  if (segments.length >= 4 && OLD_CATEGORY_KEYS.has(segments[0])) {
    const pageType = segments[2];
    const key = segments[3];
    if (pageType === "dashboard" && /^\d{5}$/.test(key)) {
      if (!UrlPolicy.area.isValidPrefCode(key)) return gone();
      return NextResponse.redirect(new URL(`/areas/${key}`, baseUrl), { status: 301 });
    }
    if (pageType === "ranking" && key) {
      // 301→410 チェーン解消: KNOWN にない or GONE なら直接 410
      if (UrlPolicy.ranking.isGone(key) || !UrlPolicy.ranking.isKnown(key)) return gone();
      return NextResponse.redirect(new URL(`/ranking/${key}`, baseUrl), { status: 301 });
    }
  }

  // /area-profile/{prefCode} → /areas/{prefCode}
  if (segments.length >= 2 && segments[0] === "area-profile" && /^\d{5}$/.test(segments[1])) {
    if (!UrlPolicy.area.isValidPrefCode(segments[1])) return gone();
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), { status: 301 });
  }

  // /dashboard/{prefCode}/... → /areas/{prefCode}（旧 URL のセグメント順序違いバリアント）
  if (segments.length >= 2 && segments[0] === "dashboard" && /^\d{5}$/.test(segments[1])) {
    if (!UrlPolicy.area.isValidPrefCode(segments[1])) return gone();
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), { status: 301 });
  }

  // 完全廃止のパスは 410 Gone
  if (
    pathname.startsWith("/blog/prefecture-rank/") ||
    pathname.startsWith("/stats/")
  ) {
    return gone();
  }

  // /{cat}/{sub}[/dashboard|/ranking] → /category/{cat} に集約 301
  if (segments.length >= 2 && segments.length <= 3 && OLD_CATEGORY_KEYS.has(segments[0])) {
    return NextResponse.redirect(new URL(`/category/${segments[0]}`, baseUrl), { status: 301 });
  }

  // OLD_CATEGORY_KEYS にマッチしない旧URL構造（subcategory 先頭等）+ dashboard/ranking + prefCode
  if (
    segments.length >= 3 &&
    (segments.includes("dashboard") || segments.includes("ranking"))
  ) {
    if (segments.some((s) => /^\d{5}$/.test(s))) {
      return gone();
    }
  }

  return null;
}

// ============================================================================
// Section 2: コンテンツタイプ別 Allowlist 判定
// ============================================================================
// 各コンテンツタイプの未登録 / 削除済 key を 410 化して Google に削除シグナル送信。
// Phase 9 で Fix 6 / Fix 7 / Fix 9 / 旧 ranking ロジック等の重複を 1 関数に集約。

function checkContentTypePolicy(pathname: string): Response | null {
  // /ranking/prefecture/{slug} → /ranking/{slug} へ 301（known なら）/ 直接 410（unknown なら）
  if (pathname.startsWith("/ranking/prefecture/")) {
    const slug = pathname.slice("/ranking/prefecture/".length).split("/")[0];
    if (!slug) return gone();
    // 301→410 チェーン解消: KNOWN にない or GONE なら直接 410
    if (UrlPolicy.ranking.isGone(slug) || !UrlPolicy.ranking.isKnown(slug)) return gone();
    return NextResponse.redirect(new URL(`/ranking/${slug}`, "https://stats47.jp"), { status: 301 });
  }

  // /ranking/{key}: GONE または unknown は 410（一括判定で重複削除）
  if (pathname.startsWith("/ranking/")) {
    const rankingKey = pathname.slice("/ranking/".length).split("/")[0];
    if (rankingKey) {
      if (UrlPolicy.ranking.isGone(rankingKey) || !UrlPolicy.ranking.isKnown(rankingKey)) {
        return gone();
      }
    }
  }

  // /tag/{tagKey}: 日本語 tagKey / GONE / 未登録 すべて 410
  {
    const directTagMatch = pathname.match(/^\/tag\/([^/]+)\/?$/);
    if (directTagMatch) {
      const tagKey = decodeURIComponent(directTagMatch[1]);
      if (/[^\x00-\x7F]/.test(tagKey)) return gone();
      if (UrlPolicy.tag.isGone(tagKey) || !UrlPolicy.tag.isKnown(tagKey)) return gone();
    }
  }

  // /blog/tags?/{key}: 旧パス完全廃止 → 410
  if (/^\/blog\/tags?\/.+/.test(pathname)) {
    return gone();
  }

  // /blog/{slug}: redirect → 301、GONE → 410、旧カテゴリ名 → 410
  if (pathname.startsWith("/blog/")) {
    const slug = pathname.slice("/blog/".length).split("/")[0];
    if (slug) {
      const newSlug = BLOG_SLUG_REDIRECTS[slug];
      if (newSlug) {
        return NextResponse.redirect(
          new URL(`/blog/${newSlug}`, "https://stats47.jp"),
          { status: 301 },
        );
      }
      if (UrlPolicy.blog.isGone(slug)) return gone();
      // 旧カテゴリ名が blog slug として解釈されるパターン
      if (OLD_CATEGORY_KEYS.has(slug)) return gone();
    }
  }

  // /correlation: 探索 UI は廃止し、各ランキングページの「相関が高い指標」セクションに
  // 内部リンクで誘導する設計に移行（CorrelationSection 経由）。
  // /correlation 本体・配下パス・query 版すべて 410。
  if (pathname === "/correlation" || pathname.startsWith("/correlation/")) {
    return gone();
  }

  // /dashboard/* (legacy redirect でカバーされない亜種を捕捉)
  if (pathname.startsWith("/dashboard") || pathname.includes("/dashboard/")) {
    return gone();
  }

  // /themes/{unknown-slug} → 410
  if (pathname.startsWith("/themes/")) {
    const slug = pathname.slice("/themes/".length).split("/")[0];
    if (slug && !UrlPolicy.theme.isKnown(slug)) {
      return gone();
    }
  }

  return null;
}

// ============================================================================
// Section 3: /areas/* の判定（無効 prefCode / cities / 非 indexable category）
// ============================================================================

function checkAreasPolicy(pathname: string): Response | null {
  const seg = pathname.split("/").filter(Boolean);
  if (seg[0] !== "areas") return null;

  // /areas/{無効5桁コード}: cities セグメント以外は 410
  if (seg.length >= 2 && seg[1] !== "cities") {
    if (/^\d{5}$/.test(seg[1]) && !UrlPolicy.area.isValidPrefCode(seg[1])) {
      return gone();
    }
  }

  // /areas/{prefCode}/cities/{cityCode}[/...] → 410（市区町村ページは廃止）
  if (
    seg.length >= 4 &&
    seg[2] === "cities" &&
    /^\d{5}$/.test(seg[3])
  ) {
    return gone();
  }

  // /areas/{prefCode}/{5桁数字} → 410（cityCode が areaCode 直下にきた異常パターン）
  if (
    seg.length >= 3 &&
    seg[1] !== "cities" &&
    /^\d{5}$/.test(seg[2]) &&
    seg[2] !== seg[1]
  ) {
    return gone();
  }

  // /areas/{prefCode}/{non-indexable-category} → 410
  // INDEXABLE_AREA_CATEGORIES = [population, economy] のみ通す
  if (
    seg.length >= 3 &&
    /^\d{5}$/.test(seg[1]) &&
    UrlPolicy.area.isValidPrefCode(seg[1]) &&
    seg[2] !== "cities" &&
    !/^\d{5}$/.test(seg[2]) &&
    !UrlPolicy.area.isIndexableCategory(seg[2])
  ) {
    return gone();
  }

  return null;
}

// ============================================================================
// Middleware Entry Point
// ============================================================================

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- ホスト正規化: www → 非 www（301）---
  const host = req.headers.get("host") || "";
  if (host.startsWith("www.")) {
    const url = new URL(pathname, "https://stats47.jp");
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // --- Trailing slash 正規化（301）---
  if (pathname !== "/" && pathname.endsWith("/")) {
    const url = new URL(pathname.slice(0, -1), req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // --- Section 2: コンテンツタイプ別 Allowlist 判定 ---
  const contentResponse = checkContentTypePolicy(pathname);
  if (contentResponse) return contentResponse;

  // --- Section 1: 旧 URL 構造の 301/410 ---
  const legacyResponse = tryLegacyRedirect(pathname, req.url);
  if (legacyResponse) return legacyResponse;

  // --- Section 3: /areas/* の判定 ---
  const areasResponse = checkAreasPolicy(pathname);
  if (areasResponse) return areasResponse;

  // --- 既存ルートへの query → path 正規化 301 ---
  // /{categoryKey} → /category/{categoryKey}
  {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 1 && OLD_CATEGORY_KEYS.has(segments[0])) {
      return NextResponse.redirect(
        new URL(`/category/${segments[0]}`, req.url),
        { status: 301 },
      );
    }
  }

  // /areas/{areaCode}?category={key} → /areas/{areaCode}/{key}
  if (pathname.startsWith("/areas/") && req.nextUrl.searchParams.has("category")) {
    const pathSegments = pathname.split("/").filter(Boolean);
    if (pathSegments.length >= 2) {
      const categoryKey = req.nextUrl.searchParams.get("category");
      if (categoryKey) {
        const newUrl = new URL(`${pathname}/${categoryKey}`, req.url);
        const ranking = req.nextUrl.searchParams.get("ranking");
        if (ranking) newUrl.searchParams.set("ranking", ranking);
        return NextResponse.redirect(newUrl, { status: 301 });
      }
    }
  }

  // /ranking?subcategory=... → /ranking
  if (pathname === "/ranking" && req.nextUrl.searchParams.has("subcategory")) {
    return NextResponse.redirect(new URL("/ranking", req.url), { status: 301 });
  }

  // /blog?q=... → /search?type=blog&...
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

  // パス名ヘッダーの追加（page.tsx 側で利用）
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Phase 9 P2-B (2026-04-26): Vary ヘッダ最小化
  // Next.js は RSC 用に `Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch,
  // Next-Router-Segment-Prefetch` を全レスポンスに付与する。
  // Google は `Vary: Accept-Encoding` 以外を無視する仕様だが、Cloudflare 等の CDN は
  // Vary ヘッダごとにキャッシュ variant を保持するため、不要な Vary はキャッシュ効率を悪化させる。
  // RSC navigation は req に `RSC: 1` ヘッダが付くのでその場合のみ Next.js デフォルトを尊重し、
  // 通常リクエスト（Googlebot / 初回 HTML 取得）は Accept-Encoding のみに固定する。
  const isRscRequest = req.headers.get("RSC") === "1";
  if (!isRscRequest) {
    response.headers.set("Vary", "Accept-Encoding");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * すべてのパスにマッチ。除外:
     * - _next/static / _next/image / favicon / 静的アセット
     * - api/ ルート（middleware を通す必要なし、Phase 9 で明示）
     */
    "/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
