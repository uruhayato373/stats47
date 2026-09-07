import { describe, expect, it } from "vitest";

import {
  createPageCachePurgeTags,
  enforcePageCacheBypass,
  isFlightResponse,
  NEXT_FLIGHT_REQUEST_HEADERS,
  PAGE_CACHE_TAG,
  PAGE_BROWSER_CACHE_CONTROL,
  PAGE_EDGE_CACHE_CONTROL,
  PRIVATE_PAGE_CACHE_CONTROL,
  RSC_CONTENT_TYPE,
  RSC_VARY,
  resolvePageCacheHeaders,
} from "../cache-policy";

function request(method = "GET", headers: HeadersInit = {}): Pick<Request, "headers" | "method"> {
  return { method, headers: new Headers(headers) };
}

/**
 * `next/dist/server/web/adapter.js` が middleware 実行前に行う削除を再現する。
 * これを通さないテストは production の middleware を模していない。
 */
function asSeenByMiddleware(raw: Request): Pick<Request, "headers" | "method"> {
  const headers = new Headers(raw.headers);
  for (const name of NEXT_FLIGHT_REQUEST_HEADERS) headers.delete(name);
  return { method: raw.method, headers };
}

/** middleware が返した policy をそのまま応答ヘッダーへ載せる (middleware.ts と同じ手順)。 */
function responseFromMiddleware(
  policy: ReturnType<typeof resolvePageCacheHeaders>,
  contentType: string,
): Response {
  const headers = new Headers({
    "Content-Type": contentType,
    "Cache-Control": policy.cacheControl,
    Vary: policy.vary,
  });
  if (policy.cloudflareCdnCacheControl) {
    headers.set("Cloudflare-CDN-Cache-Control", policy.cloudflareCdnCacheControl);
  }
  if (policy.cacheTag) headers.set("Cache-Tag", policy.cacheTag);
  return new Response("payload", { headers });
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

describe("middleware は flight ヘッダーを観測できない (Next.js の仕様)", () => {
  it.each(NEXT_FLIGHT_REQUEST_HEADERS)(
    "%s は NextRequest に届かないので middleware は共有キャッシュを指示してしまう",
    (headerName) => {
      const raw = new Request("https://stats47.jp/", { headers: { [headerName]: "1" } });

      // 欠陥ではなく Next.js adapter の仕様。だから gateway で是正する必要がある。
      const policy = resolvePageCacheHeaders(asSeenByMiddleware(raw), "/");
      expect(policy.cacheControl).toBe(PAGE_BROWSER_CACHE_CONTROL);
      expect(policy.cacheTag).toBeDefined();
    },
  );

  it("next-url は FLIGHT_HEADERS に含まれないので middleware でも判定できる", () => {
    const raw = new Request("https://stats47.jp/", { headers: { "Next-Url": "/ranking" } });
    expect(resolvePageCacheHeaders(asSeenByMiddleware(raw), "/").cacheControl).toBe(
      PRIVATE_PAGE_CACHE_CONTROL,
    );
  });
});

describe("enforcePageCacheBypass", () => {
  it.each(NEXT_FLIGHT_REQUEST_HEADERS)(
    "%s の RSC 応答から共有キャッシュ指示を取り除く (production 再現)",
    (headerName) => {
      const raw = new Request("https://stats47.jp/", { headers: { [headerName]: "1" } });
      const fromMiddleware = responseFromMiddleware(
        resolvePageCacheHeaders(asSeenByMiddleware(raw), "/"),
        RSC_CONTENT_TYPE,
      );

      // 修正前はここで public + cache-tag のまま外へ出ていた。
      const corrected = enforcePageCacheBypass(raw, fromMiddleware);

      expect(corrected.headers.get("cache-control")).toBe(PRIVATE_PAGE_CACHE_CONTROL);
      expect(corrected.headers.has("cloudflare-cdn-cache-control")).toBe(false);
      expect(corrected.headers.has("cache-tag")).toBe(false);
      expect(corrected.headers.get("vary")).toBe(RSC_VARY);
    },
  );

  it("request 側が無印でも Content-Type が flight なら共有させない", () => {
    const raw = new Request("https://stats47.jp/");
    const corrected = enforcePageCacheBypass(
      raw,
      responseFromMiddleware(resolvePageCacheHeaders(request(), "/"), `${RSC_CONTENT_TYPE};charset=utf-8`),
    );

    expect(corrected.headers.get("cache-control")).toBe(PRIVATE_PAGE_CACHE_CONTROL);
    expect(corrected.headers.has("cache-tag")).toBe(false);
  });

  it("通常の HTML 応答は同一オブジェクトのまま通す", () => {
    const raw = new Request("https://stats47.jp/");
    const html = responseFromMiddleware(
      resolvePageCacheHeaders(request(), "/"),
      "text/html; charset=utf-8",
    );

    const passed = enforcePageCacheBypass(raw, html);

    expect(passed).toBe(html);
    expect(passed.headers.get("cache-control")).toBe(PAGE_BROWSER_CACHE_CONTROL);
    expect(passed.headers.get("cloudflare-cdn-cache-control")).toBe(PAGE_EDGE_CACHE_CONTROL);
    expect(passed.headers.get("cache-tag")).toBe(`${PAGE_CACHE_TAG},stats47-path:%2F`);
  });

  it("既に no-store の応答は複製しない", () => {
    const raw = new Request("https://stats47.jp/", { headers: { RSC: "1" } });
    const already = new Response("payload", {
      headers: { "Content-Type": RSC_CONTENT_TYPE, "Cache-Control": PRIVATE_PAGE_CACHE_CONTROL },
    });

    expect(enforcePageCacheBypass(raw, already)).toBe(already);
  });

  it("body を持てない status でも複製できる", () => {
    const raw = new Request("https://stats47.jp/old", { headers: { RSC: "1" } });
    const redirect = new Response(null, {
      status: 301,
      headers: { Location: "/new", "Cache-Control": PAGE_BROWSER_CACHE_CONTROL, "Cache-Tag": PAGE_CACHE_TAG },
    });

    const corrected = enforcePageCacheBypass(raw, redirect);

    expect(corrected.status).toBe(301);
    expect(corrected.headers.get("location")).toBe("/new");
    expect(corrected.headers.get("cache-control")).toBe(PRIVATE_PAGE_CACHE_CONTROL);
    expect(corrected.headers.has("cache-tag")).toBe(false);
  });
});

describe("isFlightResponse", () => {
  it.each([
    [RSC_CONTENT_TYPE, true],
    [`${RSC_CONTENT_TYPE};charset=utf-8`, true],
    ["TEXT/X-COMPONENT", true],
    ["text/html; charset=utf-8", false],
    ["application/json", false],
  ])("Content-Type %s → %s", (contentType, expected) => {
    expect(isFlightResponse(new Response(null, { headers: { "Content-Type": contentType } }))).toBe(
      expected,
    );
  });

  it("Content-Type なしは flight ではない", () => {
    expect(isFlightResponse(new Response(null))).toBe(false);
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
