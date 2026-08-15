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

const HTML_VARY = "Accept-Encoding";
const RSC_VARY = [
  "RSC",
  "Next-Router-State-Tree",
  "Next-Router-Prefetch",
  "Next-Router-Segment-Prefetch",
  "Next-Url",
  "Accept-Encoding",
].join(", ");

const RSC_REQUEST_HEADERS = [
  "rsc",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-router-segment-prefetch",
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
