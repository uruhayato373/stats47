import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gzipSync } from "node:zlib";

const mocks = vi.hoisted(() => ({
  s3Send: vi.fn(),
  bindingGet: vi.fn(),
}));

vi.mock("../../clients/get-s3-client", () => ({
  getS3Client: () => ({ send: mocks.s3Send }),
}));

vi.mock("../../clients/get-r2-client", () => ({
  getR2Client: async () => ({ get: mocks.bindingGet }),
}));

import { fetchFromR2 } from "../fetch";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

describe("fetchFromR2 read tier priority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "production";
    process.env.R2_ACCESS_KEY_ID = "access";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_S3_ENDPOINT = "https://example.r2.cloudflarestorage.com";
    process.env.R2_PUBLIC_FETCH_URL = "https://storage.example.test";
    mocks.s3Send.mockResolvedValue({
      Body: {
        transformToByteArray: async () => new TextEncoder().encode("fresh-from-s3"),
      },
    });
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...ORIGINAL_ENV };
    globalThis.fetch = ORIGINAL_FETCH;
  });

  it("S3資格情報と公開URLが共存するCIではfreshなS3 objectを読む", async () => {
    const body = await fetchFromR2("app/stats/example/values.json");

    expect(body?.toString("utf8")).toBe("fresh-from-s3");
    expect(mocks.s3Send).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(mocks.bindingGet).not.toHaveBeenCalled();
  });

  it("S3資格情報が無いbuildでは明示された公開URLを読む", async () => {
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_S3_ENDPOINT;
    vi.mocked(globalThis.fetch).mockResolvedValue(new Response("from-public-url"));

    const body = await fetchFromR2("app/stats/example/values.json");

    expect(body?.toString("utf8")).toBe("from-public-url");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      new URL("https://storage.example.test/app/stats/example/values.json"),
      { redirect: "error" },
    );
    expect(mocks.s3Send).not.toHaveBeenCalled();
    expect(mocks.bindingGet).not.toHaveBeenCalled();
  });

  it("S3のContent-Encoding gzipを透過的に展開する", async () => {
    const source = Buffer.from('{"type":"Topology","arcs":[]}');
    const compressed = gzipSync(source, { level: 9 });
    mocks.s3Send.mockResolvedValue({
      ContentEncoding: "gzip",
      Body: {
        transformToByteArray: async () => compressed,
      },
    });

    const body = await fetchFromR2("gis/mlit-ksj/A42/national/data.topojson");

    expect(body).toEqual(source);
  });

  describe("public URL retries", () => {
    beforeEach(() => {
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.R2_S3_ENDPOINT;
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-11-15T00:00:00Z"));
    });

    it.each([
      [429, "2", 2000],
      [503, "120", 30_000],
      [503, "Sun, 15 Nov 2026 00:00:03 GMT", 3000],
    ])("retries HTTP %i honoring Retry-After %s", async (status, header, delay) => {
      vi.mocked(globalThis.fetch)
        .mockResolvedValueOnce(new Response(null, { status, headers: { "Retry-After": header } }))
        .mockResolvedValueOnce(new Response("recovered"));
      const pending = fetchFromR2("retry.json");
      await vi.advanceTimersByTimeAsync(delay - 1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect((await pending)?.toString()).toBe("recovered");
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      expect(vi.mocked(globalThis.fetch).mock.calls[1]).toEqual(vi.mocked(globalThis.fetch).mock.calls[0]);
      expect(mocks.bindingGet).not.toHaveBeenCalled();
      expect(mocks.s3Send).not.toHaveBeenCalled();
    });

    it.each([429, 503])("stops after two retries on HTTP %i", async (status) => {
      vi.mocked(globalThis.fetch).mockImplementation(async () => new Response(null, { status }));
      const pending = expect(fetchFromR2("retry.json")).rejects.toThrow(`HTTP ${status}`);
      await vi.advanceTimersByTimeAsync(299);
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      expect(globalThis.fetch).toHaveBeenCalledTimes(2);
      await vi.advanceTimersByTimeAsync(600);
      await pending;
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    it("returns null for 404 without retrying", async () => {
      vi.mocked(globalThis.fetch).mockResolvedValue(new Response(null, { status: 404 }));
      expect(await fetchFromR2("missing.json")).toBeNull();
      expect(globalThis.fetch).toHaveBeenCalledTimes(1);
      expect(vi.getTimerCount()).toBe(0);
    });
  });
});
