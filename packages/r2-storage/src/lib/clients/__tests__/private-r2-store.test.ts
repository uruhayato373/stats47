import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import https from "node:https";
import { EventEmitter } from "node:events";
import { S3Client, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { createR2Store, retryRemoteRead, wranglerTokenProvider } from "../private-r2-store.mjs";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs(); });
describe("shared Node R2 transport", () => {
  it("waits through the near-expiry window and shares one actual refresh", async () => {
    vi.useFakeTimers();
    const now = Date.parse("2026-11-14T00:00:00Z");
    vi.setSystemTime(now);
    const expires = now + 20_000;
    let auth = `oauth_token = "old-test-token"\nexpiration_time = "${new Date(expires).toISOString()}"`;
    vi.spyOn(fs, "readFileSync").mockImplementation(() => auth);
    const renew = vi.fn(async () => {
      expect(Date.now()).toBeGreaterThan(expires);
      auth = 'oauth_token = "new-test-token"\nexpiration_time = "2999-01-01T00:00:00Z"';
    });
    const first = wranglerTokenProvider("near-expiry-test", renew);
    const second = wranglerTokenProvider("near-expiry-test", renew);
    const pending = Promise.all([first(), second()]);
    await vi.advanceTimersByTimeAsync(20_000);
    expect(renew).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(await pending).toEqual(["new-test-token", "new-test-token"]);
    expect(renew).toHaveBeenCalledOnce();
  });
  it.each([500, 502, 503, 504])("retries GET HTTP %i using the existing bounded delays", async (status) => {
    const response = { status: 200, body: Buffer.from("exact bytes") };
    const read = vi.fn().mockResolvedValueOnce({ status }).mockResolvedValueOnce({ status }).mockResolvedValueOnce(response);
    const wait = vi.fn(async () => {});
    expect(await retryRemoteRead(read, "GET", wait)).toBe(response);
    expect(read).toHaveBeenCalledTimes(3);
    expect(wait.mock.calls).toEqual([[300], [600]]);
    const unavailable = vi.fn().mockResolvedValue({ status });
    expect(await retryRemoteRead(unavailable, "GET", wait)).toEqual({ status });
    expect(unavailable).toHaveBeenCalledTimes(3);
  });
  it("honors a bounded server reset for GET 429 and never guesses an unknown limit", async () => {
    const wait = vi.fn(async () => {});
    const read = vi.fn().mockResolvedValueOnce({ status: 429, headers: { "retry-after": "120" } })
      .mockResolvedValueOnce({ status: 429, headers: { ratelimit: '"rtwo_gw_apigw";r=0;t=196' } })
      .mockResolvedValue({ status: 200 });
    expect(await retryRemoteRead(read, "GET", wait)).toEqual({ status: 200 });
    expect(wait.mock.calls).toEqual([[120_000], [196_000]]);
    const limited = vi.fn().mockResolvedValue({ status: 429, headers: { "retry-after": "1" } });
    expect((await retryRemoteRead(limited, "GET", wait)).status).toBe(429);
    expect(limited).toHaveBeenCalledTimes(3);
    for (const headers of [{}, { "retry-after": "invalid" }, { "retry-after": "99999999999999999999999" }]) {
      const unknown = vi.fn().mockResolvedValue({ status: 429, headers });
      await retryRemoteRead(unknown, "GET", wait);
      expect(unknown).toHaveBeenCalledOnce();
    }
    for (const method of ["PUT", "POST", "DELETE", "HEAD"]) {
      const write = vi.fn().mockResolvedValue({ status: 429, headers: { "retry-after": "120" } });
      await retryRemoteRead(write, method, wait);
      expect(write).toHaveBeenCalledOnce();
    }
  });
  it.each(["PUT", "POST", "DELETE", "HEAD"])("never automatically repeats %s after HTTP 500", async (method) => {
    const read = vi.fn().mockResolvedValue({ status: 500 });
    const wait = vi.fn(async () => {});
    expect(await retryRemoteRead(read, method, wait)).toEqual({ status: 500 });
    expect(read).toHaveBeenCalledOnce();
    expect(wait).not.toHaveBeenCalled();
  });
  it("uses S3 HEAD and conditional PUT, preserves write-once and handles only 404 as missing", async () => {
    vi.stubEnv("R2_S3_ENDPOINT", "https://example.test");
    vi.stubEnv("R2_ACCESS_KEY_ID", "test"); vi.stubEnv("R2_SECRET_ACCESS_KEY", "test");
    const send = vi.spyOn(S3Client.prototype, "send");
    send.mockResolvedValue({ ContentLength: 23 } as never);
    const store = createR2Store({ bucket: "stats47-private" });
    expect(store.transport).toBe("s3");
    expect(await store.head("k")).toEqual({ size: 23 });
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
    await store.put("k", Buffer.from("abc"), { ifNoneMatch: true });
    expect(send.mock.calls[1][0]).toBeInstanceOf(PutObjectCommand);
    expect(send.mock.calls[1][0].input).toMatchObject({ IfNoneMatch: "*" });
    await createR2Store({ bucket: "stats47-private", writeOnce: true }).put("k", Buffer.from("abc"));
    expect(send.mock.calls[2][0].input).toMatchObject({ IfNoneMatch: "*" });
    send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 404 } });
    expect(await store.head("k")).toBeNull();
    send.mockResolvedValueOnce({} as never);
    await expect(store.head("k")).rejects.toThrow(/HEAD unavailable/);
    send.mockRejectedValueOnce({ $metadata: { httpStatusCode: 403 } });
    await expect(store.head("k")).rejects.toThrow(/HEAD unavailable/);
  });

  it("paces concurrent bulk REST reads and writes without changing the default store", async () => {
    vi.useFakeTimers(); vi.setSystemTime(0);
    vi.stubEnv("R2_S3_ENDPOINT", ""); vi.stubEnv("R2_ACCESS_KEY_ID", ""); vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account"); vi.stubEnv("HTTPS_PROXY", ""); vi.stubEnv("https_proxy", "");
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "statSync").mockReturnValue({ isDirectory: () => false } as ReturnType<typeof fs.statSync>);
    vi.spyOn(fs, "readFileSync").mockReturnValue('oauth_token = "test-token"\nexpiration_time = "2999-01-01T00:00:00Z"');
    const starts: { method: unknown; at: number }[] = [];
    vi.spyOn(https, "request").mockImplementation(((_url: unknown, options: Record<string, unknown>, callback: (res: EventEmitter) => void) => {
      starts.push({ method: options.method, at: Date.now() });
      return Object.assign(new EventEmitter(), { setTimeout() {}, end() {
        const res = Object.assign(new EventEmitter(), { statusCode: 200, headers: {} });
        callback(res); res.emit("data", Buffer.from("data")); res.emit("end");
      } });
    }) as typeof https.request);
    const store = createR2Store({ bucket: "stats47-private", minimumRequestIntervalMs: 350 });
    const pending = Promise.all([store.get("one"), store.put("two", Buffer.from("data"), { ifNoneMatch: true }), store.get("three")]);
    await vi.advanceTimersByTimeAsync(349);
    expect(starts).toEqual([{ method: "GET", at: 0 }]);
    await vi.advanceTimersByTimeAsync(351);
    await pending;
    expect(starts).toEqual([{ method: "GET", at: 0 }, { method: "PUT", at: 350 }, { method: "GET", at: 700 }]);
    await createR2Store({ bucket: "stats47-private" }).get("interactive");
    expect(starts.at(-1)).toEqual({ method: "GET", at: 700 });
  });

  it("uses Wrangler OAuth for GET / PUT / GET readback, preserving raw gzip bytes without relying on HEAD", async () => {
    vi.stubEnv("R2_S3_ENDPOINT", ""); vi.stubEnv("R2_ACCESS_KEY_ID", ""); vi.stubEnv("R2_SECRET_ACCESS_KEY", "");
    vi.stubEnv("CLOUDFLARE_ACCOUNT_ID", "test-account"); vi.stubEnv("HTTPS_PROXY", ""); vi.stubEnv("https_proxy", "");
    vi.spyOn(fs, "existsSync").mockReturnValue(true);
    vi.spyOn(fs, "statSync").mockReturnValue({ isDirectory: () => false } as ReturnType<typeof fs.statSync>);
    vi.spyOn(fs, "readFileSync").mockReturnValue('oauth_token = "test-token"\nexpiration_time = "2999-01-01T00:00:00Z"');
    const bytes = Buffer.from([31, 139, 8, 0]);
    const calls: { url: string; options: Record<string, unknown>; body?: Buffer }[] = [];
    let status = 200;
    vi.spyOn(https, "request").mockImplementation(((url: URL | string, options: Record<string, unknown>, callback: (res: EventEmitter) => void) => {
      const call = { url: String(url), options, body: undefined as Buffer | undefined }; calls.push(call);
      const req = Object.assign(new EventEmitter(), {
        setTimeout() {},
        end(body?: Buffer) {
          call.body = body;
          const res = Object.assign(new EventEmitter(), { statusCode: options.method === "HEAD" ? 405 : status,
            headers: { "content-length": "4" } });
          callback(res);
          if (options.method === "GET") res.emit("data", bytes);
          res.emit("end");
        },
      });
      return req;
    }) as typeof https.request);
    const store = createR2Store({ bucket: "stats47-private" });
    expect(store.transport).toBe("wrangler-oauth");
    expect(await store.get("path/tab=08.json.gz")).toEqual(bytes);
    await store.put("path/tab=08.json.gz", bytes, { ifNoneMatch: true });
    expect(await store.get("path/tab=08.json.gz")).toEqual(bytes);
    expect(calls.map((c) => c.options.method)).toEqual(["GET", "PUT", "GET"]);
    expect(calls[1].options.headers).toMatchObject({ authorization: "Bearer test-token", "if-none-match": "*", "content-length": "4" });
    expect(calls[1].body).toEqual(bytes);
    expect(calls.every((c) => c.url.startsWith("https://api.cloudflare.com/client/v4/accounts/test-account/r2/buckets/stats47-private/objects/"))).toBe(true);
    expect(calls[0].url).toContain("tab%3D08.json.gz");
    status = 404; expect(await store.get("missing")).toBeNull();
    status = 403; await expect(store.get("forbidden")).rejects.toThrow(/read HTTP 403/);
    await expect(store.head("path/tab=08.json.gz")).rejects.toThrow(/HEAD HTTP 405/);
  });
});
