import { afterEach, describe, expect, it, vi } from "vitest";

import { carryTimestamp, latestTimestamp, readPublishedSnapshot } from "../stable-snapshot";

const build = (data: string) => (ts: string) => ({ generatedAt: ts, data });

describe("carryTimestamp", () => {
  it("中身が前回と同じなら前回の時刻を引き継ぎ、同じバイト列になる (差分反映で送らない)", () => {
    const previous = { generatedAt: "2026-10-01T00:00:00.000Z", data: "a" };
    const r = carryTimestamp(build("a"), { value: previous, timestamp: previous.generatedAt }, "2026-10-10T00:00:00.000Z");
    expect(r).toMatchObject({ timestamp: previous.generatedAt, changed: false });
    expect(JSON.stringify(r.value)).toBe(JSON.stringify(previous));
  });

  it("中身が変わったとき・前回が無いときだけ now になる", () => {
    const now = "2026-10-10T00:00:00.000Z";
    const previous = { generatedAt: "2026-10-01T00:00:00.000Z", data: "a" };
    expect(carryTimestamp(build("b"), { value: previous, timestamp: previous.generatedAt }, now)).toMatchObject({ timestamp: now, changed: true });
    expect(carryTimestamp(build("a"), null, now)).toMatchObject({ timestamp: now, changed: true });
    expect(carryTimestamp(build("a"), { value: previous, timestamp: null }, now)).toMatchObject({ timestamp: now, changed: true });
  });
});

describe("latestTimestamp", () => {
  it("行の updatedAt の最大値、無ければ fallback", () => {
    expect(latestTimestamp([{ updatedAt: "2026-09-01" }, { updatedAt: "2026-10-02" }, { updatedAt: null }], "x")).toBe("2026-10-02");
    expect(latestTimestamp([], "fallback")).toBe("fallback");
  });
});

describe("readPublishedSnapshot", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("404 は null、200 は JSON、それ以外の失敗は例外 (通信失敗を「前回なし」にしない)", async () => {
    const respond = (status: number, body = "{}") => vi.fn(async () => new Response(body, { status }));
    vi.stubGlobal("fetch", respond(404));
    await expect(readPublishedSnapshot("app/x.json", "https://r2.test")).resolves.toBeNull();
    vi.stubGlobal("fetch", respond(200, '{"a":1}'));
    await expect(readPublishedSnapshot("app/x.json", "https://r2.test")).resolves.toEqual({ a: 1 });
    vi.stubGlobal("fetch", respond(503));
    await expect(readPublishedSnapshot("app/x.json", "https://r2.test")).rejects.toThrow("HTTP 503");
    await expect(readPublishedSnapshot("../x.json", "https://r2.test")).rejects.toThrow("不正");
  });
});
