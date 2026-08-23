import { NextRequest, NextResponse } from "next/server";

import { afterAll, beforeAll, describe, expect, test } from "vitest";

import middleware, { isValidPrefCode } from "../middleware";

describe("isValidPrefCode", () => {
  test("01000 から 47000 までの有効な都道府県コードを true と判定する", () => {
    expect(isValidPrefCode("01000")).toBe(true);
    expect(isValidPrefCode("13000")).toBe(true);
    expect(isValidPrefCode("27000")).toBe(true);
    expect(isValidPrefCode("47000")).toBe(true);
  });

  test("prefNum が範囲外のコードを false と判定する", () => {
    expect(isValidPrefCode("00000")).toBe(false);
    expect(isValidPrefCode("48000")).toBe(false);
    expect(isValidPrefCode("99000")).toBe(false);
  });

  test("末尾が 000 でないコードを false と判定する（市区町村コードなど）", () => {
    expect(isValidPrefCode("14100")).toBe(false);
    expect(isValidPrefCode("13101")).toBe(false);
    expect(isValidPrefCode("01001")).toBe(false);
  });

  test("5 桁数字でないコードを false と判定する", () => {
    expect(isValidPrefCode("")).toBe(false);
    expect(isValidPrefCode("1000")).toBe(false);
    expect(isValidPrefCode("100000")).toBe(false);
    expect(isValidPrefCode("abcde")).toBe(false);
    expect(isValidPrefCode("01a00")).toBe(false);
  });
});

describe("middleware Workers Cache headers", () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(headers?: HeadersInit): NextRequest {
    const nextRequest = new NextRequest("https://stats47.jp/", { headers });
    Object.defineProperty(nextRequest, "nextUrl", {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test("通常HTMLには共有cache tagを付ける", () => {
    const response = middleware(request());

    expect(response.headers.get("Cache-Control")).toBe("public, max-age=0, must-revalidate");
    expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toContain("max-age=86400");
    expect(response.headers.get("Cache-Tag")).toBe("stats47-html,stats47-path:%2F");
  });

  test("RSC requestはno-storeかつcache tag無しにする", () => {
    const response = middleware(request({ RSC: "1", "Next-Router-State-Tree": "[]" }));

    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toBeNull();
    expect(response.headers.get("Cache-Tag")).toBeNull();
    expect(response.headers.get("Vary")).toContain("Next-Router-State-Tree");
  });
});

describe("/japan の未登録スラッグは 410 (GEO-SCOPE-SEPARATION-01 WP5)", () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(pathname: string): NextRequest {
    const nextRequest = new NextRequest(`https://stats47.jp${pathname}`);
    Object.defineProperty(nextRequest, "nextUrl", {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test("known な /japan/education-culture は 410 を返さない", () => {
    const response = middleware(request("/japan/education-culture"));
    expect(response.status).not.toBe(410);
  });

  test("未登録スラッグ /japan/not-a-real-theme は 410 を返す (/themes と同型)", () => {
    const response = middleware(request("/japan/not-a-real-theme"));
    expect(response.status).toBe(410);
  });

  test("/japan (トップ、スラッグ無し) は 410 を返さない", () => {
    const response = middleware(request("/japan"));
    expect(response.status).not.toBe(410);
  });
});

describe("動的コンテンツの soft-404 防止", () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(pathname: string): NextRequest {
    const nextRequest = new NextRequest(`https://stats47.jp${pathname}`);
    Object.defineProperty(nextRequest, "nextUrl", {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test("未登録 ranking key は page の notFound に委譲せず 410", () => {
    expect(middleware(request("/ranking/food-consumption-expenditure")).status).toBe(410);
  });

  test("既知 ranking key は通過", () => {
    expect(middleware(request("/ranking/frozen-food-consumption-expenditure")).status).not.toBe(410);
  });

  test("実在する政令指定都市の区は親県 URL で通過", () => {
    expect(middleware(request("/areas/04000/cities/04103")).status).not.toBe(410);
  });

  test("市区町村と親県が不一致なら 410", () => {
    expect(middleware(request("/areas/05000/cities/04103")).status).toBe(410);
  });

  test("存在しない市区町村とカテゴリは 410", () => {
    expect(middleware(request("/areas/04000/cities/04999")).status).toBe(410);
    expect(middleware(request("/areas/04000/cities/04100/not-a-category")).status).toBe(410);
  });

  test("公開記事カタログに無い blog slug は 410、既知記事と tag ハブは通過", () => {
    expect(middleware(request("/blog/BarChartRace")).status).toBe(410);
    expect(middleware(request("/blog/yogurt-spending-prefecture-gap")).status).not.toBe(410);
    expect(middleware(request("/blog/tags")).status).not.toBe(410);
  });
});
