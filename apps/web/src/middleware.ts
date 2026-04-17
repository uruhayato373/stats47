import { type NextRequest, NextResponse } from "next/server";

import { BLOG_SLUG_REDIRECTS } from "@/config/blog-redirects";
import { GONE_BLOG_SLUGS } from "@/config/gone-blog-slugs";
import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { GONE_TAG_KEYS } from "@/config/gone-tag-keys";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";
import { KNOWN_THEME_SLUGS } from "@/config/known-theme-slugs";
import { INDEXABLE_AREA_CATEGORIES_SET } from "@/lib/indexable-area-categories";

/**
 * 410 Gone 応答。Cloudflare エッジやブラウザでキャッシュされないよう no-store を付与する。
 * Cloudflare Cache Rule が 4xx を誤ってキャッシュしても middleware 側で防ぐ defense in depth。
 */
function gone(): Response {
  return new Response(null, {
    status: 410,
    headers: { "Cache-Control": "no-store, must-revalidate" },
  });
}

/**
 * 都道府県コード（01000〜47000）の妥当性判定。
 * 5 桁数字かつ prefNum 01〜47、末尾 `000` のみ有効。
 */
export function isValidPrefCode(code: string): boolean {
  if (!/^\d{5}$/.test(code)) return false;
  const prefNum = parseInt(code.slice(0, 2), 10);
  const suffix = code.slice(2);
  return prefNum >= 1 && prefNum <= 47 && suffix === "000";
}

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
  // 無効 prefCode（例 /administrativefinancial/.../dashboard/00000）は 301→410 チェーンを避け直接 410 を返す。
  if (segments.length >= 4 && OLD_CATEGORY_KEYS.has(segments[0])) {
    const pageType = segments[2]; // "dashboard" or "ranking"
    const key = segments[3];
    if (pageType === "dashboard" && /^\d{5}$/.test(key)) {
      if (!isValidPrefCode(key)) return gone();
      return NextResponse.redirect(new URL(`/areas/${key}`, baseUrl), { status: 301 });
    }
    if (pageType === "ranking" && key) {
      if (GONE_RANKING_KEYS.has(key)) return gone();
      return NextResponse.redirect(new URL(`/ranking/${key}`, baseUrl), { status: 301 });
    }
  }

  // /area-profile/{prefCode}[/...] → /areas/{prefCode}
  if (segments.length >= 2 && segments[0] === "area-profile" && /^\d{5}$/.test(segments[1])) {
    if (!isValidPrefCode(segments[1])) return gone();
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), { status: 301 });
  }

  // /dashboard/{prefCode}/{cat}/{sub} → /areas/{prefCode}
  // 旧URL構造のバリアント（セグメント順序が逆のパターン）
  if (segments.length >= 2 && segments[0] === "dashboard" && /^\d{5}$/.test(segments[1])) {
    if (!isValidPrefCode(segments[1])) return gone();
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), { status: 301 });
  }

  // 旧URL で 410 Gone を返すパターン:
  // - /blog/prefecture-rank/...
  // - /stats/prefecture-rank/...
  if (
    pathname.startsWith("/blog/prefecture-rank/") ||
    pathname.startsWith("/stats/prefecture-rank/")
  ) {
    return gone();
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
      return gone();
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
      return gone();
    }
  }

  // --- /tag/{tagKey} への直接アクセスのうち廃止済みを 410 Gone ---
  // - 日本語 tagKey（現行は英語 slug のみ有効）
  // - GONE_TAG_KEYS に登録済みの廃止英語 slug
  // 該当しない英語 tagKey は /tag/[tagKey] ルートに渡され、DB 照合後 notFound() で 404 を返す可能性がある。
  // 繰り返し GSC に 404 が出る slug はその都度 GONE_TAG_KEYS に追加する。
  {
    const directTagMatch = pathname.match(/^\/tag\/(.+)$/);
    if (directTagMatch) {
      const tagKey = decodeURIComponent(directTagMatch[1]);
      if (/[^\x00-\x7F]/.test(tagKey)) return gone();
      if (GONE_TAG_KEYS.has(tagKey)) return gone();
    }
  }

  // --- ブログ slug 変更の 301 リダイレクト / 完全削除 slug の 410 ---
  if (pathname.startsWith("/blog/")) {
    const slug = pathname.slice("/blog/".length).split("/")[0];
    const newSlug = BLOG_SLUG_REDIRECTS[slug];
    if (newSlug) {
      return NextResponse.redirect(new URL(`/blog/${newSlug}`, req.url), {
        status: 301,
      });
    }
    if (GONE_BLOG_SLUGS.has(slug)) {
      return gone();
    }
  }

  // --- /ranking/prefecture/{slug} → /ranking/{slug} リダイレクト or 410 ---
  // 旧 URL 構造 /ranking/prefecture/xxx は Next.js の /ranking/[rankingKey] 単一セグメントに
  // 一致せず 404 を返していた。GONE_RANKING_KEYS に該当すれば 410、それ以外は 301 で新 URL へ。
  if (pathname.startsWith("/ranking/prefecture/")) {
    const slug = pathname.slice("/ranking/prefecture/".length).split("/")[0];
    if (!slug) return gone();
    if (GONE_RANKING_KEYS.has(slug)) return gone();
    return NextResponse.redirect(new URL(`/ranking/${slug}`, req.url), { status: 301 });
  }

  // --- 削除済みランキングキーへの直接アクセス → 410 Gone ---
  if (pathname.startsWith("/ranking/")) {
    const rankingKey = pathname.slice("/ranking/".length);
    if (GONE_RANKING_KEYS.has(rankingKey)) {
      return gone();
    }
  }

  // --- Fix 6: 未知の ranking キー → 410 Gone（v3: middleware-only 設計）---
  // 2026-04 GSC 調査で `/ranking/任意キー` が常に 200 を返す問題を確認（クロール済み未登録 2,415 の主因）。
  // KNOWN_RANKING_KEYS は git commit された静的 Set（1,899 件）。GONE でも KNOWN でもないキーは
  // 過去存在したことがない or まだ登録されていないキー → Google に「完全削除」シグナル（410）を送る。
  //
  // v1 (d30094c1) と v2 (73b1277b) は page.tsx の dynamicParams=false を併用したが、
  // CI ビルド環境で D1 binding が無く全ページ SSG が notFound 化してサイト崩壊 (revert 0ba2b163)。
  // v3 は page.tsx に触らず middleware だけで対応する設計。
  //
  // 注意: `/ranking` (index) や `/ranking/{key}/{sub}` サブパスは対象外。
  //       split("/")[0] で最初のセグメントのみ判定。
  if (pathname.startsWith("/ranking/")) {
    const rankingKey = pathname.slice("/ranking/".length).split("/")[0];
    if (rankingKey && !KNOWN_RANKING_KEYS.has(rankingKey) && !GONE_RANKING_KEYS.has(rankingKey)) {
      return gone();
    }
  }

  // --- Fix 1: /correlation/{slug} → 410 Gone ---
  // correlation ページは /correlation?x=...&y=... で動作。/correlation/xxx-and-yyy は存在しないルート。
  // Google がクロールして 5xx（タイムアウト）を返していた。
  if (pathname.startsWith("/correlation/")) {
    return gone();
  }

  // --- Fix 2: /dashboard/* → 410 Gone ---
  // 旧 URL 構造の亜種。tryLegacyRedirect がカバーしない /dashboard/00000/* 等を捕捉。
  if (pathname.startsWith("/dashboard") || pathname.includes("/dashboard/")) {
    return gone();
  }

  // --- Fix 4: /areas/{無効コード} → 410 Gone ---
  // /areas/00000, /areas/14100 等の無効な都道府県コードが soft 404 を発生させていた。
  {
    const areaSegments = pathname.split("/").filter(Boolean);
    if (areaSegments[0] === "areas" && areaSegments.length >= 2 && areaSegments[1] !== "cities") {
      const code = areaSegments[1];
      if (/^\d{5}$/.test(code) && !isValidPrefCode(code)) {
        return gone();
      }
    }
  }

  // --- Fix 4.5: /areas/{prefCode}/cities/{cityCode}[/...] → 410 Gone ---
  // 2026-04 GSC 調査で `/areas/13000/cities/13101` が 500、`/areas/11000/cities/11101` が 200
  // と挙動不一致を確認。robots.txt ブロック済みだが middleware で明示的に 410 を返して
  // Google に「完全に削除」シグナルを送る。既存の L231-245 は旧 URL 構造（cities セグメントなし）
  // 用のため、cities セグメントありのパターンは別途処理が必要だった。
  {
    const areaSegments = pathname.split("/").filter(Boolean);
    if (
      areaSegments.length >= 4 &&
      areaSegments[0] === "areas" &&
      areaSegments[2] === "cities" &&
      /^\d{5}$/.test(areaSegments[3])
    ) {
      return gone();
    }
  }

  // --- Fix 5: /blog/{旧カテゴリ名} → 410 Gone ---
  // /blog/construction, /blog/socialsecurity 等がブログスラッグとして解釈され soft 404。
  if (pathname.startsWith("/blog/")) {
    const blogSlug = pathname.slice("/blog/".length).split("/")[0];
    if (OLD_CATEGORY_KEYS.has(blogSlug)) {
      return gone();
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
      return gone();
    }
  }

  // --- Fix 7: /themes/{unknown-slug} → 410 Gone ---
  // /themes/ 配下は静的に ALL_THEMES で定義された 16 slug のみ。動的ルート [themeSlug]/
  // は page.tsx を持たず notFound（404）を返すが、middleware で 410 を返して
  // Google に「完全削除」シグナルを送る。
  if (pathname.startsWith("/themes/")) {
    const slug = pathname.slice("/themes/".length).split("/")[0];
    if (slug && !KNOWN_THEME_SLUGS.has(slug)) {
      return gone();
    }
  }

  // --- Fix 8: /areas/{prefCode}/{non-indexable-category} → 410 Gone ---
  // 2026-04 に INDEXABLE_AREA_CATEGORIES を 13 → 2（population / economy）に削減した。
  // 47 × 11 = 517 URL が「クロール済み - インデックス未登録」に残っているため、
  // /areas/{prefCode}/{削除済みカテゴリ} を明示的に 410 化する。
  // 既存の city-code 410（seg[2] が 5 桁数字）と cities 410 はそれぞれ先に処理されるので、
  // ここでは数字 5 桁・cities・indexable カテゴリを除外した残りの sub を対象とする。
  {
    const seg = pathname.split("/").filter(Boolean);
    if (
      seg.length >= 3 &&
      seg[0] === "areas" &&
      /^\d{5}$/.test(seg[1]) &&
      isValidPrefCode(seg[1]) &&
      seg[2] !== "cities" &&
      !/^\d{5}$/.test(seg[2]) &&
      !INDEXABLE_AREA_CATEGORIES_SET.has(seg[2])
    ) {
      return gone();
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
