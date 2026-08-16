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
