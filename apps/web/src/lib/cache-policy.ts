/**
 * Cloudflare Workers Cache のレスポンス契約。
 *
 * HTML と React Server Components (RSC) は同じ URL を共有する一方、Workers Cache の
 * 既定キーは RSC 系リクエストヘッダーを含まない。そのため HTML だけを共有キャッシュし、
 * RSC / 認証・プレビュー系 / 非安全メソッドは必ず bypass する。
 */

/** Browser は常に再検証し、Cloudflare edge だけが長期保持する。 */
export const PAGE_BROWSER_CACHE_CONTROL = "public, max-age=0, must-revalidate";
export const PAGE_EDGE_CACHE_CONTROL =
  "public, max-age=86400, stale-while-revalidate=604800, stale-if-error=86400";

export const PRIVATE_PAGE_CACHE_CONTROL = "private, no-store";

export const PAGE_CACHE_TAG = "stats47-html";
export const DATA_CACHE_TAG = "stats47-data";

export const NO_STORE_CACHE_HEADERS = {
  "Cache-Control": PRIVATE_PAGE_CACHE_CONTROL,
} as const;

export const PUBLIC_DATA_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600",
  "Cloudflare-CDN-Cache-Control":
    "public, max-age=86400, stale-while-revalidate=604800, stale-if-error=86400",
  "Cache-Tag": DATA_CACHE_TAG,
} as const;

export const LONG_LIVED_DATA_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400",
  "Cloudflare-CDN-Cache-Control":
    "public, max-age=604800, stale-while-revalidate=604800, stale-if-error=86400",
  "Cache-Tag": DATA_CACHE_TAG,
} as const;

export const DOWNLOAD_DATA_CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400",
  "Cloudflare-CDN-Cache-Control":
    "public, max-age=2592000, stale-while-revalidate=604800, stale-if-error=86400",
  "Cache-Tag": DATA_CACHE_TAG,
} as const;

/** RSC 応答の Content-Type (`next/dist/client/components/app-router-headers` の RSC_CONTENT_TYPE_HEADER)。 */
export const RSC_CONTENT_TYPE = "text/x-component";

const HTML_VARY = "Accept-Encoding";
export const RSC_VARY = [
  "RSC",
  "Next-Router-State-Tree",
  "Next-Router-Prefetch",
  "Next-Router-Segment-Prefetch",
  "Next-Url",
  "Accept-Encoding",
].join(", ");

/**
 * Next.js が **middleware 実行前に request から削除する** flight ヘッダー。
 *
 * `next/dist/server/web/adapter.js` が `NextRequest` を組み立てる直前に
 * `FLIGHT_HEADERS` を `requestHeaders.delete()` する (`if (!isEdgeRendering)`)。
 * そのため middleware の `req.headers` に rsc / next-router-* は **存在しない**。
 * `next-url` は `FLIGHT_HEADERS` に含まれないので middleware でも読める。
 *
 * → RSC 判定の権威は **Worker gateway (raw request)** に置く。middleware 側の
 *   判定は `next-url` / authorization / cookie / method しか当てにできない。
 *   最終的な応答契約は `enforcePageCacheBypass` が gateway で保証する。
 *
 * 正典: Next.js 15.5.24 `dist/client/components/app-router-headers.js` の FLIGHT_HEADERS。
 */
export const NEXT_FLIGHT_REQUEST_HEADERS = [
  "rsc",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-hmr-refresh",
  "next-router-segment-prefetch",
] as const;

const RSC_REQUEST_HEADERS = [
  ...NEXT_FLIGHT_REQUEST_HEADERS,
  "next-url",
  "x-nextjs-data",
] as const;

const PRIVATE_COOKIE_NAMES = new Set([
  "__next_preview_data",
  "__prerender_bypass",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "__Host-authjs.session-token",
]);

type CachePolicyRequest = Pick<Request, "headers" | "method">;

export interface PageCacheHeaders {
  cacheControl: string;
  cloudflareCdnCacheControl?: string;
  vary: string;
  cacheTag?: string;
}

