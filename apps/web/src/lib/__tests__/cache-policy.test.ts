import { describe, expect, it } from "vitest";

import {
  createPageCachePurgeTags,
  PAGE_CACHE_TAG,
  PAGE_BROWSER_CACHE_CONTROL,
  PAGE_EDGE_CACHE_CONTROL,
  PRIVATE_PAGE_CACHE_CONTROL,
  resolvePageCacheHeaders,
} from "../cache-policy";

function request(method = "GET", headers: HeadersInit = {}): Pick<Request, "headers" | "method"> {
  return { method, headers: new Headers(headers) };
}

describe("resolvePageCacheHeaders", () => {
  it("通常のHTML GETだけを共有キャッシュする", () => {
    const headers = resolvePageCacheHeaders(request(), "/ranking/total-population");

    expect(headers).toEqual({
      cacheControl: PAGE_BROWSER_CACHE_CONTROL,
      cloudflareCdnCacheControl: PAGE_EDGE_CACHE_CONTROL,
      vary: "Accept-Encoding",
      cacheTag: `${PAGE_CACHE_TAG},stats47-path:%2Franking%2Ftotal-population`,
    });
  });

  it.each([
    ["RSC", "1"],
    ["Next-Router-State-Tree", "[]"],
    ["Next-Router-Prefetch", "1"],
    ["Next-Router-Segment-Prefetch", "/"],
    ["Next-Url", "/ranking"],
    ["x-nextjs-data", "1"],
  ])("%s requestをno-storeにする", (headerName, value) => {
    const headers = resolvePageCacheHeaders(request("GET", { [headerName]: value }), "/");

    expect(headers.cacheControl).toBe(PRIVATE_PAGE_CACHE_CONTROL);
    expect(headers.cacheTag).toBeUndefined();
    expect(headers.vary).toContain("RSC");
  });

  it.each([
    "__prerender_bypass=value",
    "__next_preview_data=value",
    "next-auth.session-token=value",
    "__Secure-authjs.session-token=value",
  ])("private cookie (%s) を持つrequestをno-storeにする", (cookie) => {
    const headers = resolvePageCacheHeaders(request("GET", { cookie }), "/");
    expect(headers.cacheControl).toBe(PRIVATE_PAGE_CACHE_CONTROL);
  });

  it("表示を変えない解析cookieでは共有キャッシュを維持する", () => {
    const headers = resolvePageCacheHeaders(request("GET", { cookie: "_ga=abc; _gid=def" }), "/");
    expect(headers.cacheControl).toBe(PAGE_BROWSER_CACHE_CONTROL);
    expect(headers.cloudflareCdnCacheControl).toBe(PAGE_EDGE_CACHE_CONTROL);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])("%s requestをno-storeにする", (method) => {
    const headers = resolvePageCacheHeaders(request(method), "/");
    expect(headers.cacheControl).toBe(PRIVATE_PAGE_CACHE_CONTROL);
  });

  it("Authorization requestをno-storeにする", () => {
    const headers = resolvePageCacheHeaders(request("GET", { authorization: "Bearer token" }), "/");
    expect(headers.cacheControl).toBe(PRIVATE_PAGE_CACHE_CONTROL);
  });
});

describe("createPageCachePurgeTags", () => {
  it("同じpathnameを重複なくCache-Tagへ変換する", () => {
    expect(createPageCachePurgeTags(["/", "/blog/example", "/blog/example"])).toEqual([
      "stats47-path:%2F",
      "stats47-path:%2Fblog%2Fexample",
    ]);
  });

  it("Cloudflare上限を超えるtagを生成しない", () => {
    expect(createPageCachePurgeTags([`/${"a".repeat(1100)}`])).toEqual([]);
  });
});