function hasPrivateCookie(headers: Headers): boolean {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return false;

  return cookieHeader.split(";").some((part) => {
    const cookieName = part.trim().split("=", 1)[0];
    return PRIVATE_COOKIE_NAMES.has(cookieName);
  });
}

export function isRscRequest(headers: Headers): boolean {
  return RSC_REQUEST_HEADERS.some((headerName) => headers.has(headerName));
}

export function shouldBypassPageCache(request: CachePolicyRequest): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return true;
  if (request.headers.has("authorization")) return true;
  if (isRscRequest(request.headers)) return true;
  return hasPrivateCookie(request.headers);
}

export function createPageCacheTag(pathname: string): string | null {
  const tag = `stats47-path:${encodeURIComponent(pathname)}`;
  return tag.length <= 1024 ? tag : null;
}

export function createPageCachePurgeTags(pathnames: readonly string[]): string[] {
  return [...new Set(pathnames.map(createPageCacheTag).filter((tag): tag is string => tag !== null))];
}

export function resolvePageCacheHeaders(
  request: CachePolicyRequest,
  pathname: string,
): PageCacheHeaders {
  if (shouldBypassPageCache(request)) {
    return {
      cacheControl: PRIVATE_PAGE_CACHE_CONTROL,
      vary: isRscRequest(request.headers) ? RSC_VARY : HTML_VARY,
    };
  }

  const pathTag = createPageCacheTag(pathname);
  return {
    cacheControl: PAGE_BROWSER_CACHE_CONTROL,
    cloudflareCdnCacheControl: PAGE_EDGE_CACHE_CONTROL,
    vary: HTML_VARY,
    cacheTag: pathTag ? `${PAGE_CACHE_TAG},${pathTag}` : PAGE_CACHE_TAG,
  };
}

/** 応答本体が RSC (flight) payload か。Content-Type だけで決まる。 */
export function isFlightResponse(response: Pick<Response, "headers">): boolean {
  const contentType = response.headers.get("content-type");
  return contentType !== null && contentType.toLowerCase().startsWith(RSC_CONTENT_TYPE);
}

/**
 * 共有キャッシュ指示の最終ゲート。**Worker gateway (raw request) だけが呼ぶ。**
 *
 * middleware は Next.js に flight ヘッダーを剥がされた request しか見られないため
 * (`NEXT_FLIGHT_REQUEST_HEADERS`)、RSC 応答へ HTML 用の
 * `Cloudflare-CDN-Cache-Control` / `Cache-Tag` を付けてしまう。Cloudflare の
 * edge cache key は RSC ヘッダーで分岐しないので、その指示が効くと
 * 1 人分の RSC payload が別の利用者・別 route state へ配られ得る。
 *
 * 判定は 2 系統の OR で、どちらか片方が壊れても共有されない:
 * - request 側: raw header に flight ヘッダーがある (gateway でのみ観測可能)
 * - response 側: Content-Type が `text/x-component` (要求経路に依存しない)
 */
export function enforcePageCacheBypass(
  request: CachePolicyRequest,
  response: Response,
): Response {
  // 1xx は Response コンストラクタが受け付けない (複製できない)。
  if (response.status < 200) return response;
  if (!isRscRequest(request.headers) && !isFlightResponse(response)) return response;

  const alreadyPrivate =
    response.headers.get("cache-control") === PRIVATE_PAGE_CACHE_CONTROL &&
    !response.headers.has("cloudflare-cdn-cache-control") &&
    !response.headers.has("cache-tag");
  if (alreadyPrivate) return response;

  const corrected = new Response(response.body, response);
  corrected.headers.set("Cache-Control", PRIVATE_PAGE_CACHE_CONTROL);
  corrected.headers.set("Vary", RSC_VARY);
  corrected.headers.delete("Cloudflare-CDN-Cache-Control");
  corrected.headers.delete("Cache-Tag");
  return corrected;
}
